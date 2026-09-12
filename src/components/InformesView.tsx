'use client';

import { useState, useRef } from 'react';
import { Printer, School, ArrowUpRight, ArrowDownRight, FileDown, Loader2 } from 'lucide-react';
import { BankAccount, BudgetPartida, AcademicYear } from '@/lib/types';
import { CategoryWithTotal } from '@/lib/queries';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InformesViewProps {
  accounts: BankAccount[];
  partidas: BudgetPartida[];
  currentYear: AcademicYear;
  incomeWithTotals: CategoryWithTotal[];
  expensesWithTotals: CategoryWithTotal[];
}

export default function InformesView({
  accounts,
  partidas,
  currentYear,
  incomeWithTotals,
  expensesWithTotals
}: InformesViewProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const totalBudget = partidas.reduce((s, p) => s + p.initial_budget, 0);
  const totalIncome = partidas.reduce((s, p) => s + (p.allocated_income || 0), 0);
  const totalSpent = partidas.reduce((s, p) => s + (p.spent_amount || 0), 0);
  const totalRemaining = partidas.reduce((s, p) => s + (p.available_balance || 0), 0);

  const totalIncomeCats = incomeWithTotals.reduce((s, c) => s + c.totalAmount, 0);
  const totalExpenseCats = expensesWithTotals.reduce((s, c) => s + c.totalAmount, 0);

  const handleGeneratePdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      const { generateClearVectorPdf } = await import('@/lib/pdfReport');
      generateClearVectorPdf({
        accounts,
        partidas,
        currentYear,
        incomeWithTotals,
        expensesWithTotals
      });
    } catch (error) {
      console.error('Erro ao xerar o PDF:', error);
      alert('Non se puido xerar o PDF. Por favor, probe de novo ou use a opción de imprimir.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const sanitizedYear = currentYear.name.replace(/\s+/g, '_');
    document.title = `Cadro_Liquidacion_Economica_${sanitizedYear}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar (hidden when printing) */}
      <div className="print:hidden bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Estado de Liquidación e Memoria Económica</h2>
          <p className="text-xs text-slate-500">Documento de xustificación e rendición de contas ante o Consello Escolar</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            title="Xerar e descargar o arquivo PDF do informe oficial"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer hover:shadow-md active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Xerando PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="h-6 w-6" />
                <span>Descargar PDF</span>
              </>
            )}
          </button>
{/*           <button
            onClick={handlePrint}
            title="Abrir vista previa de impresión"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">Imprimir</span>
          </button> */}
        </div>
      </div>

      {/* Printable Sheet */}
      <div 
        ref={reportRef}
        className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs print:border-none print:shadow-none print:p-0 print:rounded-none space-y-8 print:space-y-6"
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 print:pb-4 print-avoid-break">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center print:bg-slate-900">
                <School className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">
                  Cadro de Liquidación Económica Anual
                </h1>
                <p className="text-xs font-semibold text-slate-600">
                  Consellería de Educación, Ciencia, Universidades e Formación Profesional - Xunta de Galicia
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold font-mono uppercase bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                {currentYear.name}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Data: {formatDate(new Date().toISOString().split('T')[0])}</p>
            </div>
          </div>
        </div>

        {/* 1. Cadro das Contas Bancarias e Conciliación */}
        <section className="space-y-3 print-avoid-break">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <span className="h-2 w-2 bg-indigo-600 rounded-full"></span>
            <span>1. Estado de Contas Bancarias e Conciliación</span>
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Conta Bancaria</th>
                  <th className="p-3">Código / IBAN</th>
                  <th className="p-3 text-right">Saldo Inicial</th>
                  <th className="p-3 text-right">Saldo Contable Actual</th>
                  <th className="p-3 text-right">Saldo Reconciliado</th>
                  <th className="p-3 text-center">Estado Conciliación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {accounts.map(acc => (
                  <tr key={acc.id}>
                    <td className="p-3 font-semibold text-slate-900">{acc.name}</td>
                    <td className="p-3 font-mono text-slate-600">{acc.account_number}</td>
                    <td className="p-3 text-right text-slate-700 whitespace-nowrap tabular-nums font-mono">{formatCurrency(acc.initial_balance)}</td>
                    <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap tabular-nums font-mono">{formatCurrency(acc.current_balance || 0)}</td>
                    <td className="p-3 text-right font-semibold text-emerald-700 whitespace-nowrap tabular-nums font-mono">{formatCurrency(acc.reconciled_balance || 0)}</td>
                    <td className="p-3 text-center">
                      {(acc.pending_movements_count || 0) === 0 ? (
                        <span className="text-emerald-700 font-bold">100% Conciliada</span>
                      ) : (
                        <span className="text-amber-700 font-bold">{acc.pending_movements_count} movementos pend.</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="p-3 text-slate-800 uppercase">Totais Consolidados:</td>
                  <td className="p-3 text-right">{formatCurrency(accounts.reduce((s, a) => s + a.initial_balance, 0))}</td>
                  <td className="p-3 text-right text-indigo-700">{formatCurrency(accounts.reduce((s, a) => s + (a.current_balance || 0), 0))}</td>
                  <td className="p-3 text-right text-emerald-700">{formatCurrency(accounts.reduce((s, a) => s + (a.reconciled_balance || 0), 0))}</td>
                  <td className="p-3 text-center text-slate-600">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* 2. Cadro de Liquidación das Partidas Orzamentarias */}
        <section className="space-y-3 print-avoid-break">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <span className="h-2 w-2 bg-indigo-600 rounded-full"></span>
            <span>2. Liquidación do Orzamento por Partidas</span>
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Partida Orzamentaria</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3 text-right">Dotación Inicial</th>
                  <th className="p-3 text-right">Ingresos Imputados</th>
                  <th className="p-3 text-right">Gastos Imputados</th>
                  <th className="p-3 text-right">Remanente / Saldo Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {partidas.map(p => (
                  <tr key={p.id}>
                    <td className="p-3 font-mono text-slate-500 font-semibold">{p.code}</td>
                    <td className="p-3 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3 text-slate-500">
                      {p.is_base === 1 ? 'Partida Básica' : 'Partida Anual'}
                    </td>
                    <td className="p-3 text-right text-slate-700 whitespace-nowrap tabular-nums font-mono">{formatCurrency(p.initial_budget)}</td>
                    <td className="p-3 text-right text-emerald-700 font-medium whitespace-nowrap tabular-nums font-mono">+{formatCurrency(p.allocated_income || 0)}</td>
                    <td className="p-3 text-right text-rose-700 font-medium whitespace-nowrap tabular-nums font-mono">-{formatCurrency(p.spent_amount || 0)}</td>
                    <td className="p-3 text-right font-black text-slate-900 whitespace-nowrap tabular-nums font-mono">{formatCurrency(p.available_balance || 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="p-3 text-slate-800 uppercase">Totais de Liquidación:</td>
                  <td className="p-3 text-right">{formatCurrency(totalBudget)}</td>
                  <td className="p-3 text-right text-emerald-700">+{formatCurrency(totalIncome)}</td>
                  <td className="p-3 text-right text-rose-700">-{formatCurrency(totalSpent)}</td>
                  <td className="p-3 text-right text-indigo-700 font-black">{formatCurrency(totalRemaining)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* 3. Resumo Económico por Categorías Oficiais (Ingresos e Gastos) */}
        <section className="space-y-4 print-avoid-break">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span className="h-2 w-2 bg-indigo-600 rounded-full"></span>
              <span>3. Resumo de Execución por Categorías Oficiais</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Clasificación económica normalizada da Consellería de Educación
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-6 items-start">
            {/* Táboa de Ingresos por Categorías */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-emerald-50 px-3.5 py-2 border-b border-emerald-100 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  Categorías de Ingresos (a - l)
                </span>
                <span className="text-xs font-black text-emerald-700 font-mono">
                  {formatCurrency(totalIncomeCats)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-10 text-center">Cód.</th>
                      <th className="p-2.5">Concepto Oficial</th>
                      <th className="p-2.5 text-right w-32">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {incomeWithTotals.map(cat => {
                      const activeSubs = cat.subcategories?.filter(s => s.totalAmount > 0) || [];
                      const hasAmount = cat.totalAmount > 0;
                      return (
                        <tr key={cat.id} className={hasAmount ? 'bg-emerald-50/20' : 'hover:bg-slate-50/60'}>
                          <td className="p-2.5 font-mono text-center font-bold text-slate-600 align-top">
                            {cat.code}
                          </td>
                          <td className="p-2.5 align-top">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`block ${hasAmount ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                                {cat.name}
                              </span>
                              {cat.code.toLowerCase() === 'h' && (
                                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Remanente inicial de partidas
                                </span>
                              )}
                            </div>
                            {activeSubs.length > 0 && (
                              <div className="mt-1 space-y-1 pl-2 border-l-2 border-emerald-300">
                                {activeSubs.map(sub => (
                                  <div key={sub.id} className="text-[11px] flex items-center justify-between text-slate-600">
                                    <span className="truncate pr-2">{sub.code}.- {sub.name}</span>
                                    <span className="font-semibold text-emerald-800 shrink-0 font-mono">
                                      {formatCurrency(sub.totalAmount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className={`p-2.5 text-right font-mono align-top whitespace-nowrap ${
                            hasAmount ? 'font-bold text-emerald-700' : 'text-slate-400'
                          }`}>
                            {formatCurrency(cat.totalAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={2} className="p-2.5 text-slate-800 uppercase">Total Ingresos:</td>
                      <td className="p-2.5 text-right text-emerald-700 font-black font-mono">
                        {formatCurrency(totalIncomeCats)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Táboa de Gastos por Categorías */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-rose-50 px-3.5 py-2 border-b border-rose-100 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                  <ArrowDownRight className="h-4 w-4 text-rose-600" />
                  Categorías de Gastos (1 - 14)
                </span>
                <span className="text-xs font-black text-rose-700 font-mono">
                  {formatCurrency(totalExpenseCats)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-10 text-center">Cód.</th>
                      <th className="p-2.5">Concepto Oficial</th>
                      <th className="p-2.5 text-right w-32">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expensesWithTotals.map(cat => {
                      const activeSubs = cat.subcategories?.filter(s => s.totalAmount > 0) || [];
                      const hasAmount = cat.totalAmount > 0;
                      return (
                        <tr key={cat.id} className={hasAmount ? 'bg-rose-50/20' : 'hover:bg-slate-50/60'}>
                          <td className="p-2.5 font-mono text-center font-bold text-slate-600 align-top">
                            {cat.code}
                          </td>
                          <td className="p-2.5 align-top">
                            <span className={`block ${hasAmount ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                              {cat.name}
                            </span>
                            {activeSubs.length > 0 && (
                              <div className="mt-1 space-y-1 pl-2 border-l-2 border-rose-300">
                                {activeSubs.map(sub => (
                                  <div key={sub.id} className="text-[11px] flex items-center justify-between text-slate-600">
                                    <span className="truncate pr-2">{sub.code}.- {sub.name}</span>
                                    <span className="font-semibold text-rose-800 shrink-0 font-mono">
                                      {formatCurrency(sub.totalAmount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className={`p-2.5 text-right font-mono align-top whitespace-nowrap ${
                            hasAmount ? 'font-bold text-rose-700' : 'text-slate-400'
                          }`}>
                            {formatCurrency(cat.totalAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={2} className="p-2.5 text-slate-800 uppercase">Total Gastos:</td>
                      <td className="p-2.5 text-right text-rose-700 font-black font-mono">
                        {formatCurrency(totalExpenseCats)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Signatures Footer for School Council */}
        <div className="pt-12 print:pt-8 grid grid-cols-2 gap-8 text-center text-xs border-t border-slate-200 print:border-slate-300 print-avoid-break">
          <div>
            <p className="font-bold text-slate-800">O/A Secretario/a do Centro</p>
            <div className="h-16 mt-2 border-b border-dashed border-slate-300"></div>
            <p className="text-slate-400 mt-2">Asdo: Dirección / Secretaría</p>
          </div>
          <div>
            <p className="font-bold text-slate-800">Visto e Prace: A Dirección</p>
            <div className="h-16 mt-2 border-b border-dashed border-slate-300"></div>
            <p className="text-slate-400 mt-2">Diligencia de aprobación no Consello Escolar</p>
          </div>
        </div>
      </div>
    </div>
  );
}

