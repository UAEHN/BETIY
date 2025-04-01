import { User } from './supabase';

// دالة مساعدة لتنظيف بيانات المصادقة المخزنة
export const cleanAuthStorage = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('beity-auth-storage');
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      console.log('تم تنظيف بيانات المصادقة المخزنة');
    } catch (e) {
      console.error('خطأ أثناء تنظيف بيانات المصادقة:', e);
    }
  }
};

// تسجيل مستخدم جديد باستخدام البريد الإلكتروني وكلمة المرور
export const signUp = async (
  email: string,
  password: string,
  name: string,
  username: string
): Promise<{ user: User | null; error: any }> => {
  try {
    console.log('Starting signup process for:', email);
    
    // استيراد دينامي للحفاظ على التوافق مع SSR
    const { supabase } = await import('./supabase');
    
    // التحقق من عدم وجود مستخدم بنفس اسم المستخدم
    const { data: existingUsername, error: usernameError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();
      
    if (existingUsername) {
      console.error('Username already exists:', username);
      return { 
        user: null, 
        error: { 
          code: '23505', 
          message: `duplicate key value violates unique constraint "users_username_key"` 
        } 
      };
    }
    
    // إنشاء حساب جديد مع تعطيل تأكيد البريد الإلكتروني للتطوير
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          username: username,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      console.error('Auth error during signup:', authError);
      return { user: null, error: authError };
    }

    console.log('Auth signup response:', authData);

    if (!authData.user) {
      console.error('No user returned from auth signup');
      return { user: null, error: new Error('فشل في إنشاء المستخدم') };
    }

    // التحقق مما إذا كان المستخدم موجودًا بالفعل في جدول المستخدمين
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
      
    if (!checkError && existingUser) {
      console.log('User already exists in users table, skipping insert');
      return {
        user: existingUser as User,
        error: null,
      };
    }

    // إضافة معلومات إضافية للمستخدم في جدول المستخدمين، مع تحديث Display name في Auth
    const { data: userData, error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: email,
          name,
          username,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        },
      ])
      .select()
      .single();

    // تحديث display_name في auth.users
    const { error: updateDisplayNameError } = await supabase.auth.updateUser({
      data: { 
        name: name  // الاسم يُستخدم بواسطة Supabase لعرضه في Display name
      }
    });

    if (updateDisplayNameError) {
      console.error('Error updating user name:', updateDisplayNameError);
    }

    if (profileError) {
      console.error('Profile error during signup:', profileError);
      
      // محاولة تسجيل الدخول تلقائيًا بعد التسجيل
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // حتى لو فشل إنشاء الملف الشخصي، فإن المستخدم لا يزال مسجلاً في نظام المصادقة
      return {
        user: {
          id: authData.user.id,
          email: email,
          name,
          username,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        } as User,
        error: new Error('تم إنشاء الحساب ولكن فشل في حفظ معلومات الملف الشخصي')
      };
    }

    console.log('User profile created successfully:', userData);
    
    // تسجيل الدخول تلقائيًا بعد التسجيل
    await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return {
      user: userData as User,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error during signup:', error);
    return { user: null, error };
  }
};

// تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
export const signIn = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: any }> => {
  try {
    console.log('Starting signin process for:', email);
    
    // استيراد دينامي للحفاظ على التوافق مع SSR
    const { supabase } = await import('./supabase');
    
    // التحقق من توفر اتصال بالإنترنت وصلاحية عنوان Supabase
    if (typeof window !== 'undefined') {
      try {
        const onlineStatus = navigator.onLine;
        if (!onlineStatus) {
          console.error('No internet connection');
          return { user: null, error: new Error('لا يوجد اتصال بالانترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.') };
        }
      } catch (err) {
        console.error('Error checking online status:', err);
      }
    }
    
    // إعادة محاولة تسجيل الدخول عدة مرات في حالة فشل الاتصال
    let authData;
    let authError;
    let retries = 3;
    
    while (retries > 0) {
      try {
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        authData = result.data;
        authError = result.error;
        
        // إذا نجحت العملية أو كان هناك خطأ غير متعلق بالاتصال، نخرج من الحلقة
        if (authData?.user || (authError && !authError.message?.includes('fetch'))) {
          break;
        }
        
        // إذا كان الخطأ متعلقًا بالاتصال، ننتظر قليلاً ونحاول مرة أخرى
        if (authError) {
          console.log(`Attempt failed (${3 - retries + 1}/3). Retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (e) {
        console.error(`Error during signin attempt ${3 - retries + 1}:`, e);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      retries--;
    }

    if (authError) {
      console.error('Auth error during signin:', authError);
      if (authError.message?.includes('fetch')) {
        return { user: null, error: new Error('فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت أو المحاولة لاحقًا.') };
      }
      return { user: null, error: authError };
    }

    if (!authData || !authData.user) {
      console.error('No user returned from auth signin');
      return { user: null, error: new Error('فشل في تسجيل الدخول') };
    }

    console.log('Auth signin response:', authData);

    // التحقق من وجود display_name وتحديثه إذا لم يكن موجوداً
    if (!authData.user.user_metadata?.name) {
      const { error: updateNameError } = await supabase.auth.updateUser({
        data: { 
          name: authData.user.user_metadata?.username || 
               email.split('@')[0] 
        }
      });

      if (updateNameError) {
        console.error('Error updating name during signin:', updateNameError);
      }
    }

    // جلب معلومات المستخدم من جدول المستخدمين
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('User data fetch error during signin:', userError);
      
      // إذا لم نتمكن من العثور على بيانات المستخدم، نحاول إنشاءها
      if (userError.code === 'PGRST116') { // No rows returned
        const userName = authData.user.user_metadata?.display_name || 
                        authData.user.user_metadata?.name || 
                        email.split('@')[0];
        const generatedUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
        
        const { data: newUserData, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              name: userName,
              username: generatedUsername,
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`,
            },
          ])
          .select()
          .single();
          
        if (insertError) {
          console.error('Failed to create missing user profile:', insertError);
          return { user: null, error: new Error('تم تسجيل الدخول ولكن فشل في استرداد أو إنشاء الملف الشخصي') };
        }
        
        return { user: newUserData as User, error: null };
      }
      
      return { user: null, error: userError };
    }

    console.log('User signin successful with profile data');
    return { user: userData as User, error: null };
  } catch (error) {
    console.error('Unexpected error during signin:', error);
    if (error instanceof Error && error.message?.includes('fetch')) {
      return { user: null, error: new Error('فشل الاتصال بالخادم. يرجى التحقق من إعدادات Supabase ومتغيرات البيئة.') };
    }
    return { user: null, error };
  }
};

