'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Message, User, Group } from '@/types';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ShoppingCart, Users } from 'lucide-react';

interface UnreadMessagesPanelProps {
  userId: string;
}

export default function UnreadMessagesPanel({ userId }: UnreadMessagesPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<(Message & { user?: User, group?: Group })[]>([]);
  const [groups, setGroups] = useState<Record<string, Group>>({});

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        setLoading(true);
        
        // استرجاع الرسائل التي تم إرسالها إلى مجموعات ينتمي إليها المستخدم ولم يقرأها بعد
        const { data: userGroups, error: groupsError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', userId);
          
        if (groupsError) {
          throw groupsError;
        }
        
        // إذا لم يكن المستخدم في أي مجموعات
        if (!userGroups || userGroups.length === 0) {
          setUnreadMessages([]);
          setLoading(false);
          return;
        }
        
        // استخراج معرفات المجموعات
        const groupIds = userGroups.map(g => g.group_id);
        
        // البحث عن الرسائل في هذه المجموعات التي:
        // 1. لم يرسلها المستخدم نفسه (لا نريد أن نُظهر رسائل المستخدم له)
        // 2. لم يقرأها المستخدم (غير موجود في مصفوفة read_by)
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            user:user_id (
              id,
              name,
              avatar_url
            )
          `)
          .in('group_id', groupIds)
          .neq('user_id', userId)
          .not('read_by', 'cs', `["${userId}"]`)
          .order('timestamp', { ascending: false })
          .limit(10);
          
        if (messagesError) {
          throw messagesError;
        }
        
        if (!messages || messages.length === 0) {
          setUnreadMessages([]);
          setLoading(false);
          return;
        }
        
        // جلب تفاصيل المجموعات للعرض
        const { data: groupsData, error: groupDetailsError } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds);
          
        if (groupDetailsError) {
          throw groupDetailsError;
        }
        
        // تحويل مصفوفة المجموعات إلى كائن للوصول السريع بواسطة المعرف
        const groupsById: Record<string, Group> = {};
        groupsData?.forEach(group => {
          groupsById[group.id as string] = group as Group;
        });
        
        setGroups(groupsById);
        
        // تنسيق البيانات للعرض
        const formattedMessages = messages.map(message => ({
          ...message,
          user: message.user as unknown as User,
          group: groupsById[message.group_id as string]
        })) as (Message & { user?: User, group?: Group })[];
        
        setUnreadMessages(formattedMessages);
      } catch (err) {
        console.error('Error fetching unread messages:', err);
        setError('حدث خطأ أثناء جلب الرسائل غير المقروءة');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUnreadMessages();
    
    // إعداد الاستماع للتغييرات في الوقت الحقيقي
    const channel = supabase.channel('public:messages');
    const subscription = channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'messages',
    }, () => {
      // تحديث القائمة عند أي تغيير في جدول الرسائل
      fetchUnreadMessages();
    }).subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  
  // عندما يتم النقر على رسالة، قم بتحديث حالتها لتظهر كمقروءة
  const handleMessageRead = async (messageId: number) => {
    try {
      // الحصول على معلومات الرسالة الحالية
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('read_by')
        .eq('id', messageId)
        .single();
      
      if (messageError) throw messageError;
      
      // تحضير مصفوفة القراء المحدثة
      let updatedReadBy: string[] = [];
      
      if (messageData.read_by && Array.isArray(messageData.read_by)) {
        // إذا كانت مصفوفة read_by موجودة، نتحقق إذا كان المستخدم موجوداً فيها
        updatedReadBy = [...messageData.read_by];
        if (!updatedReadBy.includes(userId)) {
          updatedReadBy.push(userId);
        }
      } else {
        // إذا كانت مصفوفة read_by غير موجودة، ننشئ مصفوفة جديدة
        updatedReadBy = [userId];
      }
      
      // تحديث حالة الرسالة في قاعدة البيانات
      const { error: updateError } = await supabase
        .from('messages')
        .update({ 
          read_by: updatedReadBy,
          is_read: true
        })
        .eq('id', messageId);
      
      if (updateError) throw updateError;
      
      // تحديث قائمة الرسائل محلياً
      setUnreadMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };
  
  // معالجة حالات الواجهة
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
          <span className="text-gray-500">جارٍ تحميل الرسائل...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 mb-2">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }
  
  if (unreadMessages.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-500 mb-4">ليس لديك أي رسائل غير مقروءة</p>
        <Button asChild>
          <Link href="/dashboard/chat">فتح المحادثات</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">الرسائل غير المقروءة ({unreadMessages.length})</h3>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/chat">عرض الكل</Link>
        </Button>
      </div>
      
      {unreadMessages.map(message => (
        <Card key={message.id} className="hover:bg-gray-50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={message.user?.avatar_url || ""} />
                <AvatarFallback>{message.user?.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{message.user?.name || "مستخدم"}</p>
                    <Link 
                      href={`/dashboard/chat?group=${message.group_id}`}
                      className="text-xs text-blue-600 hover:underline flex items-center mt-0.5"
                      onClick={() => handleMessageRead(message.id)}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      {message.group?.name || "مجموعة"}
                    </Link>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500">{formatDate(message.timestamp || '')}</span>
                    
                    <Badge className="mt-1" variant="outline">
                      {message.message_type === 'text' ? 'رسالة' : 
                       message.message_type === 'shopping_list' ? 'قائمة تسوق' : 
                       message.message_type === 'product_list' ? 'قائمة منتجات' : 'محتوى'}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm mt-2 line-clamp-2 text-gray-700">
                  {message.message_type === 'text' ? message.message : 
                   message.message_type === 'product_list' ? `${message.product_list?.title || 'قائمة منتجات'} (${message.product_list?.products.length || 0} منتج)` : 
                   message.message_type === 'shopping_list' ? 'قائمة تسوق' : 
                   message.message}
                </p>
                
                <div className="mt-3">
                  <Button 
                    size="sm" 
                    variant="outline"
                    asChild
                  >
                    <Link 
                      href={`/dashboard/chat?group=${message.group_id}`}
                      onClick={() => handleMessageRead(message.id)}
                    >
                      عرض المحادثة
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 