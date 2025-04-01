'use client';

import { useEffect, useState } from 'react';
import { AuthProvider } from '@/context/auth-context';

/**
 * مكون محول لـ AuthProvider في Next.js
 */
export function AuthProviderAdapter({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  // تأكد من تنفيذ الكود فقط في المتصفح
  useEffect(() => {
    // تنظيف بيانات المصادقة القديمة للتخلص من المشكلات المحتملة
    try {
      const clearStoredAuthIfNeeded = async () => {
        // استيراد دينامي للحفاظ على التوافق مع SSR
        const { supabase } = await import('@/lib/supabase');
        
        // محاولة جلب المستخدم الحالي
        const { data, error } = await supabase.auth.getUser();
        
        // إذا كان هناك خطأ متعلق بعدم وجود المستخدم، قم بمسح التخزين المحلي
        if (error && 
           (error.message?.includes('User from sub claim in JWT does not exist') || 
            error.message?.includes('JWT'))) {
          console.log('إزالة بيانات المصادقة القديمة...');
          // محاولة تسجيل الخروج لتنظيف الجلسة
          await supabase.auth.signOut();
          
          // محاولة مسح التخزين المحلي يدويًا
          if (typeof window !== 'undefined') {
            localStorage.removeItem('beity-auth-storage');
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.removeItem('supabase.auth.token');
          }
        }
      };
      
      clearStoredAuthIfNeeded().then(() => {
        // تعيين isClient إلى true فقط في جانب العميل بعد تنظيف البيانات
        setIsClient(true);
      });
    } catch(e) {
      console.error('Error cleaning up auth data:', e);
      // في حالة حدوث خطأ، نستمر في تعيين isClient
      setIsClient(true);
    }
  }, []);

  // إذا لم يكن في المتصفح، اعرض شاشة التحميل
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mr-2 text-blue-500">جاري تحميل التطبيق...</p>
      </div>
    );
  }

  // في المتصفح، استخدم AuthProvider
  return <AuthProvider>{children}</AuthProvider>;
} 