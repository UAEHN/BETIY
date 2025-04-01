'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // تسجيل الخطأ في وحدة التحكم للتصحيح
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">حدث خطأ</h2>
      <p className="mb-6 text-gray-700 max-w-lg">{error.message || 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى'}</p>
      {error.stack && (
        <pre className="bg-gray-100 p-4 rounded text-left overflow-auto max-w-lg mb-6 text-xs">
          {error.stack}
        </pre>
      )}
      <button
        onClick={reset}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded"
      >
        محاولة مرة أخرى
      </button>
    </div>
  );
} 