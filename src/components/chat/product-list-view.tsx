'use client';

import React, { useState } from 'react';
import { ProductItem, ProductListMessage } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCategoryName, categorizeItem } from '@/lib/utils';
import { 
  ShoppingCart, 
  Carrot, 
  Apple, 
  Beef, 
  Milk, 
  Archive, 
  Cookie, 
  Coffee, 
  Sparkles, 
  Package2,
  Edit2,
  Save,
  Trash2,
  Plus,
  Minus,
  X,
  PenLine
} from 'lucide-react';

interface ProductListViewProps {
  onSubmit: (productList: ProductListMessage) => Promise<void>;
}

export default function ProductListView({ onSubmit }: ProductListViewProps) {
  const [title, setTitle] = useState('');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState('1');
  const [error, setError] = useState<string | null>(null);
  
  // الحصول على أيقونة الفئة وخلفيتها
  const getCategoryIcon = (categoryId: number) => {
    switch (categoryId) {
      case 1: return { icon: <Carrot className="h-5 w-5 text-green-600" />, bg: 'bg-green-100' };
      case 2: return { icon: <Apple className="h-5 w-5 text-red-600" />, bg: 'bg-red-100' };
      case 3: return { icon: <Beef className="h-5 w-5 text-rose-600" />, bg: 'bg-rose-100' };
      case 4: return { icon: <Milk className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-100' };
      case 5: return { icon: <Archive className="h-5 w-5 text-yellow-600" />, bg: 'bg-yellow-100' };
      case 6: return { icon: <Cookie className="h-5 w-5 text-amber-600" />, bg: 'bg-amber-100' };
      case 7: return { icon: <Coffee className="h-5 w-5 text-teal-600" />, bg: 'bg-teal-100' };
      case 8: return { icon: <Sparkles className="h-5 w-5 text-indigo-600" />, bg: 'bg-indigo-100' };
      default: return { icon: <Package2 className="h-5 w-5 text-gray-600" />, bg: 'bg-gray-100' };
    }
  };

  // تنظيم المنتجات حسب الفئة
  const groupedProducts = products.reduce((acc, product) => {
    const categoryId = product.category_id || 9; // استخدام الفئة "أخرى" إذا لم يتم تحديد فئة
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(product);
    return acc;
  }, {} as Record<number, ProductItem[]>);
  
  // فرز المنتجات داخل كل فئة حسب الاسم
  Object.keys(groupedProducts).forEach(categoryId => {
    groupedProducts[Number(categoryId)].sort((a, b) => 
      a.name.localeCompare(b.name, 'ar')
    );
  });
  
  // إضافة منتج جديد
  const handleAddProduct = () => {
    if (!newProductName.trim()) return;
    
    // تحديد الفئة باستخدام وظيفة التصنيف
    const category_id = categorizeItem(newProductName);
    
    // إضافة المنتج إلى القائمة
    const newProduct: ProductItem = {
      name: newProductName.trim(),
      quantity: Number(newProductQuantity) || 1,
      category_id
    };
    
    setProducts([...products, newProduct]);
    setNewProductName('');
    setNewProductQuantity('1');
  };
  
  // حذف منتج
  const handleRemoveProduct = (index: number) => {
    const updatedProducts = [...products];
    updatedProducts.splice(index, 1);
    setProducts(updatedProducts);
  };
  
  // تغيير كمية منتج
  const handleChangeQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedProducts = [...products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      quantity: newQuantity
    };
    
    setProducts(updatedProducts);
  };
  
  // إرسال قائمة المنتجات
  const handleSubmit = async () => {
    if (products.length === 0) {
      setError('يرجى إضافة منتج واحد على الأقل');
      return;
    }
    
    try {
      const productList: ProductListMessage = {
        title: title.trim() || 'قائمة منتجات',
        products
      };
      
      await onSubmit(productList);
      
      // إعادة تعيين الحالة بعد الإرسال الناجح
      setTitle('');
      setProducts([]);
      setError(null);
    } catch (err) {
      console.error('Error sending product list:', err);
      setError('فشل في إرسال قائمة المنتجات. يرجى المحاولة مرة أخرى.');
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">إنشاء قائمة منتجات</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md mb-3 text-sm" role="alert">
            <span>{error}</span>
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            عنوان القائمة (اختياري)
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان القائمة..."
            className="w-full"
          />
        </div>
        
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label htmlFor="product-name" className="block text-sm font-medium mb-1">
              المنتج
            </label>
            <Input
              id="product-name"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="اسم المنتج..."
              className="w-full"
            />
          </div>
          
          <div className="w-24">
            <label htmlFor="quantity" className="block text-sm font-medium mb-1">
              الكمية
            </label>
            <div className="flex">
              <Input
                id="quantity"
                type="number"
                min="1"
                value={newProductQuantity}
                onChange={(e) => setNewProductQuantity(e.target.value)}
                className="w-full text-center"
              />
            </div>
          </div>
          
          <div className="flex items-end">
            <Button onClick={handleAddProduct} className="mb-0.5" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              إضافة
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 border-t pt-3">
        <h3 className="font-medium mb-2">المنتجات المضافة</h3>
        
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد منتجات. أضف بعض المنتجات لتظهر هنا.
          </div>
        ) : (
          <div>
            {Object.keys(groupedProducts).sort().map(categoryKey => {
              const categoryId = Number(categoryKey);
              const categoryIcon = getCategoryIcon(categoryId);
              
              return (
                <div key={categoryKey} className="mb-3">
                  <div className={`flex items-center ${categoryIcon.bg} px-2 py-1 rounded-md mb-1`}>
                    <div className="mr-2">{categoryIcon.icon}</div>
                    <div className="font-medium">{getCategoryName(categoryId)}</div>
                  </div>
                  
                  <ul className="space-y-1">
                    {groupedProducts[categoryId].map((product, idx) => {
                      // البحث عن مؤشر المنتج في المصفوفة الرئيسية
                      const mainIndex = products.findIndex(p => 
                        p.name === product.name && p.quantity === product.quantity);
                      
                      return (
                        <li key={idx} className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded-md">
                          <div>
                            <span>{product.name}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="flex items-center mr-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleChangeQuantity(mainIndex, product.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Badge className="mx-1 min-w-[24px] text-center">{product.quantity}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleChangeQuantity(mainIndex, product.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500"
                              onClick={() => handleRemoveProduct(mainIndex)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t mt-auto">
        <Button 
          onClick={handleSubmit} 
          className="w-full" 
          disabled={products.length === 0}
        >
          إرسال قائمة المنتجات
        </Button>
      </div>
    </div>
  );
} 