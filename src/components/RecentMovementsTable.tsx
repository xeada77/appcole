'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowDownRight, ArrowUpRight, Pencil } from 'lucide-react';
import { Movement, BankAccount, BudgetPartida, Category, AcademicYear } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import ReconciliationButton from './ReconciliationButton';
import DeleteMovementButton from './DeleteMovementButton';
import EditMovementModal from './EditMovementModal';

interface RecentMovementsTableProps {
  movements: Movement[];
  accounts: BankAccount[];
  partidas: BudgetPartida[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  years?: AcademicYear[];
}

export default function RecentMovementsTable({
  movements,
  accounts,
  partidas,
  incomeCategories,
  expenseCategories,
  years
}: RecentMovementsTableProps) {
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Últimos Movementos Rexistrados</h2>
          <p className="text-xs text-slate-500">Histórico recente de ingresos e gastos con edición e conciliación</p>
        </div>
        <Link
          href="/bancos"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          Ver e filtrar todos os movementos <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Data</th>
              <th className="px-5 py-3">Conta</th>
              <th className="px-5 py-3">Concepto & Ref.</th>
              <th className="px-5 py-3">Partida / Categoría</th>
              <th className="px-5 py-3 text-right">Importe</th>
              <th className="px-5 py-3 text-center">Conciliación</th>
              <th className="px-4 py-3 text-right">Accións</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movements.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-sm">
                  Non hai movementos rexistrados para este ano natural.
                </td>
              </tr>
            ) : (
              movements.map((mov) => (
                <tr
                  key={mov.id}
                  onDoubleClick={() => setEditingMovement(mov)}
                  title="Faga dobre clic para editar este movemento"
                  className="hover:bg-indigo-50/40 transition-colors group cursor-pointer"
                >
                  <td className="px-5 py-3.5 font-medium text-slate-600 whitespace-nowrap text-xs">
                    {formatDate(mov.date)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${mov.bank_account_id === 'comedor'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                      }`}>
                      {mov.bank_account_id === 'comedor' ? 'COMEDOR' : 'FUNCIONAMENTO'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-900 transition-colors">
                      {mov.concept}
                    </div>
                    {mov.reference_doc && (
                      <div className="text-[11px] text-slate-400 font-mono">Ref: {mov.reference_doc}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {mov.partida_name && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="block font-medium text-indigo-700">{mov.partida_name}</span>
                        {mov.partida_year_id && mov.partida_year_id !== mov.academic_year_id && (
                          <span 
                            className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200"
                            title={`Movemento imputado á partida do ano ${mov.partida_year_id}`}
                          >
                            Ano {mov.partida_year_id}
                          </span>
                        )}
                      </div>
                    )}
                    {mov.category_name && (
                      <span className="block text-[11px] text-slate-500">
                        {mov.category_code}.- {mov.category_name}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <span className={`font-bold ${mov.type === 'INGRESO' ? 'text-emerald-600' : 'text-rose-700'
                      }`}>
                      {mov.type === 'INGRESO' ? '+' : '-'}{formatCurrency(mov.amount)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <ReconciliationButton
                      movementId={mov.id}
                      isReconciled={mov.is_reconciled}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingMovement(mov)}
                        title="Editar movemento"
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <DeleteMovementButton
                        movementId={mov.id}
                        concept={mov.concept}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Movement Modal */}
      {editingMovement && (
        <EditMovementModal
          movement={editingMovement}
          accounts={accounts}
          partidas={partidas}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          years={years}
          isOpen={!!editingMovement}
          onClose={() => setEditingMovement(null)}
        />
      )}
    </div>
  );
}

