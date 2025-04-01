'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';

// مكونات Shadcn UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// استيراد مكون الدردشة ديناميكيًا لتجنب مشاكل التحميل على جانب الخادم
const Chat = dynamic(() => import('@/components/chat'), { 
  ssr: false,
  loading: () => <div className="flex justify-center p-4">جاري تحميل المحادثة...</div>
});

export default function ChatPage() {
  const { user, loading, error } = useAuth();
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(false);

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

  // تحميل جهات الاتصال عند تحميل الصفحة
  useEffect(() => {
    const fetchContacts = async () => {
      if (user) {
        try {
          setLoadingContacts(true);
          console.log('Fetching contacts for user:', user.id);
          
          // جلب جهات الاتصال من قاعدة البيانات (المستخدمين الذين تواصل معهم أو تم إضافتهم)
          const { data, error } = await supabase
            .from('contacts')
            .select(`
              contact_id,
              users!contacts_contact_id_fkey (
                id,
                name,
                display_name,
                username,
                avatar_url
              )
            `)
            .eq('user_id', user.id);
          
          if (error) {
            console.error('Error fetching contacts:', error);
            return;
          }
          
          // تحويل البيانات إلى تنسيق مناسب
          const formattedContacts = data.map(item => ({
            id: item.users.id,
            name: item.users.name,
            display_name: item.users.display_name,
            username: item.users.username,
            avatar_url: item.users.avatar_url
          })) as User[];
          
          console.log('Contacts data received:', formattedContacts);
          setContacts(formattedContacts);
          
          // اختيار جهة الاتصال الأولى تلقائيًا إذا كانت موجودة
          if (formattedContacts.length > 0) {
            setSelectedContact(formattedContacts[0].id);
          }
        } catch (err) {
          console.error('Error processing contacts:', err);
        } finally {
          setLoadingContacts(false);
        }
      }
    };

    fetchContacts();
  }, [user]);

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

  const getDisplayName = (contact: User) => {
    return contact.display_name || contact.name || contact.username || 'مستخدم';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">المحادثات</CardTitle>
              <CardDescription>التواصل مع الأصدقاء والعائلة</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="default" size="sm" asChild>
                <Link href="/add-user">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  بحث عن مستخدمين
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">العودة للوحة التحكم</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length > 0 ? (
            <div className="flex flex-col space-y-4">
              <div className="w-full">
                <label htmlFor="contact-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  اختر المستخدم
                </label>
                <Select 
                  value={selectedContact || ''} 
                  onValueChange={(value) => setSelectedContact(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر مستخدم للمحادثة" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={contact.avatar_url || ''} />
                            <AvatarFallback>{getDisplayName(contact).charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{getDisplayName(contact)}</span>
                          {contact.username && (
                            <span className="text-gray-500 text-xs mr-2">@{contact.username}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedContact ? (
                <div className="border rounded-lg overflow-hidden">
                  <Chat recipientId={selectedContact} />
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-500">الرجاء اختيار مستخدم للمحادثة</p>
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg p-4 shadow-sm bg-white">
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-purple-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-lg font-semibold mb-2">لا توجد جهات اتصال</h3>
                <p className="text-gray-500 mb-6">يرجى البحث عن مستخدمين وإضافتهم أولاً للبدء في المحادثة</p>
                <Button asChild>
                  <Link href="/add-user">البحث عن مستخدمين</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 