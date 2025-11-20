// components/admin/layout/AdminSidebar.tsx
import type { AdminSection } from '@/pages/AdminPage';
import {
  BarChart2,
  Calendar as CalendarIcon,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Settings,
  Users,
} from 'lucide-react';
import React from 'react';

type Props = {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
};

const navItems: { name: string; icon: React.ComponentType<any>; section: AdminSection }[] = [
  { name: 'Dashboard KPI', icon: BarChart2, section: 'kpi' },
  { name: 'Daftar Booking', icon: LayoutDashboard, section: 'bookings' },
  { name: 'Jadwal Teknisi', icon: CalendarIcon, section: 'schedule' },
  { name: 'Peta Lokasi', icon: MapIcon, section: 'map' },
  { name: 'Manajemen Tim/User', icon: Users, section: 'technicians' },
  { name: 'Manajemen Layanan', icon: Settings, section: 'services' },
  { name: 'Atur Ketersediaan', icon: Settings, section: 'availability' },
];

const AdminSidebar: React.FC<Props> = ({
  activeSection,
  onSectionChange,
  isOpen,
  onClose,
  onLogout,
}) => {
  return (
    <aside
      className={`fixed lg:relative lg:translate-x-0 inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 shadow-lg transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-center p-6 border-b dark:border-slate-700 h-20">
        <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-poppins">
          Admin Viniela
        </span>
      </div>
      <nav className="flex-grow p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.section}
            onClick={() => {
              onSectionChange(item.section);
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors ${
              activeSection === item.section
                ? 'bg-primary-light text-primary dark:bg-slate-700'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50'
            }`}
          >
            <item.icon size={20} />
            {item.name}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t dark:border-slate-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
