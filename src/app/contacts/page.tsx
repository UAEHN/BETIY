import { Metadata } from 'next';
import ContactsList from '@/components/contacts/contacts-list';
import { Suspense } from 'react';
import { GoBackButton } from '@/components/ui/go-back-button';

export const metadata: Metadata = {
  title: 'جهات الاتصال | بيتي',
  description: 'إدارة جهات الاتصال الخاصة بك',
};

export default function ContactsPage() {
  return (
    <div className="container max-w-2xl py-6">
      <div className="flex items-center mb-6">
        <GoBackButton />
        <h1 className="text-2xl font-bold mr-2">جهات الاتصال</h1>
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <Suspense fallback={<div className="p-4 text-center">جاري تحميل جهات الاتصال...</div>}>
          <ContactsList />
        </Suspense>
      </div>
    </div>
  );
} 