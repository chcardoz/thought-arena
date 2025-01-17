export function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-85 z-50">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-8 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="mt-4 text-lg text-gray-700">{message}</span>
      </div>
    </div>
  );
}
