export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
      <h2 className="text-xl font-medium text-gray-700">جاري تحميل بيتي...</h2>
    </div>
  );
} 