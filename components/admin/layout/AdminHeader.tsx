// components/admin/layout/AdminHeader.tsx
import React from 'react';

type Props = {
  currentUserName?: string;
  onOpenSidebar: () => void;
};

const AdminHeader: React.FC<Props> = ({ currentUserName, onOpenSidebar }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm h-20 flex items-center justify-between lg:justify-end px-6">
      <button onClick={onOpenSidebar} className="lg:hidden p-2 text-gray-600 dark:text-gray-300">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <div className="flex items-center gap-4">
        <span className="font-semibold text-gray-700 dark:text-gray-200">
          Hello, {currentUserName}
        </span>
        <div className="w-10 h-10 rounded-full bg-primary-light dark:bg-slate-700 flex items-center justify-center text-primary font-bold text-lg">
          {currentUserName?.charAt(0)}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
