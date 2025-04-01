'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { UserAvatar } from '@/components/ui/user-avatar';
import { supabase } from '@/lib/supabase';
import { checkAndUpdateUsername } from '@/lib/auth';

// مكونات Shadcn UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // تحميل بيانات المستخدم عند تحميل الصفحة
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      
      // إذا لم يكن للمستخدم اسم مستخدم، قم بإنشاء واحد تلقائيًا
      if (!user.username) {
        const autoUpdateUsername = async () => {
          const { user: updatedUser } = await checkAndUpdateUsername(user);
          if (updatedUser && updatedUser.username) {
            setUsername(updatedUser.username);
            refreshUser();
          }
        };
        
        autoUpdateUsername();
      }
    }
  }, [user, refreshUser]);

  // التحقق من صحة اسم المستخدم
  const validateUsername = (value: string) => {
    setUsernameError(null);
    
    if (value.length < 3) {
      setUsernameError('يجب أن يكون اسم المستخدم 3 أحرف على الأقل');
      return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError('يجب أن يحتوي اسم المستخدم على أحرف إنجليزية وأرقام وشرطة سفلية فقط');
      return false;
    }
    
    return true;
  };

  // تحديث اسم المستخدم عند التغيير مع التحقق
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value.toLowerCase();
    setUsername(newUsername);
    validateUsername(newUsername);
  };

  // حفظ بيانات الملف الشخصي
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // إعادة التحقق من اسم المستخدم
    if (!validateUsername(username)) {
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // التحقق من عدم استخدام اسم المستخدم من قبل مستخدم آخر
      if (username !== user?.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .neq('id', user?.id || '')
          .maybeSingle();
          
        if (existingUser) {
          setError('اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم مستخدم آخر');
          setSaving(false);
          return;
        }
      }

      // تحديث display_name في auth.users
      const { error: updateAuthError } = await supabase.auth.updateUser({
        data: { display_name: name }
      });

      if (updateAuthError) {
        console.error('Error updating display_name:', updateAuthError);
        setError('حدث خطأ أثناء تحديث اسم العرض');
        setSaving(false);
        return;
      }
      
      // تحديث بيانات المستخدم
      const { data, error: updateError } = await supabase
        .from('users')
        .update({
          name,
          username,
        })
        .eq('id', user?.id || '')
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError('حدث خطأ أثناء تحديث الملف الشخصي');
        return;
      }
      
      setSuccess(true);
      refreshUser();  // تحديث بيانات المستخدم في السياق
      
    } catch (err) {
      console.error('Unexpected error saving profile:', err);
      setError('حدث خطأ غير متوقع أثناء تحديث الملف الشخصي');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-[400px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>الملف الشخصي</CardTitle>
            <CardDescription>
              يجب تسجيل الدخول للوصول إلى الملف الشخصي
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <a href="/login">تسجيل الدخول</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">الملف الشخصي</h1>
      
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <UserAvatar user={user} size="lg" />
            </div>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                <span className="block sm:inline">تم تحديث الملف الشخصي بنجاح</span>
              </div>
            )}
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">
                  اسم المستخدم (سيظهر في المحادثات)
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={handleUsernameChange}
                  className={usernameError ? "border-red-500" : ""}
                  disabled={saving}
                  placeholder="اسم مستخدم فريد (حروف وأرقام فقط)"
                  pattern="^[a-zA-Z0-9_]+$"
                  minLength={3}
                />
                {usernameError && (
                  <p className="text-red-500 text-xs">{usernameError}</p>
                )}
                <p className="text-xs text-gray-500">
                  سيستخدم هذا الاسم للظهور في المحادثات. يجب أن يكون فريداً ويحتوي على أحرف إنجليزية وأرقام وشرطة سفلية فقط.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  value={email}
                  disabled={true}
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500">
                  لا يمكن تغيير البريد الإلكتروني
                </p>
              </div>
              
              <Button type="submit" disabled={saving || !!usernameError} className="w-full">
                {saving ? (
                  <span className="flex items-center justify-center">
                    <span className="mr-2">جاري الحفظ</span>
                    <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                  </span>
                ) : 'حفظ التغييرات'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 