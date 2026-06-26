import { Metadata } from 'next';
import { ReactNode } from 'react';
import AdminLayoutClient from './AdminLayoutClient';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  title: 'Admin Panel',
};

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
