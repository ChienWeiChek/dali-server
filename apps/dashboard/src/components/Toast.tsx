

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({ id, message, type, duration = 5000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(id), 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  const typeStyles = {
    success: 'bg-green-100 border-green-400 text-green-800',
    error: 'bg-red-100 border-red-400 text-red-800',
    info: 'bg-blue-100 border-blue-400 text-blue-800',
  };

  const typeIcons = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
  };

  return (
    <div
      className={`
        flex items-center justify-between p-4 mb-2 rounded-lg border
        shadow-lg transform transition-all duration-300 ease-out
        ${typeStyles[type]}
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      style={{ minWidth: '300px', maxWidth: '400px' }}
    >
      <div className="flex items-center">
        <span className="mr-3 text-lg font-bold">{typeIcons[type]}</span>
        <span className="font-medium">{message}</span>
      </div>
      <button
        onClick={handleClose}
        className="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
