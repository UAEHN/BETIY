import { createClient } from '@supabase/supabase-js';
import { User, ShoppingItem, Message, ShoppingList, ProductCategory } from '@/types';

// تحقق من وجود متغيرات البيئة المطلوبة
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'يرجى تعيين NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY في ملف .env.local'
  );
}

// كود مكيّف مع SSR للتأكد من عدم إنشاء عملاء متعددين
const isBrowser = () => typeof window !== 'undefined';

// المتغير الذي سيحمل نسخة واحدة من عميل Supabase
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// إنشاء نسخة واحدة من عميل Supabase
const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;
  
  // إنشاء عميل جديد
  supabaseInstance = createClient(supabaseUrl as string, supabaseAnonKey as string, {
    auth: {
      persistSession: true,
      storageKey: 'supabase.auth.token',
    },
  });
  
  return supabaseInstance;
};

// إنشاء عميل Supabase
export const supabase = getSupabase();

// إنشاء مساعد لإنشاء جلسة في طرف الخادم للاستخدام المستقبلي إذا لزم الأمر
export const getServerSupabase = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  });
};

// تصدير الأنواع من الملف المركزي
export type {
  User,
  ShoppingItem,
  Message,
  ShoppingList,
  ProductCategory
};

// Helper function to check if we have a session
export const hasActiveSession = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error checking session:', error);
      return false;
    }
    return !!data.session;
  } catch (err) {
    console.error('Unexpected error checking session:', err);
    return false;
  }
};
