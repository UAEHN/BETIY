'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/supabase';
import { User as AuthUser } from '@supabase/supabase-js';

// إضافة نوع يتضمن بيانات المصادقة
type FullUser = User & {
  authData?: {
    user: AuthUser | null;
  };
};

type AuthContextType = {
  user: FullUser | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// دالة مساعدة لفحص وتنظيف التخزين المحلي
const cleanupAuthStorage = () => {
  if (typeof window !== 'undefined') {
    // إزالة بيانات المصادقة القديمة
    try {
      localStorage.removeItem('beity-auth-storage');
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
    } catch (e) {
      console.error('خطأ أثناء تنظيف التخزين:', e);
    }
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FullUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    try {
      setLoading(true);
      // استيراد بطريقة متوافقة مع SSR
      const { getCurrentUser } = await import('@/lib/auth');
      const { supabase } = await import('@/lib/supabase');
      
      // الحصول على بيانات المستخدم من قاعدة البيانات
      const { user, error } = await getCurrentUser();
      
      if (error) {
        console.error('Error refreshing user:', error);
        
        // معالجة خطأ وجود توقيع JWT لمستخدم غير موجود
        if (typeof error === 'object' && 
            (error.message?.includes('User from sub claim in JWT does not exist') ||
             error.message?.includes('JWT'))) {
          console.log('تم اكتشاف مشكلة في توقيع JWT - تنظيف البيانات...');
          
          // تنظيف التخزين المحلي
          cleanupAuthStorage();
          
          // تعيين المستخدم إلى null
          setUser(null);
          setError('انتهت صلاحية الجلسة أو حدث خطأ في المصادقة. الرجاء تسجيل الدخول مرة أخرى.');
          return;
        }
        
        setError(typeof error === 'object' ? error.message : String(error));
        return;
      }
      
      // الحصول على بيانات المستخدم من Auth
      const { data: authData } = await supabase.auth.getUser();
      
      // دمج بيانات المستخدم مع بيانات المصادقة
      if (user) {
        const fullUser: FullUser = {
          ...user,
          authData: {
            user: authData.user
          }
        };
        setUser(fullUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Unexpected error refreshing user:', err);
      setError('حدث خطأ غير متوقع أثناء تحديث بيانات المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      // استيراد بطريقة متوافقة مع SSR
      const { signOut } = await import('@/lib/auth');
      const { error } = await signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        setError(typeof error === 'object' ? error.message : String(error));
        
        // محاولة تنظيف التخزين المحلي حتى مع وجود خطأ
        cleanupAuthStorage();
        return;
      }
      
      setUser(null);
    } catch (err) {
      console.error('Unexpected error signing out:', err);
      setError('حدث خطأ غير متوقع أثناء تسجيل الخروج');
      
      // محاولة تنظيف التخزين المحلي في حالة الخطأ
      cleanupAuthStorage();
    } finally {
      setLoading(false);
    }
  };

  // محاولة تحميل بيانات المستخدم عند تحميل المكون
  useEffect(() => {
    // استخدام setTimeout للتأكد من تشغيله فقط في المتصفح
    const timer = setTimeout(() => {
      refreshUser();
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
