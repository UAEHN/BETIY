'use client';

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [loading, setLoading] = useState(true);
  
  // إزالة التحميل بعد فترة قصيرة للتأكد من أن الصفحة تعمل
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="text-xl font-bold text-blue-600 dark:text-blue-400"
              aria-label="الصفحة الرئيسية"
            >
              بيتي
            </Link>
            
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                إنشاء حساب
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">مرحباً بك في تطبيق بيتي</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">
              تطبيق بيتي يساعدك على إدارة قوائم التسوق العائلية والتواصل مع أفراد عائلتك بسهولة.
              قم بتسجيل الدخول أو إنشاء حساب جديد للبدء.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/login"
                className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-6 border border-gray-400 rounded shadow"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 border border-blue-600 rounded shadow"
              >
                إنشاء حساب جديد
              </Link>
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} بيتي - تطبيق إدارة قوائم التسوق العائلية
          </p>
        </div>
      </footer>
    </div>
  );
}
