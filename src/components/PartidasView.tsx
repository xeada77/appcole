'use client';

import { useState } from 'react';
import {
  PieChart,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { BudgetPartida, Movement } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import NewPartidaModal from './NewPartidaModal';
import DeletePartidaButton from './DeletePartidaButton';

interface PartidasViewProps {
  partidas: BudgetPartida[];
  movements: Movement[];
  currentYearId: string;
}

export default function PartidasView({ partidas, movements, currentYearId }: PartidasViewProps) {
  const [expandedPartidaId, setExpandedPartidaId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedPartidaId(prev => prev === id ? null : id);
  };

  // Summary figures
  const totalBudgeted = partidas.reduce((s, p) => s + p.initial_budget, 0);
  const totalAllocatedIncome = partidas.reduce((s, p) => s + (p.allocated_income || 0), 0);
  const totalSpent = partidas.reduce((s, p) => s + (p.spent_amount || 0), 0);
  const totalAvailable = partidas.reduce((s, p) => s + (p.available_balance || 0), 0);

  const funcPartida = partidas.find(
    p => p.is_base === 1 && (p.code === 'PART-FUNC' || p.name.toLowerCase() === 'funcionamento' || p.name.toLowerCase() === 'funcionamiento')
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Xestión de Partidas Orzamentarias</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            As partidas básicas son <strong>Funcionamento</strong> e <strong>Comedor</strong>. Pode crear partidas orzamentarias específicas para cada exercicio escolar e imputarlles os ingresos e gastos correspondentes.
          </p>
        </div>
        <NewPartidaModal currentYearId={currentYearId} funcInitialBudget={funcPartida?.initial_budget} />
      </div>

      {/* Global Budget Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Dotación Inicial Total</span>
          <div className="text-xl font-black text-slate-900 mt-1">{formatCurrency(totalBudgeted)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Orzamento anual aprobado</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Ingresos Imputados</span>
          <div className="text-xl font-black text-emerald-600 mt-1">+{formatCurrency(totalAllocatedIncome)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Achegas e dotacións recibidas</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Gastos Executados</span>
          <div className="text-xl font-black text-rose-600 mt-1">-{formatCurrency(totalSpent)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Pagos cargados a partidas</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Saldo Total Dispoñible</span>
          <div className={`text-xl font-black mt-1 ${totalAvailable < 0 ? 'text-rose-600' : 'text-indigo-700'}`}>
            {formatCurrency(totalAvailable)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Remanente orzamentario</span>
        </div>
      </div>

      {/* Partidas List */}
      <div className="space-y-4">
        {partidas.map((partida) => {
          const isExpanded = expandedPartidaId === partida.id;
          const totalFunds = partida.initial_budget + (partida.allocated_income || 0);
          const spent = partida.spent_amount || 0;
          const available = partida.available_balance || 0;
          const percentSpent = totalFunds > 0 ? Math.min(100, Math.round((spent / totalFunds) * 100)) : 0;

          // Movements for this partida
          const partidaMovements = movements.filter(m => m.partida_id === partida.id);

          return (
            <div
              key={partida.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
            >
              {/* Partida Header Card */}
              <div
                onClick={() => toggleExpand(partida.id)}
                className="p-5 cursor-pointer hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-slate-400">
                    {isExpanded ? <ChevronDown className="h-5 w-5 text-indigo-600" /> : <ChevronRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{partida.name}</h3>
                      {partida.is_base === 1 ? (
                        <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Partida Básica
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                          Partida Anual
                        </span>
                      )}
                      <span className="text-xs font-mono text-slate-400">[{partida.code}]</span>
                    </div>
                    {partida.description && (
                      <p className="text-xs text-slate-500 mt-1">{partida.description}</p>
                    )}
                  </div>
                </div>

                {/* Numbers & Progress */}
                <div className="flex items-center gap-4 lg:gap-6 lg:ml-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-right">
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase" title="Dotación Inicial">Dot. Inicial</span>
                      <strong className="text-sm text-slate-700 font-semibold">{formatCurrency(partida.initial_budget)}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase" title="Dotación Total">Dot. Total</span>
                      <strong className="text-sm text-slate-800 font-semibold">{formatCurrency(totalFunds)}</strong>
                      {(partida.allocated_income || 0) > 0 && (
                        <span className="text-[10px] text-emerald-600 font-medium block leading-tight">
                          +{formatCurrency(partida.allocated_income || 0)} ing.
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase">Gastado</span>
                      <strong className="text-sm text-rose-600 font-semibold">{formatCurrency(spent)}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase">Dispoñible</span>
                      <strong className={`text-sm font-bold ${available < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {formatCurrency(available)}
                      </strong>
                    </div>
                  </div>

                  <div className="w-24 hidden sm:block">
                    <div className="text-[11px] text-slate-400 text-right mb-1">{percentSpent}%</div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${percentSpent > 90 ? 'bg-rose-500' : percentSpent > 70 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                        style={{ width: `${percentSpent}%` }}
                      />
                    </div>
                  </div>

                  {partida.is_base === 0 && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <DeletePartidaButton
                        partidaId={partida.id}
                        name={partida.name}
                        isBase={partida.is_base}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Movements Imputed to This Partida */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Movementos Imputados a esta Partida ({partidaMovements.length})</span>
                    </h4>
                  </div>

                  {partidaMovements.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                      Non hai movementos imputados aínda a esta partida neste ano.
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5">Data</th>
                            <th className="px-4 py-2.5">Conta</th>
                            <th className="px-4 py-2.5">Tipo</th>
                            <th className="px-4 py-2.5">Concepto & Ref.</th>
                            <th className="px-4 py-2.5">Categoría Oficial</th>
                            <th className="px-4 py-2.5 text-right">Importe</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {partidaMovements.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50/70">
                              <td className="px-4 py-2.5 font-medium text-slate-600 whitespace-nowrap">
                                <div>{formatDate(m.date)}</div>
                                {m.academic_year_id && m.academic_year_id !== currentYearId && (
                                  <span 
                                    className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-200"
                                    title={`Movemento contable executado no exercicio ${m.academic_year_id}`}
                                  >
                                    Ano contable {m.academic_year_id}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${m.bank_account_id === 'comedor' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                  {m.bank_account_id === 'comedor' ? 'COMEDOR' : 'FUNCIONAMENTO'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                <span className={`font-semibold ${m.type === 'INGRESO' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {m.type}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="font-semibold text-slate-900">{m.concept}</span>
                                {m.reference_doc && (
                                  <span className="text-slate-400 font-mono ml-2">({m.reference_doc})</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-slate-600">
                                {m.category_name ? `${m.category_code}.- ${m.category_name}` : '-'}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold whitespace-nowrap">
                                <span className={m.type === 'INGRESO' ? 'text-emerald-600' : 'text-rose-700'}>
                                  {m.type === 'INGRESO' ? '+' : '-'}{formatCurrency(m.amount)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

