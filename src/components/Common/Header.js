import React, { useState } from 'react';
import { Menu, Bell, Info, User, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Dropdown, DropdownItem } from './index';
import ChangelogModal from './ChangelogModal';
import { getVersionString } from '../../utils/changelog';

const Header = ({ onMenuClick, title }) => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [showChangelog, setShowChangelog] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 bg-sidebar/80 backdrop-blur-lg border-b border-gray-700/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-card rounded-lg">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChangelog(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-card rounded-lg transition-colors group"
              title="Ver actualizaciones"
            >
              <Info size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium text-gray-400 group-hover:text-primary transition-colors">
                v{getVersionString()}
              </span>
            </button>
            <button className="relative p-2 hover:bg-card rounded-lg">
              <Bell size={20} />
            </button>

            {/* Avatar con menú desplegable */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 hover:bg-card p-1 rounded-lg transition-colors">
                  <Avatar name={userData?.name} src={userData?.photoURL} size="sm" />
                </button>
              }
            >
              <DropdownItem icon={User} onClick={() => navigate('/profile')}>
                Mi Perfil
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
      </header>

      <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />
    </>
  );
};

export default Header;
