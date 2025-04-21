import React from 'react';
import { Sidebar } from '@/components/ui/Sidebar';

interface Props {
  children: React.ReactNode;
}

const MainLayout: React.FC<Props> = ({ children }) => (
  <div className="flex min-h-screen">
    <Sidebar />
    <main className="flex-1 p-6">{children}</main>
  </div>
);

export default MainLayout;
