import { PencilLine, Trash2, UserPlus } from 'lucide-react';
import React from 'react';

type User = {
  id: number;
  name: string;
  username: string;
  role: string;
  [key: string]: any;
};

type Props = {
  users: User[];
  onAddTechnician: () => void;
  onEditTechnician: (user: User) => void;
  onRequestDelete: (user: User | null) => void;
};

const TechniciansSection: React.FC<Props> = ({
  users,
  onAddTechnician,
  onEditTechnician,
  onRequestDelete,
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white">
          Manajemen Tim/User
        </h2>
        <button
          onClick={onAddTechnician}
          className="inline-flex items-center gap-2 bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <UserPlus size={20} />
          Tambah User Baru
        </button>
      </div>
      <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl">
        <div className="divide-y divide-gray-200 dark:divide-slate-700">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-light dark:bg-slate-700 flex items-center justify-center text-primary font-bold text-lg">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{user.username} • {user.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditTechnician(user)}
                  className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-full"
                  title="Edit User"
                >
                  <PencilLine className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRequestDelete(user)}
                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-slate-700 rounded-full"
                  title="Hapus User"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {users.length === 0 && (
          <p className="text-center py-10 text-gray-500">Belum ada data user.</p>
        )}
      </div>
    </div>
  );
};

export default TechniciansSection;
