import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from './index';

const Header = ({ onMenuClick, title }) => {
  const { userData } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-lg border-b border-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-800 rounded-lg">
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 hover:bg-gray-800 rounded-lg">
            <Bell size={20} />
          </button>
          <Avatar name={userData?.name} size="sm" />
        </div>
      </div>
    </header>
  );
};

export default Header;
