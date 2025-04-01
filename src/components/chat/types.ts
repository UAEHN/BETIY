import { User, ProductListMessage } from '@/types';

/**
 * تعريف واجهة للرسالة المطابقة لبنية قاعدة البيانات الفعلية
 */
export interface DatabaseMessage {
  id: number; // في قاعدة البيانات المعرف هو رقم وليس سلسلة نصية
  user_id: string;
  message: string;
  recipient_id?: string;
  timestamp: string;
  message_type: string; // 'text' | 'product_list' | etc.
  shopping_list_id?: number;
  product_list?: ProductListMessage;
  is_read?: boolean;
  read_by?: string[];
  user?: User;
}

/**
 * تعريف واجهة مخصصة للعضو في المجموعة تطابق بنية قاعدة البيانات
 */
export interface DatabaseGroupMember {
  id: string;
  name: string | null;
  username?: string | null;
  avatar_url: string | null;
  email?: string | null;
  role: 'admin' | 'member';
}

/**
 * تعريف واجهة للمجموعة تطابق بنية قاعدة البيانات
 */
export interface DatabaseGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  members: DatabaseGroupMember[];
}

/**
 * تعريف نوع Payload للتغييرات في الوقت الفعلي
 */
export type PostgresChangesPayload = {
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  new: any;
  old: any;
}; 