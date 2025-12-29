import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Upload, Home, User } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: <Home size={20} /> },
  { path: '/upload', label: 'Upload', icon: <Upload size={20} /> },
  { path: '/profile', label: 'Profile', icon: <User size={20} /> },
];

export default function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-slate-900 border-t border-slate-700 fixed bottom-0 left-0 right-0 z-50 md:relative md:border-t-0 md:border-b pb-safe-bottom">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around md:justify-start md:gap-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-2 transition-colors ${
                  isActive
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span className="text-xs md:text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
