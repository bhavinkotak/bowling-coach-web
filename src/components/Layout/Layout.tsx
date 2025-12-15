import type { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export default function Layout({ children, showHeader = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1">{children}</main>
    </div>
  );
}
