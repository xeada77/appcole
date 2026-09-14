'use client';


import NewMovementModal from './NewMovementModal';
import YearSelector from './YearSelector';
import BackupModal from './BackupModal';
import { BankAccount, BudgetPartida, Category, AcademicYear } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface HeaderProps {
  accounts: BankAccount[];
  partidas: BudgetPartida[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  currentYear: AcademicYear;
  years: AcademicYear[];
  title?: string;
  subtitle?: string;
}

export default function Header({
  accounts,
  partidas,
  incomeCategories,
  expenseCategories,
  currentYear,
  years,
  title = 'Xestión Económica Escolar',
  subtitle = 'Centro Público de Ensino Infantil e Primaria'
}: HeaderProps) {
  const totalBalance = accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-8 py-4 print:hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title and context */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>

          </div>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>

        {/* Right side actions */}
        <div className="flex items-center flex-wrap gap-3">
          <YearSelector currentYear={currentYear} years={years} variant="header" />
          {/* Quick Balance indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">

            <span className="text-xs text-slate-500 font-medium">Saldo Global:</span>
            <span className="text-sm font-bold text-indigo-700">
              {formatCurrency(totalBalance)}
            </span>
          </div>

          {/* Backup Modal Trigger */}
          {/*<BackupModal variant="header" />*/}

          {/* Novo Movemento Trigger */}
          <NewMovementModal
            accounts={accounts}
            partidas={partidas}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            currentYearId={currentYear.id}
            years={years}
          />
        </div>
      </div>
    </header>
  );
}