// تسجيل الخروج
export const signOut = async (): Promise<{ error: any }> => {
  try {
    console.log('Starting signout process');
    
    // استيراد دينامي للحفاظ على التوافق مع SSR
    const { supabase } = await import('./supabase');
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error during signout:', error);
      return { error };
    }
    console.log('Signout successful');
    return { error: null };
  } catch (error) {
    console.error('Unexpected error during signout:', error);
    return { error };
  }
};

// الحصول على المستخدم الحالي
export const getCurrentUser = async (): Promise<{ user: User | null; error: any }> => {
  try {
    console.log('Getting current user');
    
    // استيراد دينامي للحفاظ على التوافق مع SSR
    const { supabase } = await import('./supabase');
    
    // اختبار وجود جلسة أولاً
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error getting current user:', sessionError);
      
      // التحقق من نوع الخطأ - إذا كان متعلقًا بـ JWT نقوم بتنظيف التخزين
      if (sessionError.message?.includes('JWT') || 
          sessionError.message?.includes('User from sub claim in JWT does not exist')) {
        console.log('خطأ JWT - تنظيف التخزين المحلي');
        cleanAuthStorage();
      }
      
      return { user: null, error: sessionError };
    }
    
    if (!sessionData.session) {
      console.log('No active session found');
      return { user: null, error: null };
    }
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error getting current user:', authError);
      
      // التحقق من نوع الخطأ - إذا كان متعلقًا بـ JWT نقوم بتنظيف التخزين
      if (authError.message?.includes('JWT') || 
          authError.message?.includes('User from sub claim in JWT does not exist')) {
        console.log('خطأ JWT - تنظيف التخزين المحلي');
        cleanAuthStorage();
        
        // تسجيل الخروج لتنظيف أي جلسات محتملة
        await supabase.auth.signOut();
      }
      
      return { user: null, error: authError };
    }
    
    if (!authData.user) {
      console.log('No current user found');
      return { user: null, error: null };
    }
    
    console.log('Current auth user found, fetching profile');
    
    // جلب معلومات المستخدم من جدول المستخدمين
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      
      // إذا لم نتمكن من العثور على بيانات المستخدم، نحاول إنشاءها
      if (userError.code === 'PGRST116') { // No rows returned
        console.log('User profile not found, creating one');
        const userName = authData.user.user_metadata?.display_name || 
                        authData.user.user_metadata?.name || 
                        authData.user.email?.split('@')[0] || 'مستخدم';
        const email = authData.user.email || '';
        const generatedUsername = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000) || 'user' + Math.floor(Math.random() * 10000);
        
        // تحديث name في auth.users إذا لم يكن موجوداً
        if (!authData.user.user_metadata?.name) {
          await supabase.auth.updateUser({
            data: { name: userName }
          });
        }

        const { data: newUserData, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              name: userName,
              username: generatedUsername,
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`,
            },
          ])
          .select()
          .single();
          
        if (insertError) {
          console.error('Failed to create missing user profile:', insertError);
          // إرجاع بيانات المستخدم الأساسية على الأقل بدلاً من إرجاع خطأ
          return { 
            user: {
              id: authData.user.id,
              name: userName,
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`
            } as User, 
            error: null 
          };
        }
        
        return { user: newUserData as User, error: null };
      }
      
      return { user: null, error: userError };
    }

    return { user: userData as User, error: null };
  } catch (error) {
    console.error('Unexpected error getting current user:', error);
    return { user: null, error };
  }
};

// فحص وتحديث اسم المستخدم للمستخدمين الحاليين
export const checkAndUpdateUsername = async (user: User): Promise<{ user: User | null; error: any }> => {
  try {
    if (!user || !user.id || user.username) {
      // إذا كان المستخدم لديه بالفعل اسم مستخدم أو غير موجود، فلا داعي للتحديث
      return { user, error: null };
    }

    console.log('Checking and updating username for user:', user.id);
    
    // استيراد دينامي للحفاظ على التوافق مع SSR
    const { supabase } = await import('./supabase');
    
    // إنشاء اسم مستخدم فريد بناءً على البريد الإلكتروني أو الاسم
    const baseUsername = (user.email?.split('@')[0] || user.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
    const generatedUsername = baseUsername + Math.floor(Math.random() * 1000);
    
    // تحديث المستخدم بإضافة اسم المستخدم
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ username: generatedUsername })
      .eq('id', user.id)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating username:', updateError);
      return { user, error: updateError };
    }
    
    console.log('Username updated successfully:', updatedUser);
    return { user: updatedUser as User, error: null };
  } catch (error) {
    console.error('Unexpected error updating username:', error);
    return { user, error };
  }
};
