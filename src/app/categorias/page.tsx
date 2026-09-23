import Header from '@/components/Header';
import {
  getBankAccounts,
  getBudgetPartidas,
  getIncomeCategories,
  getExpenseCategories,
  getCurrentAcademicYear,
  getAcademicYears,
  getCategoriesWithTotals,
  getCrossYearCategoryMovements,
  getSuppliers
} from '@/lib/queries';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  ArrowRightLeft, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CategoriasPage() {
  const currentYear = getCurrentAcademicYear();
  const years = getAcademicYears();
  const accounts = getBankAccounts();
  const partidas = getBudgetPartidas(currentYear.id);
  const incomeCats = getIncomeCategories();
  const expenseCats = getExpenseCategories();
  const suppliers = getSuppliers(currentYear.id);
  const { incomeWithTotals, expensesWithTotals } = getCategoriesWithTotals(currentYear.id);
  const { attributedToOtherYears, attributedFromOtherYears } = getCrossYearCategoryMovements(currentYear.id);

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
        suppliers={suppliers}
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
                        <div key={sub.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-slate-50">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-slate-500">{sub.code}</span>
                              <span className={sub.subcategories ? "font-semibold text-slate-800" : "text-slate-700"}>{sub.name}</span>
                            </div>
                            <span className={`font-semibold ${sub.totalAmount > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                              {formatCurrency(sub.totalAmount)}
                            </span>
                          </div>
                          {sub.subcategories && sub.subcategories.length > 0 && (
                            <div className="pl-6 space-y-1 border-l border-emerald-200 ml-3">
                              {sub.subcategories.map((subsub) => (
                                <div key={subsub.id} className="flex items-center justify-between text-[11px] py-0.5 px-2 rounded hover:bg-slate-50">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-400">{subsub.code}</span>
                                    <span className="text-slate-600">{subsub.name}</span>
                                  </div>
                                  <span className={`font-medium ${subsub.totalAmount > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                                    {formatCurrency(subsub.totalAmount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
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

                  {/* Subcategories (e.g. Subministracións, Comedores escolares) */}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 pl-4 space-y-2">
                      {cat.subcategories.map((sub) => (
                        <div key={sub.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-slate-50">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-slate-500">{sub.code}</span>
                              <span className={sub.subcategories ? "font-semibold text-slate-800" : "text-slate-700"}>{sub.name}</span>
                            </div>
                            <span className={`font-semibold ${sub.totalAmount > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                              {formatCurrency(sub.totalAmount)}
                            </span>
                          </div>
                          {sub.subcategories && sub.subcategories.length > 0 && (
                            <div className="pl-6 space-y-1 border-l border-rose-200 ml-3">
                              {sub.subcategories.map((subsub) => (
                                <div key={subsub.id} className="flex items-center justify-between text-[11px] py-0.5 px-2 rounded hover:bg-slate-50">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-400">{subsub.code}</span>
                                    <span className="text-slate-600">{subsub.name}</span>
                                  </div>
                                  <span className={`font-medium ${subsub.totalAmount > 0 ? 'text-rose-700 font-semibold' : 'text-slate-400'}`}>
                                    {formatCurrency(subsub.totalAmount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sección Informativa: Imputacións de Ingresos e Gastos entre Exercicios */}
        {(attributedToOtherYears.length > 0 || attributedFromOtherYears.length > 0) && (
          <section className="space-y-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-500/20">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Trazabilidade de Movementos Catalogados noutros Exercicios
                  </h3>
                  <p className="text-xs text-slate-500">
                    Control e xustificación de ingresos e gastos cuxo efecto orzamentario corresponde a unha partida doutro ano
                  </p>
                </div>
              </div>
            </div>

            {/* Caso 1: Movementos executados neste ano pero catalogados noutro ano polo destino da súa partida */}
            {attributedToOtherYears.length > 0 && (
              <div className="bg-amber-50/40 rounded-2xl p-6 border border-amber-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/70 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
                    <h4 className="text-sm font-bold text-amber-950">
                      Movementos deste ano contable ({currentYear.name}) catalogados no exercicio ao que correspondía a súa partida
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300/80 self-start sm:self-auto">
                    Excluídos dos totais superiores
                  </span>
                </div>

                <p className="text-xs text-amber-900/90">
                  Os seguintes ingresos ou gastos foron rexistrados bancariamente durante o exercicio <strong>{currentYear.name}</strong>, pero ao ter sido atribuídos a unha partida orzamentaria doutro ano, <strong>foron catalogados nas categorías oficiais dese exercicio de destino</strong> e non incrementan os totais reflectidos nesta pantalla:
                </p>

                <div className="overflow-x-auto bg-white rounded-xl border border-amber-200 shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-amber-50/70 text-amber-900 font-semibold uppercase tracking-wider border-b border-amber-200">
                      <tr>
                        <th className="px-4 py-2.5">Data</th>
                        <th className="px-4 py-2.5">Conta</th>
                        <th className="px-4 py-2.5">Tipo</th>
                        <th className="px-4 py-2.5">Concepto</th>
                        <th className="px-4 py-2.5">Categoría Oficial</th>
                        <th className="px-4 py-2.5">Partida e Ano de Destino</th>
                        <th className="px-4 py-2.5 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100/60">
                      {attributedToOtherYears.map((m) => (
                        <tr key={m.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="px-4 py-2.5 whitespace-nowrap text-slate-600 font-medium">
                            {formatDate(m.date)}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.bank_account_id === 'comedor' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {m.bank_account_id === 'comedor' ? 'COMEDOR' : 'FUNCIONAMENTO'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 font-semibold ${
                              m.type === 'INGRESO' ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {m.type === 'INGRESO' ? (
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowDownRight className="h-3.5 w-3.5" />
                              )}
                              {m.type}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-900">
                            {m.concept}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {m.category_code ? (
                              <span className="font-mono font-semibold text-slate-700">
                                {m.category_code}.- {m.category_name}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Sen categoría</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-indigo-900">
                                {m.partida_name}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                Catalogado en {m.partida_year_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold whitespace-nowrap">
                            <span className={m.type === 'INGRESO' ? 'text-emerald-700' : 'text-rose-700'}>
                              {formatCurrency(m.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Caso 2: Movementos doutros exercicios incorporados e catalogados neste ano */}
            {attributedFromOtherYears.length > 0 && (
              <div className="bg-emerald-50/40 rounded-2xl p-6 border border-emerald-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/70 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                    <h4 className="text-sm font-bold text-emerald-950">
                      Movementos doutros exercicios incorporados e catalogados en {currentYear.name}
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/80 self-start sm:self-auto">
                    Computados nos totais superiores
                  </span>
                </div>

                <p className="text-xs text-emerald-900/90">
                  Os seguintes movementos foron executados na conta bancaria noutro ano contable, pero ao estar atribuídos a unha partida orzamentaria pertencente a <strong>{currentYear.name}</strong>, <strong>foron catalogados e computados neste exercicio</strong> e están sumados nas categorías oficiais mostradas arriba:
                </p>

                <div className="overflow-x-auto bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-emerald-50/70 text-emerald-900 font-semibold uppercase tracking-wider border-b border-emerald-200">
                      <tr>
                        <th className="px-4 py-2.5">Data Execución</th>
                        <th className="px-4 py-2.5">Exercicio Bancario</th>
                        <th className="px-4 py-2.5">Conta</th>
                        <th className="px-4 py-2.5">Tipo</th>
                        <th className="px-4 py-2.5">Concepto</th>
                        <th className="px-4 py-2.5">Partida deste Ano</th>
                        <th className="px-4 py-2.5">Categoría Oficial</th>
                        <th className="px-4 py-2.5 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100/60">
                      {attributedFromOtherYears.map((m) => (
                        <tr key={m.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="px-4 py-2.5 whitespace-nowrap text-slate-600 font-medium">
                            {formatDate(m.date)}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                              {m.movement_year_name}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.bank_account_id === 'comedor' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {m.bank_account_id === 'comedor' ? 'COMEDOR' : 'FUNCIONAMENTO'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 font-semibold ${
                              m.type === 'INGRESO' ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {m.type === 'INGRESO' ? (
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowDownRight className="h-3.5 w-3.5" />
                              )}
                              {m.type}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-900">
                            {m.concept}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-indigo-900">
                            {m.partida_name}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {m.category_code ? (
                              <span className="font-mono font-semibold text-slate-700">
                                {m.category_code}.- {m.category_name}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Sen categoría</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold whitespace-nowrap">
                            <span className={m.type === 'INGRESO' ? 'text-emerald-700' : 'text-rose-700'}>
                              {formatCurrency(m.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

