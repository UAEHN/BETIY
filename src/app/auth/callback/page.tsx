'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // استخراج رمز المصادقة من عنوان URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('Auth callback received with tokens');
          
          // تعيين الجلسة يدويًا إذا لزم الأمر
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Error setting session:', error);
            throw error;
          }
        } else {
          // محاولة التعامل مع استدعاء المصادقة تلقائيًا
          const { error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error processing auth callback:', error);
            throw error;
          }
        }
        
        // إعادة توجيه المستخدم إلى لوحة التحكم بعد المصادقة باستخدام توجيه مباشر
        console.log('Auth callback successful, redirecting to dashboard');
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Error in auth callback:', error);
        // إعادة توجيه المستخدم إلى صفحة تسجيل الدخول في حالة حدوث خطأ
        window.location.href = '/login';
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <h2 className="text-xl font-semibold mb-2">جاري تسجيل الدخول...</h2>
      <p className="text-gray-600">يرجى الانتظار بينما نقوم بمعالجة بيانات المصادقة الخاصة بك.</p>
    </div>
  );
}
