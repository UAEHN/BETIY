"use client";

import { useState, useEffect } from 'react';
import { getContacts, removeContact } from '@/lib/api/contacts';
import { User } from '@/types';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Trash2, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export default function ContactsList() {
  const [contacts, setContacts] = useState<User[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // الحصول على جهات الاتصال
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const data = await getContacts();
        setContacts(data);
        setFilteredContacts(data);
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setError('حدث خطأ أثناء جلب جهات الاتصال');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // فلترة جهات الاتصال بناءً على البحث
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const filtered = contacts.filter(contact => {
      const displayName = contact.display_name || contact.name || contact.username || '';
      return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (contact.username && contact.username.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    setFilteredContacts(filtered);
  }, [searchTerm, contacts]);

  // الحصول على اسم العرض المناسب
  const getDisplayName = (user: User) => {
    return user.display_name || user.name || user.username || 'مستخدم';
  };

  // حذف جهة اتصال
  const handleRemoveContact = async (contactId: string) => {
    if (!confirm('هل أنت متأكد من حذف جهة الاتصال هذه؟')) {
      return;
    }

    try {
      await removeContact(contactId);
      setContacts(contacts.filter(c => c.id !== contactId));
      toast({
        title: 'تم حذف جهة الاتصال',
        description: 'تم حذف جهة الاتصال بنجاح',
        variant: 'default',
      });
    } catch (err) {
      console.error('Error removing contact:', err);
      toast({
        title: 'فشل حذف جهة الاتصال',
        description: 'حدث خطأ أثناء حذف جهة الاتصال',
        variant: 'destructive',
      });
    }
  };

  // بدء محادثة مع جهة اتصال
  const startChat = (contactId: string) => {
    router.push(`/chat/${contactId}`);
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse">جاري تحميل جهات الاتصال...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="البحث في جهات الاتصال..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <Link href="/add-user">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            إضافة
          </Button>
        </Link>
      </div>

      {filteredContacts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {contacts.length === 0 ? (
            <div>
              <p>لا توجد جهات اتصال بعد</p>
              <Link href="/add-user">
                <Button variant="link" className="mt-2">
                  إضافة جهات اتصال جديدة
                </Button>
              </Link>
            </div>
          ) : (
            <p>لا توجد نتائج تطابق البحث</p>
          )}
        </div>
      ) : (
        <div className="divide-y">
          {filteredContacts.map((contact) => (
            <div key={contact.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar user={contact} showName={false} />
                <div>
                  <div className="font-medium">{getDisplayName(contact)}</div>
                  {contact.username && (
                    <div className="text-sm text-gray-500">@{contact.username}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => startChat(contact.id)}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleRemoveContact(contact.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 