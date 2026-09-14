'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Landmark,
  PieChart,
  Tags,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  LogOut,
  User
} from 'lucide-react';
import { BankAccount, AcademicYear } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { logoutAction } from '@/lib/auth';
import YearSelector from './YearSelector';
import BackupModal from './BackupModal';

interface SidebarProps {
  accounts: BankAccount[];
  currentYear: AcademicYear;
  years: AcademicYear[];
}

export default function Sidebar({ accounts, currentYear, years }: SidebarProps) {
  const pathname = usePathname();

  const funcAcc = accounts.find(a => a.id === 'funcionamento');
  const comAcc = accounts.find(a => a.id === 'comedor');
  const totalPending = accounts.reduce((sum, a) => sum + (a.pending_movements_count || 0), 0);

  const navItems = [
    {
      name: 'Panel Principal',
      href: '/',
      icon: LayoutDashboard,
      badge: null
    },
    {
      name: 'Contas & Conciliación',
      href: '/bancos',
      icon: Landmark,
      badge: totalPending > 0 ? `${totalPending} pend.` : null,
      badgeVariant: 'warning'
    },
    {
      name: 'Partidas Orzamentarias',
      href: '/partidas',
      icon: PieChart,
      badge: null
    },
    {
      name: 'Categorías Oficiais',
      href: '/categorias',
      icon: Tags,
      badge: null
    },
    {
      name: 'Informes & Consello',
      href: '/informes',
      icon: FileSpreadsheet,
      badge: null
    }
  ];

  return (
    <aside className="w-72 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0 border-r border-slate-800 select-none z-40 print:hidden">
      {/* Brand Header & Year Selector at TOP */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 border border-slate-700/50 overflow-hidden">
            <Image
              src="/logoxestion.png"
              alt="Logo AppCole"
              width={72}
              height={72}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-lg">XecoCole</span>
              {/* <span className="text-[10px] font-semibold uppercase bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">v16</span> */}
            </div>
            <p className="text-[11px] text-slate-400">Xestión Económica Escolar</p>
          </div>
        </div>

        {/* Year Selector prominent at the top of the sidebar! */}
        <div className="mt-3.5">
          <YearSelector currentYear={currentYear} years={years} variant="sidebar" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Módulos Principais
        </div> */}
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Quick Accounts Snapshot */}
        <div className="pt-6 px-3">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Estado das Contas Bancarias
          </div>

          <div className="space-y-2.5">
            {/* Funcionamento */}
            <Link
              href="/bancos?conta=funcionamento"
              className="block p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-colors group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-medium text-slate-300 group-hover:text-indigo-300 transition-colors">Funcionamento</span>
                <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">FUNC</span>
              </div>
              <div className="text-base font-bold text-white tracking-tight">
                {formatCurrency(funcAcc?.current_balance || 0)}
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  {funcAcc?.pending_movements_count === 0 ? (
                    <span className="text-emerald-400 flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> Conciliada</span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-0.5"><AlertCircle className="h-3 w-3" /> {funcAcc?.pending_movements_count} pendentes</span>
                  )}
                </span>
              </div>
            </Link>

            {/* Comedor */}
            <Link
              href="/bancos?conta=comedor"
              className="block p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-colors group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-medium text-slate-300 group-hover:text-emerald-300 transition-colors">Comedor</span>
                <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">COM</span>
              </div>
              <div className="text-base font-bold text-white tracking-tight">
                {formatCurrency(comAcc?.current_balance || 0)}
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  {comAcc?.pending_movements_count === 0 ? (
                    <span className="text-emerald-400 flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> Conciliada</span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-0.5"><AlertCircle className="h-3 w-3" /> {comAcc?.pending_movements_count} pendentes</span>
                  )}
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Sección de Seguridade e Copias */}
        <div className="pt-4 px-3">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Seguridade
          </div>
          <BackupModal variant="sidebar" />
        </div>
      </div>

      {/* User & Logout Section */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">Luis Martínez</p>
            <p className="text-[10px] text-slate-400 truncate">luismartq@gmail.com</p>
          </div>
        </div>
        <form action={logoutAction} className="shrink-0">
          <button
            type="submit"
            title="Pechar sesión"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 border-t border-slate-800/40 bg-slate-950 text-center">
        <p className="text-[9px] text-slate-500">XecoCole.cliic.eu</p>
      </div>
    </aside>
  );
}
