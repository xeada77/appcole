import Header from '@/components/Header';
import {
  getBankAccounts,
  getBudgetPartidas,
  getIncomeCategories,
  getExpenseCategories,
  getCurrentAcademicYear,
  getAcademicYears,
  getCategoriesWithTotals
} from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, BookOpen, Layers, ShieldCheck } from 'lucide-react';

export default async function CategoriasPage() {
  const currentYear = getCurrentAcademicYear();
  const years = getAcademicYears();
  const accounts = getBankAccounts();
  const partidas = getBudgetPartidas(currentYear.id);
  const incomeCats = getIncomeCategories();
  const expenseCats = getExpenseCategories();
  const { incomeWithTotals, expensesWithTotals } = getCategoriesWithTotals(currentYear.id);

  const totalIncome = incomeWithTotals.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalExpense = expensesWithTotals.reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        accounts={accounts}
        partidas={partidas}
        incomeCategories={incomeCats}
        expenseCategories={expenseCats}
        currentYear={currentYear}
        years={years}
        title="Categorías Oficiais da Consellería"
        subtitle="Estrutura normalizada de Ingresos (a - l) e Gastos (1 - 14) da Xunta de Galicia"
      />

      <main className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
        {/* Banner Informativo */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Catálogo de Conceptos Orzamentarios Oficiais</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Estas categorías e subcategorías corresponden á clasificación económica oficial establecida pola Consellería de Educación para a xestión económica e xustificación dos centros docentes públicos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentYear.name}
            </span>
          </div>
        </div>

        {/* Dual Column Layout: Ingresos vs Gastos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ingresos Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-950">Categorías de Ingresos (a - l)</h3>
                  <span className="text-xs text-emerald-700">Achegas, dotacións e outros ingresos</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-emerald-800 block">Total Acumulado</span>
                <span className="text-base font-bold text-emerald-800">{formatCurrency(totalIncome)}</span>
              </div>
            </div>

            <div className="space-y-3">
              {incomeWithTotals.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-800 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {cat.code}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">{cat.name}</h4>
                        {cat.code.toLowerCase() === 'h' && (
                          <span className="inline-block mt-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Dotación inicial de Funcionamento e Comedor (sen movemento en conta)
                          </span>
                        )}
                        {cat.subcategories && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {cat.subcategories.length} subcategorías
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-700 whitespace-nowrap">
                      {formatCurrency(cat.totalAmount)}
                    </span>
                  </div>

                  {/* Subcategories (e.g. Dotacións procedentes da Consellería) */}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 pl-4 space-y-2">
                      {cat.subcategories.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-slate-50">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-500">{sub.code}</span>
                            <span className="text-slate-700">{sub.name}</span>
                          </div>
                          <span className={`font-semibold ${sub.totalAmount > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {formatCurrency(sub.totalAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Gastos Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-rose-50/80 border border-rose-200/80 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                  <ArrowDownRight className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-950">Categorías de Gastos (1 - 14)</h3>
                  <span className="text-xs text-rose-700">Subministracións, servizos e compras</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-rose-800 block">Total Acumulado</span>
                <span className="text-base font-bold text-rose-800">{formatCurrency(totalExpense)}</span>
              </div>
            </div>

            <div className="space-y-3">
              {expensesWithTotals.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="h-6 w-6 rounded-md bg-rose-100 text-rose-800 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {cat.code}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">{cat.name}</h4>
                        {cat.subcategories && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {cat.subcategories.length} subcategorías
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-rose-700 whitespace-nowrap">
                      {formatCurrency(cat.totalAmount)}
                    </span>
                  </div>

                  {/* Subcategories (e.g. Subministracións: Gasóleo, Gas, Biomasa, Electricidade, Auga, Outras) */}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 pl-4 space-y-2">
                      {cat.subcategories.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-slate-50">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-500">{sub.code}</span>
                            <span className="text-slate-700">{sub.name}</span>
                          </div>
                          <span className={`font-semibold ${sub.totalAmount > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                            {formatCurrency(sub.totalAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

