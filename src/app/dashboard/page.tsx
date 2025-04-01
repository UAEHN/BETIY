'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { User } from '@/types';
import { Users2, Search } from 'lucide-react';

// مكونات Shadcn UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// استيراد مكون الدردشة ديناميكيًا لتجنب مشاكل التحميل على جانب الخادم
const Chat = dynamic(() => import('@/components/chat'), { 
  ssr: false,
  loading: () => <div className="flex justify-center p-4">جاري تحميل المحادثة...</div>
});

export default function DashboardPage() {
  const { user, loading, error } = useAuth();
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // تأخير بسيط للتحقق من المستخدم وتوجيهه إذا لزم الأمر
    const timer = setTimeout(() => {
      setPageLoading(false);
      
      if (!loading && !user) {
        console.log('User not authenticated, redirecting to login');
        router.push('/login');
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [user, loading, router]);

  // عرض شاشة التحميل أثناء التحقق من المستخدم
  if (loading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">جاري تحميل البيانات...</h2>
          <p className="text-gray-600">يرجى الانتظار لحظة</p>
        </div>
      </div>
    );
  }

  // عرض رسالة الخطأ إذا كان هناك خطأ
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">حدث خطأ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800 mb-4">{error}</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/login">تسجيل الدخول مرة أخرى</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={user?.avatar_url || ''} alt={user?.name || ''} />
                  <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-gray-700 dark:text-gray-300">{user?.name || 'مستخدم'}</span>
              </div>
              <Button 
                variant="outline"
                onClick={async () => {
                  const { signOut } = await import('@/lib/auth');
                  await signOut();
                  window.location.href = '/';
                }}
              >
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="text-2xl font-bold mb-6">مرحبًا، {user?.name || 'مستخدم'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>البحث عن مستخدمين</CardTitle>
                  <CardDescription>ابحث عن أصدقاء أو أفراد العائلة بالاسم الظاهر</CardDescription>
                </CardHeader>
                <CardContent>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/add-user">البحث والإضافة</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>المحادثات</CardTitle>
                  <CardDescription>التواصل مع العائلة والأصدقاء</CardDescription>
                </CardHeader>
                <CardContent>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-blue-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/dashboard/chat">فتح المحادثات</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">جهات الاتصال</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="h-full">
                <Link href="/contacts" className="block h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users2 className="h-4 w-4" />
                      جهات الاتصال
                    </CardTitle>
                    <CardDescription>
                      إدارة جهات الاتصال وبدء محادثات جديدة
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
              
              <Card className="h-full">
                <Link href="/add-user" className="block h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      البحث عن مستخدمين
                    </CardTitle>
                    <CardDescription>
                      ابحث عن أصدقاء أو أفراد العائلة بالاسم الظاهر
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
} 