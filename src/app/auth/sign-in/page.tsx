import type { Metadata } from 'next';
import { SignIn } from '@/components/auth/sign-in';

export const metadata: Metadata = {
  title: 'تسجيل الدخول | بيتي',
  description: 'تسجيل الدخول إلى حسابك',
};

export default function SignInPage() {
  return (
    <div className="container max-w-lg py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
        <p className="text-gray-600 mt-2">
          قم بتسجيل الدخول للوصول إلى حسابك
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <SignIn />
      </div>
    </div>
  );
} 