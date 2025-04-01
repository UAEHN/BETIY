import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';
import { User } from '@/types';

/**
 * البحث عن مستخدمين باستخدام كلمة البحث
 * @param searchTerm كلمة البحث (على الأقل حرفين)
 * @returns قائمة بالمستخدمين المطابقين لكلمة البحث
 */
export async function searchUsers(searchTerm: string): Promise<User[]> {
  console.log('بدء دالة البحث مع مصطلح:', searchTerm);
  
  // تنظيف مصطلح البحث وفحصه
  const cleanTerm = searchTerm.trim();
  console.log('مصطلح البحث النظيف:', cleanTerm);
  
  if (!cleanTerm || cleanTerm.length < 2) {
    console.log('مصطلح البحث قصير جدًا، إرجاع قائمة فارغة');
    return [];
  }

  try {
    const supabase = createClientComponentClient<Database>();
    console.log('تم إنشاء اتصال Supabase');
    
    // الحصول على معرف المستخدم الحالي من الجلسة
    console.log('جاري التحقق من جلسة المستخدم...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('خطأ في الحصول على الجلسة');
      throw new Error('حدث خطأ أثناء الحصول على معلومات الجلسة');
    }
    
    console.log('حالة الجلسة:', session ? 'موجودة' : 'غير موجودة');
    
    if (!session?.user) {
      console.log('لا توجد جلسة مستخدم، تجاوز التحقق والاعتماد على حالة isLoggedIn من واجهة المستخدم');
      // محاولة البحث بدون معرف مستخدم (سيتم التعامل مع الأخطاء لاحقًا)
      return await searchUsersSimple(supabase, cleanTerm, 'anonymous', []);
    }

    console.log('المستخدم مسجل الدخول بمعرف:', session.user.id);

    // تسجيل محاولة استدعاء RPC
    console.log('جاري استدعاء دالة find_users_to_add من قاعدة البيانات...');
    const { data, error } = await supabase.rpc('find_users_to_add', {
      search_term: cleanTerm // استخدام المصطلح المنظف
    });

    if (error) {
      console.log('خطأ في البحث (RPC)');
      console.log('جاري المحاولة بالطريقة اليدوية...');
      return await searchUsersManually(supabase, cleanTerm, session.user.id);
    }

    // فلترة النتائج للتأكد من التطابق الفعلي
    if (data && data.length > 0) {
      console.log('جاري فلترة النتائج للتأكد من التطابق الفعلي...');
      const filteredResults = data.filter((user: User) => {
        const displayName = (user.display_name || '').toLowerCase();
        const name = (user.name || '').toLowerCase();
        const username = (user.username || '').toLowerCase();
        const term = cleanTerm.toLowerCase();
        
        return displayName.includes(term) || name.includes(term) || username.includes(term);
      });
      
      console.log('نجاح البحث! عدد النتائج بعد التصفية:', filteredResults.length, 'من أصل', data.length);
      return filteredResults as User[] || [];
    }

    console.log('نجاح البحث! عدد النتائج:', data?.length || 0);
    return data as User[] || [];
  } catch (err) {
    console.log('خطأ غير متوقع في searchUsers');
    if (err instanceof Error) {
      console.log('رسالة الخطأ:', err.message);
      throw new Error('حدث خطأ أثناء البحث عن المستخدمين: ' + err.message);
    }
    throw new Error('حدث خطأ غير متوقع أثناء البحث عن المستخدمين');
  }
}

/**
 * البحث اليدوي عن المستخدمين (طريقة احتياطية)
 */
