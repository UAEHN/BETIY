/**
 * تعريفات الأنواع المستخدمة في التطبيق
 * مركزية التعريفات تساعد في تجنب التكرار وتسهل الصيانة
 */

/**
 * فئة المنتج
 */
export type ProductCategory = {
  id: string;
  name: string;
  color: string;
  icon?: string;
  created_at: string;
  updated_at?: string;
};

/**
 * عنصر في قائمة التسوق
 */
export type ShoppingItem = {
  id: string;
  list_id: string;
  name: string;
  quantity: number;
  unit?: string;
  category_id?: string;
  category?: ProductCategory;
  notes?: string;
  added_by: string;
  purchased: boolean;
  purchased_by?: string;
  purchased_at?: string;
  created_at: string;
  updated_at?: string;
  user?: User;
  purchaser?: User;
};

/**
 * عنصر منتج في رسالة
 */
export type ProductItem = {
  id?: number;
  name: string;
  quantity: number;
  category_id?: number;
  category?: ProductCategory;
};

/**
 * رسالة قائمة منتجات
 */
export type ProductListMessage = {
  title?: string;
  products: ProductItem[];
};

/**
 * قائمة تسوق
 */
export type ShoppingList = {
  id: string;
  created_by: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  items?: ShoppingItem[];
};

/**
 * مستخدم
 */
export type User = {
  id: string;
  name: string | null;
  username?: string | null;
  display_name?: string | null;
  avatar_url: string | null;
  email: string | null;
  phone?: string | null;
  roles?: string[];
  is_family?: boolean;
  is_contact?: boolean;
};

/**
 * رسالة
 */
export type Message = {
  id: string;
  sender_id: string;
  recipient_id?: string;
  content: string;
  created_at: string;
  updated_at?: string;
  read: boolean;
  read_at?: string;
  message_type: 'text' | 'image' | 'product' | 'shopping_list' | 'location';
  metadata?: any;
  sender?: User;
}; 