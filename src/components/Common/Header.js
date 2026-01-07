import React, { useState } from 'react';
import { Menu, Bell, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, Badge } from './index';
import ChangelogModal from './ChangelogModal';
import { getVersionString } from '../../utils/changelog';

const Header = ({ onMenuClick, title }) => {
  const { userData } = useAuth();
  const [showChangelog, setShowChangelog] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-800 rounded-lg">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChangelog(true)}
              className="relative p-2 hover:bg-gray-800 rounded-lg group"
              title="Ver actualizaciones"
            >
              <Info size={20} />
              <Badge className="absolute -top-1 -right-1 px-1 py-0 text-xs bg-primary/20 text-primary">
                {getVersionString()}
              </Badge>
            </button>
            <button className="relative p-2 hover:bg-gray-800 rounded-lg">
              <Bell size={20} />
            </button>
            <Avatar name={userData?.name} size="sm" />
          </div>
        </div>
      </header>

      <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />
    </>
  );
};

export default Header;
