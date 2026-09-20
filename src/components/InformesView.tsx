'use client';

import { Fragment, useState, useRef } from 'react';
import { Printer, School, ArrowUpRight, ArrowDownRight, FileDown, Loader2, Utensils } from 'lucide-react';
import { BankAccount, BudgetPartida, AcademicYear } from '@/lib/types';
import { CategoryWithTotal, ComedorPeriod, ComedorExecutionReport } from '@/lib/queries';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InformesViewProps {
  accounts: BankAccount[];
  partidas: BudgetPartida[];
  currentYear: AcademicYear;
  incomeWithTotals: CategoryWithTotal[];
  expensesWithTotals: CategoryWithTotal[];
  comedorReport?: ComedorExecutionReport;
}

export default function InformesView({
  accounts,
  partidas,
  currentYear,
  incomeWithTotals,
  expensesWithTotals,
  comedorReport
}: InformesViewProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ComedorPeriod>('anual');

  const totalBudget = partidas.reduce((s, p) => s + p.initial_budget, 0);
  const totalIncome = partidas.reduce((s, p) => s + (p.allocated_income || 0), 0);
  const totalSpent = partidas.reduce((s, p) => s + (p.spent_amount || 0), 0);
  const totalRemaining = partidas.reduce((s, p) => s + (p.available_balance || 0), 0);

  const totalIncomeCats = incomeWithTotals.reduce((s, c) => s + c.totalAmount, 0);
  const totalExpenseCats = expensesWithTotals.reduce((s, c) => s + c.totalAmount, 0);

  // Partida básica de Comedor (para obter a dotación inicial deste ano)
  const comPartida = partidas.find(p => p.is_base === 1 && (p.code === 'PART-COM' || p.name.toLowerCase() === 'comedor'));
  const dotacionInicialComedor = comPartida?.initial_budget || 0;

  // Datos do informe de comedor para o período seleccionado
  const activeComedorReport = comedorReport ? comedorReport[selectedPeriod] : null;

  // Categorías específicas de Comedor Escolar para o Punto 4 (fallback se non houbese comedorReport)
  const parentA = incomeWithTotals.find(c => c.code.toLowerCase() === 'a');
  const catA6Raw = parentA?.subcategories?.find(s => s.code.toLowerCase() === 'a.6');
  const cat14Raw = expensesWithTotals.find(c => c.code === '14');

  const fallbackA6Subcategories = (catA6Raw?.subcategories || []).map(sub => {
    if (sub.code === 'a.6.1') {
      return {
        ...sub,
        totalAmount: sub.totalAmount + dotacionInicialComedor
      };
    }
    return sub;
  });

  const a6Subcategories = activeComedorReport ? activeComedorReport.a6Subcategories : fallbackA6Subcategories;
  const cat14 = activeComedorReport ? activeComedorReport.cat14 : cat14Raw;
  const totalComedorIncome = activeComedorReport ? activeComedorReport.totalIncome : a6Subcategories.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalComedorExpense = activeComedorReport ? activeComedorReport.totalExpense : (cat14?.totalAmount || 0);
  const saldoNetoComedor = activeComedorReport ? activeComedorReport.saldoNeto : (totalComedorIncome - totalComedorExpense);
  const a61Badge = activeComedorReport ? activeComedorReport.a61BadgeLabel : 'Dotación inicial partida básica';

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
        expensesWithTotals,
        selectedComedorPeriod: activeComedorReport || undefined
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
                      // Non desglosar a categoría 14 no Punto 3
                      const activeSubs = cat.code === '14'
                        ? []
                        : (cat.subcategories?.filter(s => s.totalAmount > 0) || []);
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

        {/* 4. Desglose de Execución de Comedor Escolar (Ingresos a.6 e Gastos 14) */}
        <section className="space-y-4 print-avoid-break">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="h-2 w-2 bg-amber-500 rounded-full"></span>
                <span>4. Desglose de Execución de Comedor Escolar</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Detalle orzamentario exclusivo das categorías oficiais de Comedor Escolar (Ingresos e Gastos)
              </p>
              {/* Etiqueta visible só en impresión */}
              <div className="hidden print:block mt-1">
                <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                  Período: {activeComedorReport?.label || 'Anual'} ({activeComedorReport?.dateRangeLabel || ''})
                </span>
              </div>
            </div>

            {/* Selector de Período (interactivo en pantalla, oculto en impresión) */}
            <div className="flex items-center gap-2 print:hidden self-start md:self-auto bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-3 shadow-2xs">
              <label htmlFor="comedor-period-select" className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Período:
              </label>
              <select
                id="comedor-period-select"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as ComedorPeriod)}
                className="text-xs font-semibold bg-white text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
              >
                <option value="anual">Anual (01/01 a 31/12)</option>
                <option value="t1">1º Trimestre (01/01 a 31/03)</option>
                <option value="t2">2º Trimestre (01/04 a 30/06)</option>
                <option value="t3">3º Trimestre (01/07 a 31/08)</option>
                <option value="t4">4º Trimestre (01/09 a 31/12)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-6 items-start">
            {/* Táboa de Ingresos Comedor Escolar (a.6) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-amber-50/80 px-3.5 py-2.5 border-b border-amber-200 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Utensils className="h-4 w-4 text-amber-600" />
                  Ingresos Comedor Escolar (Categoría a.6)
                </span>
                <span className="text-xs font-black text-amber-800 font-mono">
                  {formatCurrency(totalComedorIncome)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-16 text-center">Cód.</th>
                      <th className="p-2.5">Subconcepto de Ingreso</th>
                      <th className="p-2.5 text-right w-32">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {a6Subcategories && a6Subcategories.length > 0 ? (
                      a6Subcategories.map(sub => {
                        const hasAmount = sub.totalAmount > 0;
                        return (
                          <tr key={sub.id} className={hasAmount ? 'bg-amber-50/30 font-medium' : 'hover:bg-slate-50/60'}>
                            <td className="p-2.5 font-mono text-center font-bold text-slate-600">
                              {sub.code}
                            </td>
                            <td className="p-2.5 text-slate-800">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{sub.name}</span>
                                {sub.code === 'a.6.1' && (
                                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200" title={a61Badge}>
                                    {a61Badge}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={`p-2.5 text-right font-mono whitespace-nowrap ${
                              hasAmount ? 'font-bold text-emerald-700' : 'text-slate-400'
                            }`}>
                              {formatCurrency(sub.totalAmount)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400">
                          Non hai subcategorías rexistradas en a.6
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-amber-50/50 font-bold border-t border-amber-200">
                    <tr>
                      <td colSpan={2} className="p-2.5 text-amber-950 uppercase text-right pr-4">Total Global Ingresos Comedor:</td>
                      <td className="p-2.5 text-right text-emerald-700 font-black font-mono">
                        {formatCurrency(totalComedorIncome)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Táboa de Gastos Comedor Escolar (14) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-rose-50/80 px-3.5 py-2.5 border-b border-rose-200 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Utensils className="h-4 w-4 text-rose-600" />
                  Gastos Comedor Escolar (Categoría 14)
                </span>
                <span className="text-xs font-black text-rose-800 font-mono">
                  {formatCurrency(cat14?.totalAmount || 0)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-16 text-center">Cód.</th>
                      <th className="p-2.5">Subconcepto de Gasto</th>
                      <th className="p-2.5 text-right w-32">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cat14?.subcategories && cat14.subcategories.length > 0 ? (
                      cat14.subcategories.map(sub => {
                        const isGroup = sub.is_group === 1;
                        const hasSubSubs = sub.subcategories && sub.subcategories.length > 0;
                        const hasAmount = sub.totalAmount > 0;

                        if (isGroup && hasSubSubs) {
                          return (
                            <Fragment key={sub.id}>
                              <tr className="bg-slate-100/80 font-semibold text-slate-900 border-t border-slate-200">
                                <td className="p-2.5 font-mono text-center font-bold text-slate-700">
                                  {sub.code}
                                </td>
                                <td className="p-2.5 uppercase text-[11px] tracking-wider text-slate-800 font-bold">
                                  {sub.name}
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                                  {formatCurrency(sub.totalAmount)}
                                </td>
                              </tr>
                              {sub.subcategories!.map(subsub => {
                                const subHasAmount = subsub.totalAmount > 0;
                                return (
                                  <tr key={subsub.id} className={subHasAmount ? 'bg-rose-50/25' : 'hover:bg-slate-50/60'}>
                                    <td className="p-2 pl-4 font-mono text-center text-slate-500 text-[11px]">
                                      {subsub.code}
                                    </td>
                                    <td className="p-2 pl-6 text-slate-700">
                                      <span className="text-slate-400 mr-1.5">↳</span>
                                      {subsub.name}
                                    </td>
                                    <td className={`p-2 text-right font-mono whitespace-nowrap ${
                                      subHasAmount ? 'font-bold text-rose-700' : 'text-slate-400'
                                    }`}>
                                      {formatCurrency(subsub.totalAmount)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </Fragment>
                          );
                        }

                        return (
                          <tr key={sub.id} className={hasAmount ? 'bg-rose-50/25 font-medium' : 'hover:bg-slate-50/60'}>
                            <td className="p-2.5 font-mono text-center font-bold text-slate-600">
                              {sub.code}
                            </td>
                            <td className="p-2.5 text-slate-800">
                              {sub.name}
                            </td>
                            <td className={`p-2.5 text-right font-mono whitespace-nowrap ${
                              hasAmount ? 'font-bold text-rose-700' : 'text-slate-400'
                            }`}>
                              {formatCurrency(sub.totalAmount)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400">
                          Non hai subcategorías rexistradas en 14
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-rose-50/50 font-bold border-t border-rose-200">
                    <tr>
                      <td colSpan={2} className="p-2.5 text-rose-950 uppercase text-right pr-4">Total Global Gastos Comedor:</td>
                      <td className="p-2.5 text-right text-rose-700 font-black font-mono">
                        {formatCurrency(cat14?.totalAmount || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Tarxeta de Resumo de Balance Neto de Comedor Escolar */}
          <div className="bg-gradient-to-r from-amber-50 via-slate-50 to-rose-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                <Utensils className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Balance Económico Comedor Escolar (a.6 - 14)</h4>
                <p className="text-[11px] text-slate-500">Superávit ou déficit derivado da execución orzamentaria propia do servizo de comedor ({activeComedorReport?.label || 'Anual'})</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Ingresos</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">{formatCurrency(totalComedorIncome)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Gastos</span>
                <span className="font-mono font-bold text-rose-700 text-sm">{formatCurrency(totalComedorExpense)}</span>
              </div>
              <div className="text-right pl-4 border-l border-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Remanente que se incorpora ao seguinte período</span>
                
                <span className={`font-mono font-black text-sm ${
                  saldoNetoComedor >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {formatCurrency(saldoNetoComedor)}
                </span>
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

