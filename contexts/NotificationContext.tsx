import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import NotificationToast from '../components/NotificationToast';

type Notification = {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
};

interface NotificationContextType {
  addNotification: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] space-y-3 w-full max-w-sm">
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onDismiss={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