async function searchUsersManually(supabase: any, searchTerm: string, currentUserId: string): Promise<User[]> {
  console.log('استخدام الطريقة اليدوية للبحث');
  
  // تنظيف مصطلح البحث
  const cleanTerm = searchTerm.trim();
  if (cleanTerm.length < 2) {
    console.log('مصطلح البحث قصير جدًا، إرجاع قائمة فارغة');
    return [];
  }
  
  try {
    // الحصول على جهات الاتصال الحالية
    console.log('جاري الحصول على جهات الاتصال للمستخدم:', currentUserId);
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('contact_id')
      .eq('user_id', currentUserId);
    
    if (contactsError) {
      console.log('خطأ في جلب جهات الاتصال');
    }
    
    const contactIds = contacts ? contacts.map((c: any) => c.contact_id) : [];
    console.log('جهات الاتصال الحالية:', contactIds.length);

    // البحث في المستخدمين باستخدام تطابق محسن
    console.log('جاري البحث في بيانات المستخدمين باستخدام raw_user_meta_data مع تحسين التطابق...');
    const { data: users, error } = await supabase
      .from('auth.users')
      .select('id, raw_user_meta_data')
      .neq('id', currentUserId)
      .or(
        `raw_user_meta_data->display_name.ilike.%${cleanTerm}%,` +
        `raw_user_meta_data->name.ilike.%${cleanTerm}%,` +
        `raw_user_meta_data->username.ilike.%${cleanTerm}%`
      )
      .limit(20);

    if (error) {
      console.log('خطأ في البحث اليدوي في auth.users');
      console.log('جاري المحاولة بالطريقة البسيطة...');
      return await searchUsersSimple(supabase, cleanTerm, currentUserId, contactIds);
    }

    // فلترة النتائج للتحقق من التطابق الفعلي
    const matchingUsers = users.filter((user: any) => {
      const userData = user.raw_user_meta_data || {};
      const displayName = (userData.display_name || '').toLowerCase();
      const name = (userData.name || '').toLowerCase();
      const username = (userData.username || '').toLowerCase();
      const term = cleanTerm.toLowerCase();
      
      return displayName.includes(term) || name.includes(term) || username.includes(term);
    });
    
    console.log('تم العثور على', matchingUsers.length, 'مستخدم مطابق (بعد التصفية) من أصل', users.length);
    
    // تنسيق النتائج
    console.log('جاري تنسيق النتائج...');
    const formattedUsers = matchingUsers.map((user: any) => {
      const userData = user.raw_user_meta_data || {};
      return {
        id: user.id,
        name: userData.name || null,
        username: userData.username || null,
        display_name: userData.display_name || null,
        avatar_url: userData.avatar_url || null,
        is_contact: contactIds.includes(user.id)
      } as User;
    });

    console.log('تم تنسيق النتائج بنجاح');
    return formattedUsers;
  } catch (err) {
    console.log('خطأ في البحث اليدوي');
    console.log('جاري المحاولة بالطريقة البسيطة كملاذ أخير...');
    return await searchUsersSimple(supabase, cleanTerm, currentUserId, []);
  }
}

/**
 * طريقة أبسط للبحث (الملاذ الأخير)
 */
