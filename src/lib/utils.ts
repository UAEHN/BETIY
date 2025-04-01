import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ShoppingItem } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * تصنيف عناصر التسوق بناءً على الكلمات المفتاحية باللغتين العربية والإنجليزية
 * @param itemText نص العنصر المراد تصنيفه
 * @returns رقم الفئة
 */
export const categorizeItem = (itemText: string): number => {
  // تحويل النص إلى أحرف صغيرة
  const itemLower = itemText.toLowerCase().trim()
  
  // قائمة من الكلمات المفتاحية لكل فئة باللغتين العربية والإنجليزية
  const categoryKeywords: Record<number, string[]> = {
    // الخضروات / Vegetables
    1: [
      // العربية
      'طماطم', 'خيار', 'بصل', 'جزر', 'بطاطس', 'بطاطا', 'باذنجان', 'فلفل', 'كوسة', 'خس',
      // الإنجليزية
      'tomato', 'cucumber', 'onion', 'carrot', 'potato', 'eggplant', 'pepper', 'lettuce', 'vegetable'
    ],
    
    // الفواكه / Fruits
    2: [
      // العربية
      'تفاح', 'موز', 'برتقال', 'فراولة', 'عنب', 'بطيخ', 'مانجو', 'خوخ', 'مشمش', 'تين', 'رمان',
      // الإنجليزية
      'apple', 'banana', 'orange', 'strawberry', 'grape', 'watermelon', 'mango', 'peach', 'fruit'
    ],
    
    // اللحوم / Meat
    3: [
      // العربية
      'لحم', 'دجاج', 'لحمة', 'ستيك', 'مفروم', 'كبدة', 'سمك', 'تونة', 'سلمون',
      // الإنجليزية
      'meat', 'chicken', 'steak', 'beef', 'fish', 'tuna', 'salmon', 'liver', 'pork', 'lamb'
    ],
    
    // الألبان / Dairy
    4: [
      // العربية
      'حليب', 'جبن', 'زبادي', 'لبن', 'زبدة', 'كريمة', 'جبنة',
      // الإنجليزية
      'milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy'
    ],
    
    // المعلبات / Canned Food
    5: [
      // العربية
      'معلب', 'علبة', 'معلبات', 'تونة', 'ذرة', 'فول', 'حمص',
      // الإنجليزية
      'can', 'canned', 'tuna', 'corn', 'beans', 'chickpeas'
    ],
    
    // المخبوزات / Bakery
    6: [
      // العربية
      'خبز', 'كعك', 'بسكويت', 'كيك', 'طحين', 'دقيق', 'سكر',
      // الإنجليزية
      'bread', 'cake', 'biscuit', 'cookie', 'flour', 'sugar', 'bakery'
    ],
    
    // المشروبات / Beverages
    7: [
      // العربية
      'ماء', 'عصير', 'شاي', 'قهوة', 'كولا', 'بيبسي', 'مشروب',
      // الإنجليزية
      'water', 'juice', 'tea', 'coffee', 'cola', 'pepsi', 'drink', 'beverage'
    ],
    
    // المنظفات / Cleaning Supplies
    8: [
      // العربية
      'صابون', 'شامبو', 'منظف', 'معطر', 'كلوركس', 'مبيض', 'معجون أسنان', 'فرشاة',
      // الإنجليزية
      'soap', 'shampoo', 'cleaner', 'detergent', 'bleach', 'toothpaste', 'brush'
    ],
    
    // أخرى / Other
    9: [
      // العربية
      'ورق', 'قلم', 'بطارية', 'شاحن', 'أدوات',
      // الإنجليزية
      'paper', 'pen', 'battery', 'charger', 'tool'
    ]
  }

  // البحث عن تطابق في الكلمات المفتاحية
  for (const [categoryId, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (itemLower.includes(keyword.toLowerCase())) {
        return parseInt(categoryId)
      }
    }
  }
  
  // إذا لم يتم العثور على تطابق، فإرجاع الفئة "أخرى"
  return 9
}

/**
 * الحصول على اسم الفئة بناءً على رقم الفئة
 * @param categoryId رقم الفئة
 * @returns اسم الفئة
 */
export const getCategoryName = (categoryId: number): string => {
  const categories: Record<number, string> = {
    1: 'الخضروات',
    2: 'الفواكه',
    3: 'اللحوم',
    4: 'الألبان',
    5: 'المعلبات',
    6: 'المخبوزات',
    7: 'المشروبات',
    8: 'المنظفات',
    9: 'أخرى'
  };
  
  return categories[categoryId] || 'أخرى';
};

/**
 * تجميع عناصر التسوق حسب الفئة
 * @param items قائمة العناصر
 * @returns كائن يحتوي على العناصر مجمعة حسب الفئة
 */
export const groupItemsByCategory = (items: ShoppingItem[]): Record<number, ShoppingItem[]> => {
  return items.reduce<Record<number, ShoppingItem[]>>((acc, item) => {
    const categoryId = (item.category_id ? parseInt(item.category_id) : 9) as number;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {});
}

/**
 * تنسيق التاريخ للعرض
 * @param dateString سلسلة التاريخ
 * @returns تاريخ منسق للعرض
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ar-SA', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    day: 'numeric',
    month: 'short'
  }).format(date)
}
