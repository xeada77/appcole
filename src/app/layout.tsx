import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import AppShell from '@/components/AppShell';
import { getBankAccounts, getCurrentAcademicYear, getAcademicYears } from '@/lib/queries';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'XecoCole - Xestión Económica Escolar',
  description: 'Aplicación de xestión económica, orzamentos e conciliación bancaria para centros escolares.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentYear = getCurrentAcademicYear();
  const years = getAcademicYears();
  const accounts = getBankAccounts();

  return (
    <html lang="gl" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full bg-slate-100 text-slate-900 flex antialiased print:h-auto print:bg-white print:block">
        <AppShell sidebar={<Sidebar accounts={accounts} currentYear={currentYear} years={years} />}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
