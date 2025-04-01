'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Message as BaseMessage, User, ProductListMessage } from '@/types';
import { DatabaseMessage, PostgresChangesPayload } from './types';

// مكونات Shadcn UI
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { User as UserIcon, PenLine } from 'lucide-react';

import ProductMessage from './product-message';
import ProductListView from './product-list-view';

interface ChatProps {
  recipientId?: string;
}

export default function Chat({ recipientId }: ChatProps) {
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recipient, setRecipient] = useState<User | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // تنفيذ التمرير لأسفل عند تغيير الرسائل
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionData.session.user.id)
            .single();

          if (userError) {
            console.error('Error fetching user data:', userError);
            setCurrentUser({
              id: sessionData.session.user.id,
              name: 'أنت',
              avatar_url: '',
              email: null
            });
            return;
          }

          if (userData) {
            setCurrentUser(userData as User);
          } else {
            setCurrentUser({
              id: sessionData.session.user.id,
              name: 'أنت',
              avatar_url: '',
              email: null
            });
          }
        } else {
          // إعداد مستخدم وهمي للعرض
          setCurrentUser({
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            name: 'أنت',
            avatar_url: '',
            email: null
          });
        }
      } catch (err) {
        console.error('Error getting current user:', err);
        setCurrentUser({
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          name: 'أنت',
          avatar_url: '',
          email: null
        });
      }
    };

    getCurrentUser();
  }, []);

  // جلب بيانات المستخدم المستقبل عند تغيير الـ recipientId
  useEffect(() => {
    const fetchRecipientDetails = async () => {
      if (!recipientId) return;
      
      try {
        console.log('جاري جلب بيانات المستخدم:', recipientId);
        
        // جلب تفاصيل المستخدم
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', recipientId)
          .single();
          
        if (userError) {
          console.error('خطأ في جلب بيانات المستخدم:', userError);
          return;
        }
        
        setRecipient(userData as User);
      } catch (err) {
        console.error('Error fetching recipient details:', err);
      }
    };

    fetchRecipientDetails();
  }, [recipientId]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUser || !recipientId) {
        console.log('No user or recipient id, skipping message fetch');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching messages between user', currentUser.id, 'and recipient', recipientId);
        
        // جلب جميع الرسائل بين المستخدم الحالي والمستخدم المحدد في كلا الاتجاهين
        const { data, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id,
            user_id,
            recipient_id,
            message,
            timestamp,
            message_type,
            is_read,
            read_by,
            product_list,
            user:user_id (
              id, 
              name,
              username,
              avatar_url
            )
          `)
          .or(`and(user_id.eq.${currentUser.id},recipient_id.eq.${recipientId}),and(user_id.eq.${recipientId},recipient_id.eq.${currentUser.id})`)
          .order('timestamp', { ascending: true });
        
        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          setError('فشل في تحميل الرسائل. يرجى المحاولة مرة أخرى.');
          setLoading(false);
          return;
        }
        
        if (!data) {
          console.log('No messages found');
          setMessages([]);
          setLoading(false);
          return;
        }
        
        console.log('Messages loaded:', data.length);
        
        const formattedMessages = data.map((msg) => {
          return {
            ...msg,
            product_list: msg.product_list ? msg.product_list as ProductListMessage : undefined,
            user: msg.user as unknown as User | undefined
          } as DatabaseMessage;
        });
        
        setMessages(formattedMessages);
      } catch (err) {
        console.error('Error in fetchMessages:', err);
        setError('حدث خطأ أثناء تحميل الرسائل.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    
    // إعداد الاشتراك في الرسائل الجديدة
    if (currentUser && recipientId) {
      const messagesSubscription = supabase
        .channel('messages-channel')
        .on('postgres_changes', 
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `(user_id=eq.${currentUser.id} AND recipient_id=eq.${recipientId}) OR (user_id=eq.${recipientId} AND recipient_id=eq.${currentUser.id})`
          },
          async (payload: PostgresChangesPayload) => {
            console.log('Real-time message change detected:', payload);
            
            if (payload.eventType === 'INSERT') {
              const newMessage = payload.new as DatabaseMessage;
              
              // عند إضافة رسالة جديدة - قم بإضافتها إلى القائمة
              try {
                // جلب معلومات المستخدم المرسل
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('id, name, username, avatar_url')
                  .eq('id', newMessage.user_id)
                  .single();
                
                if (userError) {
                  console.error('Error fetching sender data for real-time message:', userError);
                }
                
                // إضافة الرسالة الجديدة مع معلومات المرسل
                setMessages(prev => [...prev, {
                  ...newMessage,
                  user: userData as unknown as User | undefined
                } as DatabaseMessage]);
                
                // تمرير تلقائي إلى نهاية الرسائل
                setTimeout(scrollToBottom, 100);
              } catch (err) {
                console.error('Error processing real-time message:', err);
              }
            }
          }
        )
        .subscribe();
      
      return () => {
        console.log('Unsubscribing from messages channel');
        supabase.removeChannel(messagesSubscription);
      };
    }
  }, [currentUser, recipientId]);

  // Send a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser || !recipientId) {
      return;
    }
    
    try {
      console.log('Sending message to recipient:', recipientId);
      
      const messageData = {
        user_id: currentUser.id,
        recipient_id: recipientId,
        message: newMessage,
        message_type: 'text',
        timestamp: new Date().toISOString(),
        is_read: false,
        read_by: []
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select();
      
      if (error) {
        console.error('Error sending message:', error);
        return;
      }
      
      setNewMessage('');
    } catch (err) {
      console.error('Error in handleSendMessage:', err);
    }
  };

  // Send a product list
  const handleSendProductList = async (productList: ProductListMessage) => {
    if (!currentUser || !recipientId) {
      console.error('Cannot send product list: No current user or recipient');
      return;
    }
    
    try {
      console.log('Sending product list to recipient:', recipientId);
      
      const messageData = {
        user_id: currentUser.id,
        recipient_id: recipientId,
        message: productList.title || 'قائمة منتجات',
        message_type: 'product_list',
        timestamp: new Date().toISOString(),
        is_read: false,
        read_by: [],
        product_list: productList
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select();
      
      if (error) {
        console.error('Error sending product list:', error);
        return;
      }
      
      setSheetOpen(false);
    } catch (err) {
      console.error('Error in handleSendProductList:', err);
    }
  };

  // للتشخيص فقط
  const logDebugInfo = () => {
    console.log('Current state:', {
      messages,
      currentUser,
      recipientId,
      recipient
    });
  };

  // Toggle product list sheet
  const toggleSheet = () => {
    setSheetOpen(!sheetOpen);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-100px)]">
      <Card className="flex flex-col h-full rounded-lg shadow-sm">
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Avatar className="h-9 w-9">
                <AvatarImage 
                  src={recipient?.avatar_url || ''} 
                  alt={recipient?.name || 'المستخدم'} 
                />
                <AvatarFallback>
                  {recipient?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg font-semibold">
                  {recipient?.name || recipient?.username || 'محادثة'}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {recipient ? '@' + recipient.username : 'المحادثة الخاصة'}
                </CardDescription>
              </div>
            </div>
            <button 
              className="p-1 rounded-full hover:bg-gray-100 focus:outline-none" 
              onClick={logDebugInfo}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-gray-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow p-0 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full py-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">جاري تحميل المحادثة...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-full py-10">
              <div className="text-center text-red-500">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-8 w-8 mx-auto mb-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    
                    // بعد ثانية واحدة، قم بإعادة تحميل الصفحة
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  }}
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full py-10">
              <div className="text-center">
                <UserIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">ابدأ محادثة جديدة مع {recipient?.name || 'هذا المستخدم'}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {messages.map((message, index) => {
                const isCurrentUser = message.user_id === currentUser?.id;
                const showDate = index === 0 || (
                  new Date(message.timestamp).toDateString() !==
                  new Date(messages[index - 1].timestamp).toDateString()
                );
                
                return (
                  <div key={message.id} className="space-y-1">
                    {showDate && (
                      <div className="flex justify-center my-3">
                        <span className="px-3 py-1 text-xs bg-gray-100 rounded-full text-gray-600">
                          {new Date(message.timestamp).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex items-end gap-2 max-w-[80%]">
                        {!isCurrentUser && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage 
                              src={message.user?.avatar_url || ''} 
                              alt={message.user?.name || 'المستخدم'} 
                            />
                            <AvatarFallback>
                              {message.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`space-y-1 ${isCurrentUser ? 'order-first' : 'order-last'}`}>
                          {message.message_type === 'product_list' && message.product_list ? (
                            <div className={`rounded-lg p-2 ${
                              isCurrentUser 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              <ProductMessage 
                                productList={message.product_list} 
                                isCurrentUser={isCurrentUser}
                              />
                            </div>
                          ) : (
                            <div className={`rounded-lg px-3 py-2 ${
                              isCurrentUser 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              <p className="text-sm">{message.message}</p>
                            </div>
                          )}
                          
                          <p className={`text-[10px] ${
                            isCurrentUser ? 'text-right pr-1' : 'text-left pl-1'
                          } text-gray-500`}>
                            {new Date(message.timestamp).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-2 border-t">
          <form 
            onSubmit={handleSendMessage} 
            className="flex items-center w-full space-x-2 rtl:space-x-reverse"
          >
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full shrink-0"
                >
                  <PenLine className="h-5 w-5" />
                  <span className="sr-only">إرسال قائمة منتجات</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90%] sm:h-[70%] space-y-6 p-4">
                <SheetHeader>
                  <SheetTitle className="text-center">إرسال قائمة منتجات</SheetTitle>
                </SheetHeader>
                <ProductListView onSubmit={handleSendProductList} />
              </SheetContent>
            </Sheet>
            
            <div className="relative flex-grow">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="اكتب رسالة..."
                className="w-full h-10 px-4 border rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={!newMessage.trim()} 
              className="h-9 px-3 rounded-full shrink-0"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 rotate-180 rtl:rotate-0" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                />
              </svg>
              <span className="sr-only">إرسال</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
