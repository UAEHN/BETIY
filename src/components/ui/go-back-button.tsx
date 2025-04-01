"use client";

import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GoBackButtonProps {
  fallbackPath?: string;
}

export function GoBackButton({ fallbackPath = '/dashboard' }: GoBackButtonProps) {
  const router = useRouter();
  
  const handleGoBack = () => {
    // محاولة العودة للخلف في تاريخ التصفح، وإن لم يكن ممكنًا الذهاب إلى المسار الاحتياطي
    try {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push(fallbackPath);
      }
    } catch (e) {
      router.push(fallbackPath);
    }
  };
  
  return (
    <Button 
      onClick={handleGoBack} 
      variant="ghost" 
      size="icon" 
      className="h-9 w-9"
      aria-label="العودة للخلف"
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  );
} 