async function searchUsersSimple(supabase: any, searchTerm: string, currentUserId: string, contactIds: string[]): Promise<User[]> {
  console.log('استخدام الطريقة البسيطة للبحث في جدول users');
  
  // تنظيف وإعداد مصطلح البحث
  const cleanTerm = searchTerm.trim();
  console.log('مصطلح البحث النظيف:', cleanTerm);
  
  if (cleanTerm.length < 2) {
    console.log('مصطلح البحث قصير جدًا، إرجاع قائمة فارغة');
    return [];
  }
  
  try {
    // البحث المباشر في الجدول العام مع طلب تطابق دقيق
    console.log('جاري البحث في جدول users مع تطابق دقيق...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('id', currentUserId === 'anonymous' ? 'no-match' : currentUserId) // تجنب استبعاد المستخدم الحالي إذا كان مجهولاً
      .or(
        `display_name.ilike.%${cleanTerm}%,` +
        `name.ilike.%${cleanTerm}%,` +
        `username.ilike.%${cleanTerm}%`
      )
      .limit(20);

    if (error) {
      console.log('خطأ في البحث البسيط جدول users');
      console.log('محاولة البحث عن تطابق دقيق - المحاولة الأخيرة');
      return await fallbackAuthSearch(supabase, cleanTerm, currentUserId, contactIds);
    }

    // التحقق من وجود نتائج
    if (!data || data.length === 0) {
      console.log('لم يتم العثور على نتائج مطابقة');
      return [];
    }
    
    // فلترة النتائج للتأكد من أن المصطلح موجود فعليًا في أحد الحقول
    const filteredResults = data.filter((user: User) => {
      const displayName = (user.display_name || '').toLowerCase();
      const name = (user.name || '').toLowerCase();
      const username = (user.username || '').toLowerCase();
      const term = cleanTerm.toLowerCase();
      
      return displayName.includes(term) || name.includes(term) || username.includes(term);
    });
    
    console.log('تم العثور على', filteredResults.length, 'مستخدم مطابق (بعد التصفية)');
    
    // إضافة حالة جهات الاتصال
    const users = filteredResults.map((user: User) => ({
      ...user,
      is_contact: contactIds.includes(user.id)
    })) as User[];

    return users;
  } catch (error) {
    // لا نعرض الخطأ للمستخدم، بل نسجله فقط للتشخيص
    console.log('خطأ في البحث البسيط حول جدول users');
    
    // محاولة البحث في جدول public.users بدلاً من ذلك
    try {
      const { data: publicUsers, error: publicError } = await supabase
        .from('public.users')
        .select('*')
        .neq('id', currentUserId === 'anonymous' ? 'no-match' : currentUserId)
        .or(
          `display_name.ilike.%${cleanTerm}%,` +
          `name.ilike.%${cleanTerm}%,` +
          `username.ilike.%${cleanTerm}%`
        )
        .limit(20);
        
      if (publicError) {
        console.log('فشل البحث في جدول public.users أيضًا');
        // نجرب طريقة أخيرة باستخدام auth.users
        console.log('محاولة أخيرة - استخدام جدول auth.users');
        return await fallbackAuthSearch(supabase, cleanTerm, currentUserId, contactIds);
      }
      
      if (!publicUsers || publicUsers.length === 0) {
        console.log('لم يتم العثور على نتائج في جدول public.users');
        return [];
      }
      
      // فلترة النتائج
      const filteredPublicUsers = publicUsers.filter((user: any) => {
        const displayName = (user.display_name || '').toLowerCase();
        const name = (user.name || '').toLowerCase();
        const username = (user.username || '').toLowerCase();
        const term = cleanTerm.toLowerCase();
        
        return displayName.includes(term) || name.includes(term) || username.includes(term);
      });
      
      console.log('تم العثور على', filteredPublicUsers.length, 'مستخدم في public.users');
      return filteredPublicUsers.map((user: any) => ({
        ...user,
        is_contact: contactIds.includes(user.id)
      })) as User[];
    } catch (finalError) {
      console.log('فشلت كل محاولات البحث في جداول المستخدمين');
      return await fallbackAuthSearch(supabase, cleanTerm, currentUserId, contactIds);
    }
  }
}

/**
 * طريقة للبحث في جدول مستخدمي المصادقة كملاذ أخير
 */
async function fallbackAuthSearch(supabase: any, searchTerm: string, currentUserId: string, contactIds: string[]): Promise<User[]> {
  console.log('استخدام البحث في auth.users كملاذ أخير');
  try {
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .limit(15);
      
    if (authError) {
      console.log('فشل البحث في auth.users');
      return [];
    }
    
    // فلترة يدوية باستخدام المصطلح
    const term = searchTerm.toLowerCase();
    const filteredAuthUsers = authUsers.filter((user: any) => {
      const metadata = user.raw_user_meta_data || {};
      const displayName = (metadata.display_name || '').toLowerCase();
      const name = (metadata.name || '').toLowerCase();
      const username = (metadata.username || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      
      return displayName.includes(term) || 
             name.includes(term) || 
             username.includes(term) ||
             email.includes(term);
    });
    
    console.log('تم العثور على', filteredAuthUsers.length, 'مستخدم مطابق في auth.users');
    
    return filteredAuthUsers.map((user: any) => {
      const metadata = user.raw_user_meta_data || {};
      return {
        id: user.id,
        name: metadata.name || null,
        username: metadata.username || null,
        display_name: metadata.display_name || null,
        avatar_url: metadata.avatar_url || null,
        is_contact: contactIds.includes(user.id)
      } as User;
    });
  } catch (err) {
    console.log('فشل نهائي في كل طرق البحث');
    return [];
  }
}

/**
 * إضافة مستخدم كجهة اتصال
 * @param userId معرف المستخدم المراد إضافته
 * @returns نتيجة العملية (true = نجاح)
 */
export async function addContact(userId: string): Promise<boolean> {
  try {
    const supabase = createClientComponentClient<Database>();
    const { data, error } = await supabase
      .rpc('add_contact', { contact_user_id: userId });

    if (error) {
      console.error('Error adding contact:', error);
      throw new Error('حدث خطأ أثناء إضافة جهة الاتصال: ' + error.message);
    }

    return Boolean(data);
  } catch (err) {
    console.error('Unexpected error in addContact:', err);
    if (err instanceof Error) {
      throw new Error('حدث خطأ أثناء إضافة جهة الاتصال: ' + err.message);
    }
    throw new Error('حدث خطأ غير متوقع أثناء إضافة جهة الاتصال');
  }
}

/**
 * الحصول على قائمة جهات الاتصال للمستخدم الحالي
 * @returns قائمة بجهات الاتصال
 */
export async function getContacts(): Promise<User[]> {
  try {
    const supabase = createClientComponentClient<Database>();
    const { data, error } = await supabase.rpc('get_contacts');

    if (error) {
      console.error('Error fetching contacts:', error);
      throw new Error('حدث خطأ أثناء جلب جهات الاتصال: ' + error.message);
    }

    return data as User[] || [];
  } catch (err) {
    console.error('Unexpected error in getContacts:', err);
    if (err instanceof Error) {
      throw new Error('حدث خطأ أثناء جلب جهات الاتصال: ' + err.message);
    }
    throw new Error('حدث خطأ غير متوقع أثناء جلب جهات الاتصال');
  }
}

/**
 * حذف جهة اتصال
 * @param userId معرف المستخدم المراد حذفه من جهات الاتصال
 * @returns نتيجة العملية (true = نجاح)
 */
export async function removeContact(userId: string): Promise<boolean> {
  try {
    const supabase = createClientComponentClient<Database>();
    const { data, error } = await supabase
      .rpc('remove_contact', { contact_user_id: userId });

    if (error) {
      console.error('Error removing contact:', error);
      throw new Error('حدث خطأ أثناء حذف جهة الاتصال: ' + error.message);
    }

    return Boolean(data);
  } catch (err) {
    console.error('Unexpected error in removeContact:', err);
    if (err instanceof Error) {
      throw new Error('حدث خطأ أثناء حذف جهة الاتصال: ' + err.message);
    }
    throw new Error('حدث خطأ غير متوقع أثناء حذف جهة الاتصال');
  }
} 