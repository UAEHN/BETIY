'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { searchUsers, addContact } from '@/lib/api/contacts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface UserSearchProps {
  onUserSelect?: (user: User) => void;
}

export default function UserSearch({ onUserSelect }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // افتراضياً نعتبر المستخدم مسجل
  const [error, setError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(false); // لن نتحقق بنشاط
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClientComponentClient();

  // التحقق من تسجيل الدخول اختياري
  useEffect(() => {
    // لا نستخدم التحقق من الجلسة بشكل مبدئي
  }, []);

  // الحصول على اسم المستخدم المناسب للعرض
  const getUserDisplayName = (user: User) => {
    return user.display_name || user.name || user.username || 'مستخدم';
  };

  // التوجيه إلى صفحة تسجيل الدخول
  const handleLoginRedirect = () => {
    router.push('/auth/sign-in');
  };

  // البحث عن المستخدمين
  const handleSearch = async () => {
    // تنظيف النص المدخل
    const cleanTerm = searchTerm.trim();
    
    if (!cleanTerm || cleanTerm.length < 2) {
      setError('يرجى إدخال كلمة بحث لا تقل عن حرفين');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('بدء البحث عن مصطلح:', cleanTerm);
      
      const results = await searchUsers(cleanTerm);
      console.log('تم استلام نتائج البحث:', results?.length || 0);
      
      // التأكد من أن النتائج مطابقة للمصطلح المدخل
      if (results && results.length > 0) {
        // الاحتفاظ فقط بالنتائج التي تتضمن المصطلح بشكل فعلي
        const matchingResults = results.filter(user => {
          const displayName = (user.display_name || '').toLowerCase();
          const name = (user.name || '').toLowerCase();
          const username = (user.username || '').toLowerCase();
          const term = cleanTerm.toLowerCase();
          
          return displayName.includes(term) || name.includes(term) || username.includes(term);
        });
        
        setUsers(matchingResults);
        
        if (matchingResults.length === 0) {
          setError('لم يتم العثور على مستخدمين مطابقين لهذا البحث');
        }
      } else {
        setUsers([]);
        setError('لم يتم العثور على مستخدمين بهذا الاسم');
      }
    } catch (err) {
      console.error('خطأ في البحث عن المستخدمين:', err);
      
      if (err instanceof Error) {
        // نتجاهل خطأ عدم تسجيل الدخول
        if (err.message.includes('يجب تسجيل الدخول')) {
          setIsLoggedIn(false);
          
          // نحاول البحث مرة أخرى بطريقة مختلفة - مع التأكد من دقة التطابق
          try {
            console.log('محاولة بحث مباشرة في جدول users...');
            const { data } = await supabase
              .from('users')
              .select('*')
              .or(
                `display_name.ilike.%${cleanTerm}%,` +
                `name.ilike.%${cleanTerm}%,` +
                `username.ilike.%${cleanTerm}%`
              )
              .limit(20);
              
            if (data && data.length > 0) {
              // فلترة النتائج للتأكد من أنها تتطابق فعلياً مع البحث
              const filteredData = data.filter(user => {
                const displayName = (user.display_name || '').toLowerCase();
                const name = (user.name || '').toLowerCase();
                const username = (user.username || '').toLowerCase();
                const term = cleanTerm.toLowerCase();
                
                return displayName.includes(term) || name.includes(term) || username.includes(term);
              });
              
              setUsers(filteredData.map(user => ({
                ...user,
                is_contact: false // لا يمكن إضافة جهات اتصال بدون تسجيل
              })));
              
              if (filteredData.length === 0) {
                setError('لم يتم العثور على مستخدمين مطابقين لهذا البحث');
              } else {
                console.log('تم العثور على', filteredData.length, 'مستخدم مطابق في البحث المباشر');
              }
            } else {
              setError('لم يتم العثور على مستخدمين بهذا الاسم');
            }
          } catch (directErr) {
            console.error('فشل البحث المباشر:', directErr);
            setError('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.');
          }
        } else {
          setError(err.message);
        }
      } else {
        setError('حدث خطأ أثناء البحث عن المستخدمين');
      }
      
      // عرض الخطأ كإشعار أيضًا للفت الانتباه
      if (err instanceof Error && !err.message.includes('يجب تسجيل الدخول')) {
        toast({
          title: 'خطأ في البحث',
          description: err.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // إضافة مستخدم كجهة اتصال - تتطلب تسجيل الدخول
  const handleAddContact = async (user: User) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast({
        title: 'يلزم تسجيل الدخول',
        description: 'يرجى تسجيل الدخول لإضافة جهات اتصال',
        variant: 'destructive',
      });
      setIsLoggedIn(false);
      return;
    }

    try {
      await addContact(user.id);
      
      // تحديث حالة المستخدم ليظهر أنه تمت إضافته
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, is_contact: true } : u
      ));
      
      toast({
        title: 'تمت إضافة جهة الاتصال',
        description: `تمت إضافة ${getUserDisplayName(user)} إلى جهات الاتصال الخاصة بك`,
        variant: 'default',
      });
      
      // استدعاء دالة الاختيار إذا تم توفيرها
      if (onUserSelect) {
        onUserSelect(user);
      }
    } catch (err) {
      console.error('خطأ في إضافة جهة الاتصال:', err);
      
      toast({
        title: 'فشل إضافة جهة الاتصال',
        description: err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة جهة الاتصال. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  // معالجة البحث عند الضغط على زر Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // محاولة البحث بعد تغيير النص بعد فترة قصيرة
  useEffect(() => {
    // فقط نفذ البحث التلقائي إذا كانت هناك حروف كافية وليس عند كل تغيير
    if (searchTerm && searchTerm.trim().length >= 2) {
      // إلغاء المؤقت السابق لتجنب طلبات البحث المتعددة
      const timer = setTimeout(() => {
        // تحقق ما إذا كانت قيمة البحث لا تزال نفسها
        if (searchTerm.trim().length >= 2) {
          console.log("تنفيذ البحث التلقائي للمصطلح:", searchTerm);
          // البحث فقط عن المصطلح المطابق وليس البحث الشامل
          handleSearch();
        }
      }, 800); // زيادة المهلة لتقليل عدد طلبات البحث
      
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // عرض حالة تحميل أثناء التحقق من تسجيل الدخول
  if (authChecking) {
    return <div className="text-center p-4">جارٍ التحقق من حالة تسجيل الدخول...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="ابحث باسم العرض..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
            aria-label="البحث عن مستخدمين"
            disabled={loading}
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={loading}
          aria-label="بحث"
        >
          {loading ? 'جارٍ البحث...' : 'بحث'}
        </Button>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {users.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium mb-2">نتائج البحث:</h3>
          <div className="divide-y">
            {users.map((user) => (
              <div key={user.id} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserAvatar user={user} showName={false} />
                  <div>
                    <div className="font-medium">{getUserDisplayName(user)}</div>
                    {user.username && (
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    )}
                  </div>
                </div>
                <Button 
                  variant={user.is_contact ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleAddContact(user)}
                  disabled={user.is_contact}
                  aria-label={user.is_contact ? 'تمت الإضافة' : 'إضافة جهة الاتصال'}
                >
                  {user.is_contact ? 'تمت الإضافة' : 'إضافة'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoggedIn && users.length > 0 && (
        <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm mt-4">
          <p className="mb-2">ملاحظة: يجب تسجيل الدخول لإضافة جهات اتصال</p>
          <Button onClick={handleLoginRedirect} variant="outline" size="sm">
            تسجيل الدخول
          </Button>
        </div>
      )}
    </div>
  );
} 