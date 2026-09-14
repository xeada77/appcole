import Link from 'next/link';
import { 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  PieChart, 
  ArrowRight,
  ShieldCheck,
  Building,
  Utensils,
  Wallet,
  Clock
} from 'lucide-react';
import Header from '@/components/Header';
import RecentMovementsTable from '@/components/RecentMovementsTable';
import { 
  getBankAccounts, 
  getBudgetPartidas, 
  getIncomeCategories, 
  getExpenseCategories, 
  getCurrentAcademicYear, 
  getAcademicYears,
  getDashboardStats 
} from '@/lib/queries';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const currentYear = getCurrentAcademicYear();
  const years = getAcademicYears();
  const accounts = getBankAccounts();
  const partidas = getBudgetPartidas(currentYear.id);
  const incomeCats = getIncomeCategories();
  const expenseCats = getExpenseCategories();
  const stats = getDashboardStats(currentYear.id);

  const funcAcc = accounts.find(a => a.id === 'funcionamento');
  const comAcc = accounts.find(a => a.id === 'comedor');

  return (
    <div className="flex-1 flex flex-col">
      <Header
        accounts={accounts}
        partidas={partidas}
        incomeCategories={incomeCats}
        expenseCategories={expenseCats}
        currentYear={currentYear}
        years={years}
        title="Panel Económico do Centro"
        subtitle={`Resumo xeral do exercicio económico escolar ${currentYear.name}`}
      />

      <main className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Global Balance */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Total Bancario</span>
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(stats.totalBalance)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
              <span>Suma de ambas contas</span>
              <span className="font-semibold text-indigo-600">2 contas activas</span>
            </div>
          </div>

          {/* Conta de Funcionamento */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conta Funcionamento</span>
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(stats.funcionamentoBalance)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
              <span>Conciliado: <strong className="text-slate-700">{formatCurrency(funcAcc?.reconciled_balance || 0)}</strong></span>
              {funcAcc?.pending_movements_count === 0 ? (
                <span className="text-emerald-600 font-medium flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> Ok</span>
              ) : (
                <span className="text-amber-600 font-medium flex items-center gap-0.5"><AlertCircle className="h-3 w-3" /> {funcAcc?.pending_movements_count} pend.</span>
              )}
            </div>
          </div>

          {/* Conta de Comedor */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conta de Comedor</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Utensils className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(stats.comedorBalance)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
              <span>Conciliado: <strong className="text-slate-700">{formatCurrency(comAcc?.reconciled_balance || 0)}</strong></span>
              {comAcc?.pending_movements_count === 0 ? (
                <span className="text-emerald-600 font-medium flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> Ok</span>
              ) : (
                <span className="text-amber-600 font-medium flex items-center gap-0.5"><AlertCircle className="h-3 w-3" /> {comAcc?.pending_movements_count} pend.</span>
              )}
            </div>
          </div>

          {/* Conciliación Status */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conciliación Bancaria</span>
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${stats.pendingReconciliationCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {stats.pendingReconciliationCount > 0 ? <Clock className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.pendingReconciliationCount}
              </span>
              <span className="text-xs text-slate-500 ml-1.5">movementos pendentes</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs border-t border-slate-100 pt-2">
              <Link href="/bancos" className="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1 transition-colors">
                Ir á conciliación <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Section: Partidas Orzamentarias Snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-600" />
                <span>Execución das Partidas Orzamentarias ({currentYear.name})</span>
              </h2>
              <p className="text-xs text-slate-500">Estado de dotación, gastos e dispoñibilidade orzamentaria</p>
            </div>
            <Link
              href="/partidas"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors self-start sm:self-auto"
            >
              Xestionar todas as partidas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.partidasOverview.map((partida) => {
              const totalFunds = partida.initial_budget + (partida.allocated_income || 0);
              const spent = partida.spent_amount || 0;
              const remaining = partida.available_balance || 0;
              const percentSpent = totalFunds > 0 ? Math.min(100, Math.round((spent / totalFunds) * 100)) : 0;

              let badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
              let progressColor = 'bg-indigo-600';
              if (percentSpent > 85) {
                badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                progressColor = 'bg-rose-500';
              } else if (percentSpent > 65) {
                badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                progressColor = 'bg-amber-500';
              }

              return (
                <div 
                  key={partida.id}
                  className="rounded-xl border border-slate-200/70 p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-800">{partida.name}</span>
                        {partida.is_base === 1 && (
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                            Básica
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">{partida.code}</span>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {percentSpent}% executado
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-3 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${percentSpent}%` }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-3 text-[11px] border-t border-slate-200/70 pt-2">
                    <div>
                      <span className="text-slate-400 block">Dotación</span>
                      <strong className="text-slate-700">{formatCurrency(totalFunds)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Gastado</span>
                      <strong className="text-rose-600">{formatCurrency(spent)}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Dispoñible</span>
                      <strong className={remaining < 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                        {formatCurrency(remaining)}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Recent Movements Table with Edit capability */}
        <RecentMovementsTable
          movements={stats.recentMovements}
          accounts={accounts}
          partidas={partidas}
          incomeCategories={incomeCats}
          expenseCategories={expenseCats}
          years={years}
        />
      </main>
    </div>
  );
}
