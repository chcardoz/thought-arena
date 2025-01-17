import { X } from 'lucide-react';

interface ErrorOverlayProps {
  message: string;
}

export function ErrorOverlay({ message }: ErrorOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-85 z-50">
      <div className="text-center">
        <X className="mx-auto text-red-800" size={48} />
        <p className="mt-4 text-lg text-red-800 font-bold">{message}</p>
      </div>
    </div>
  );
}
