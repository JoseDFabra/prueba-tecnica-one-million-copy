import { Metadata } from 'next';
import Layout from '../../layout/layout';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: 'OMC Leads',
  description: 'Gestión de leads para One Million Copy',
  icons: { icon: '/favicon.ico' },
};

export default function AppLayout({ children }: AppLayoutProps) {
  return <Layout>{children}</Layout>;
}
