'use client';

import { useState, useEffect } from 'react';
import { signIn } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { cleanAuthStorage } from '@/lib/auth';

export const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { refreshUser } = useAuth();

  // تنظيف رسائل الخطأ عند تغيير المدخلات
  useEffect(() => {
    if (error) setError(null);
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log('Starting signin process for:', email);
      const { user, error } = await signIn(email, password);
      
      if (error) {
        console.error('Signin error returned:', error);
        
        // معالجة أنواع مختلفة من الأخطاء
        if (typeof error === 'object') {
          if ('code' in error) {
            switch (error.code) {
              case 'auth/invalid-email':
                setError('البريد الإلكتروني غير صالح');
                break;
              case 'auth/user-disabled':
                setError('تم تعطيل هذا الحساب');
                break;
              case 'auth/user-not-found':
                setError('لا يوجد حساب بهذا البريد الإلكتروني');
                break;
              case 'auth/wrong-password':
                setError('كلمة المرور غير صحيحة');
                break;
              case 'auth/invalid-login-credentials':
                setError('بيانات تسجيل الدخول غير صحيحة');
                break;
              default:
                setError(error.message || 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.');
            }
          } else if ('message' in error) {
            setError(error.message);
          } else {
            setError(JSON.stringify(error));
          }
        } else {
          setError(String(error));
        }
        return;
      }
      
      if (user) {
        console.log('Signin successful, user:', user.id);
        // تحديث حالة المستخدم في مكون AuthProvider
        await refreshUser();
        
        // تم تسجيل الدخول بنجاح، إعادة توجيه المستخدم إلى لوحة التحكم
        console.log('Redirecting to dashboard after successful login');
        window.location.href = '/dashboard'; // توجيه إلى لوحة التحكم بدلاً من الصفحة الرئيسية
      } else {
        console.error('No user returned but no error either');
        setError('فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.');
      }
    } catch (err) {
      console.error('Unexpected error in signin component:', err);
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">تسجيل الدخول</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            البريد الإلكتروني
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="example@example.com"
            disabled={loading}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            كلمة المرور
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="كلمة المرور"
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <span className="mr-2">جاري تسجيل الدخول</span>
              <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
            </span>
          ) : 'تسجيل الدخول'}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ليس لديك حساب؟{' '}
          <a href="/signup" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            إنشاء حساب جديد
          </a>
        </p>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            cleanAuthStorage();
            setError('تم تنظيف بيانات المصادقة المخزنة. يمكنك الآن محاولة تسجيل الدخول مرة أخرى.');
          }}
          className="w-full text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-3 rounded focus:outline-none focus:shadow-outline transition duration-150"
        >
          تنظيف بيانات المصادقة المخزنة
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          استخدم هذا الزر إذا كنت تواجه مشاكل مع تسجيل الدخول أو إذا ظهرت رسالة خطأ تتعلق بـ JWT
        </p>
      </div>
    </div>
  );
};
