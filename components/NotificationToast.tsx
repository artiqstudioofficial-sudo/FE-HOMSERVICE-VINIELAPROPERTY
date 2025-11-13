import React, { useEffect, useState } from 'react';
import { CheckCircle, Info, XCircle, X } from 'lucide-react';

type ToastProps = {
  message: string;
  type: 'success' | 'info' | 'error';
  onDismiss: () => void;
};

const icons = {
  success: <CheckCircle className="h-6 w-6 text-green-500" />,
  info: <Info className="h-6 w-6 text-blue-500" />,
  error: <XCircle className="h-6 w-6 text-red-500" />,
};

const NotificationToast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);
    
    // Set timer to dismiss
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Allow time for fade-out animation before removing from DOM
      setTimeout(onDismiss, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`max-w-sm w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transition-all duration-300 ease-in-out ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Notifikasi Terkirim
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleDismiss}
              className="bg-white dark:bg-slate-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <span className="sr-only">Tutup</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
