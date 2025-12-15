import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Upload, 
  User, 
  Settings, 
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface SidebarItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  { path: '/', label: 'Home', icon: <Home size={20} /> },
  { path: '/upload', label: 'Upload', icon: <Upload size={20} /> },
  { path: '/profile', label: 'Profile', icon: <User size={20} /> },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <aside className="hidden lg:block w-64 bg-slate-900 border-r border-slate-800 h-screen sticky top-0">
      <div className="flex flex-col h-full">
        {/* Logo / Brand */}
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white">Bowling Coach</h1>
          <p className="text-sm text-slate-400 mt-1">AI Analysis Platform</p>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 space-y-1">
          <button
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
          
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
