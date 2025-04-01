'use client';

import { useState, useEffect } from 'react';
import { signUp } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export const SignUp = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  // تنظيف رسائل الخطأ عند تغيير المدخلات
  useEffect(() => {
    if (error) setError(null);
  }, [name, username, email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // التحقق من صحة المدخلات
    if (password.length < 6) {
      setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      setLoading(false);
      return;
    }

    // التحقق من صحة اسم المستخدم
    if (username.length < 3) {
      setError('يجب أن يكون اسم المستخدم 3 أحرف على الأقل');
      setLoading(false);
      return;
    }

    // التأكد من أن اسم المستخدم يحتوي على أحرف وأرقام فقط (بدون مسافات أو رموز خاصة)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('يجب أن يحتوي اسم المستخدم على أحرف إنجليزية وأرقام وشرطة سفلية فقط');
      setLoading(false);
      return;
    }

    try {
      console.log('Starting signup process with form data');
      const { user, error } = await signUp(email, password, name, username);
      
      if (error) {
        console.error('Signup error returned:', error);
        
        // معالجة أنواع مختلفة من الأخطاء
        if (typeof error === 'object') {
          if ('code' in error) {
            switch (error.code) {
              case '23505': // تكرار البريد الإلكتروني أو اسم المستخدم
                if (error.message?.includes('username')) {
                  setError('اسم المستخدم مستخدم بالفعل. يرجى اختيار اسم مستخدم آخر.');
                } else {
                  setError('البريد الإلكتروني مستخدم بالفعل. يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول.');
                }
                break;
              case 'P0001': // خطأ مخصص من قاعدة البيانات
                setError(error.message || 'خطأ في قاعدة البيانات');
                break;
              case 'auth/email-already-in-use':
                setError('البريد الإلكتروني مستخدم بالفعل. يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول.');
                break;
              case 'auth/invalid-email':
                setError('البريد الإلكتروني غير صالح. يرجى التحقق من صيغة البريد الإلكتروني.');
                break;
              case 'auth/weak-password':
                setError('كلمة المرور ضعيفة جدًا. يرجى استخدام كلمة مرور أقوى.');
                break;
              default:
                setError(error.message || 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.');
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
        console.log('Signup successful, user created:', user.id);
        await refreshUser();
        setSuccess(true);
        // توجيه المستخدم إلى لوحة التحكم مباشرة
        console.log('Redirecting to dashboard after successful signup');
        setTimeout(() => {
          window.location.href = '/dashboard'; // توجيه إلى لوحة التحكم بدلاً من الصفحة الرئيسية
        }, 1500);
      } else {
        console.error('No user returned but no error either');
        setError('حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      console.error('Unexpected error in signup component:', err);
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">تم إنشاء الحساب بنجاح!</h2>
        <p className="text-center mb-4">
          تم إنشاء حسابك بنجاح. سيتم توجيهك إلى الصفحة الرئيسية خلال لحظات.
        </p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">إنشاء حساب جديد</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            الاسم
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="أدخل اسمك"
            disabled={loading}
          />
        </div>
        
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            اسم المستخدم (سيظهر في المحادثات)
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="اسم مستخدم فريد (حروف وأرقام فقط)"
            disabled={loading}
            pattern="^[a-zA-Z0-9_]+$"
            title="يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة سفلية فقط"
            minLength={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            سيستخدم هذا الاسم للظهور في المحادثات. يجب أن يكون فريداً ويحتوي على أحرف إنجليزية وأرقام فقط.
          </p>
        </div>
        
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
            placeholder="كلمة المرور (6 أحرف على الأقل)"
            minLength={6}
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
              <span className="mr-2">جاري إنشاء الحساب</span>
              <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
            </span>
          ) : 'إنشاء حساب'}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          لديك حساب بالفعل؟{' '}
          <a href="/login" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            تسجيل الدخول
          </a>
        </p>
      </div>
    </div>
  );
};
