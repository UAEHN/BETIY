'use client';

import { useState } from 'react';
import { ProductItem, ProductListMessage } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, X, Send, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { categorizeItem } from '@/lib/utils';

interface ProductMessageProps {
  productList: ProductListMessage;
  isCurrentUser: boolean;
}

export default function ProductMessage({ productList, isCurrentUser }: ProductMessageProps) {
  // تنظيم المنتجات حسب الفئة
  const groupedProducts = productList.products.reduce((acc, product) => {
    const categoryId = product.category_id || 9; // استخدام الفئة "أخرى" إذا لم يتم تحديد فئة
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(product);
    return acc;
  }, {} as Record<number, typeof productList.products>);

  // الحصول على أيقونة الفئة وخلفيتها
  const getCategoryIcon = (categoryId: number) => {
    switch (categoryId) {
      case 1: return { icon: '🥬', color: 'text-green-600' };
      case 2: return { icon: '🍎', color: 'text-red-600' };
      case 3: return { icon: '🥩', color: 'text-rose-600' };
      case 4: return { icon: '🥛', color: 'text-blue-600' };
      case 5: return { icon: '🥫', color: 'text-yellow-600' };
      case 6: return { icon: '🍪', color: 'text-amber-600' };
      case 7: return { icon: '☕', color: 'text-brown-600' };
      case 8: return { icon: '🧹', color: 'text-indigo-600' };
      default: return { icon: '📦', color: 'text-gray-600' };
    }
  };

  // الحصول على اسم الفئة
  const getCategoryName = (categoryId: number) => {
    switch (categoryId) {
      case 1: return 'خضروات';
      case 2: return 'فواكه';
      case 3: return 'لحوم ودواجن';
      case 4: return 'ألبان وبيض';
      case 5: return 'معلبات';
      case 6: return 'مخبوزات وحلويات';
      case 7: return 'مشروبات';
      case 8: return 'منظفات';
      default: return 'أخرى';
    }
  };

  // فرز الفئات
  const sortedCategories = Object.keys(groupedProducts)
    .map(Number)
    .sort((a, b) => a - b);

  // عدد إجمالي المنتجات
  const totalItems = productList.products.reduce((sum, product) => sum + product.quantity, 0);

  const backgroundColor = isCurrentUser ? 'bg-blue-500' : 'bg-gray-100';
  const textColor = isCurrentUser ? 'text-white' : 'text-gray-800';
  const accentColor = isCurrentUser ? 'bg-blue-400/30' : 'bg-gray-200/60';

  return (
    <div className="w-full">
      <div className={`rounded-md p-1.5 mb-1.5 ${backgroundColor} ${textColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ShoppingCart className="h-3 w-3 mr-1" />
            <div className="text-xs font-semibold">{productList.title || 'قائمة منتجات'}</div>
          </div>
          <Badge className={`${accentColor} ${textColor} text-[10px] px-1`}>
            {productList.products.length} منتج | {totalItems} عنصر
          </Badge>
        </div>
      </div>

      <div className="max-h-[15rem] overflow-y-auto text-xs">
        {sortedCategories.map(categoryId => (
          <div key={categoryId} className="mb-1.5">
            <div className={`flex items-center px-1.5 py-1 ${accentColor} rounded-md mb-1 ${textColor}`}>
              <span className="mr-1">{getCategoryIcon(categoryId).icon}</span>
              <span className="font-semibold">{getCategoryName(categoryId)}</span>
            </div>
            <div className="pr-2">
              {groupedProducts[categoryId].map((product, idx) => (
                <div key={idx} className="flex items-center justify-between py-0.5">
                  <div>{product.name}</div>
                  <Badge variant="outline" className={`ml-1 ${textColor} border-0 ${accentColor} text-[10px] px-1`}>
                    {product.quantity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 