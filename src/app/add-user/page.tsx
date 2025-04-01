import type { Metadata } from 'next';
import UserSearch from '@/components/users/user-search';

export const metadata: Metadata = {
  title: 'البحث عن مستخدمين | بيتي',
  description: 'ابحث عن مستخدمين وأضفهم للتواصل',
};

export default function AddUserPage() {
  return (
    <div className="container max-w-lg py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center">البحث عن مستخدمين</h1>
        <p className="text-center text-gray-600 mt-2">
          ابحث عن مستخدمين باستخدام الاسم الظاهر وأضفهم للتواصل
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <UserSearch />
      </div>
    </div>
  );
} 