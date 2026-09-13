'use client';

import { useState, useTransition } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Check, AlertCircle, Pencil } from 'lucide-react';
import { BankAccount, BudgetPartida, Category, Movement } from '@/lib/types';
import { updateMovementAction } from '@/lib/actions';

interface EditMovementModalProps {
  movement: Movement;
  accounts: BankAccount[];
  partidas: BudgetPartida[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  isOpen: boolean;
  onClose: () => void;
}

export default function EditMovementModal({
  movement,
  accounts,
  partidas,
  incomeCategories,
  expenseCategories,
  isOpen,
  onClose
}: EditMovementModalProps) {
  const [isPending, startTransition] = useTransition();

  // Form states prefilled from movement
  const [bankAccountId, setBankAccountId] = useState(movement.bank_account_id);
  const [type, setType] = useState<'GASTO' | 'INGRESO'>(movement.type);
  const [amount, setAmount] = useState(movement.amount.toString());
  const [date, setDate] = useState(movement.date);
  const [concept, setConcept] = useState(movement.concept);
  const [partidaId, setPartidaId] = useState(movement.partida_id || '');
  const [categoryId, setCategoryId] = useState(
    movement.type === 'INGRESO'
      ? (movement.income_category_id || '')
      : (movement.expense_category_id || '')
  );
  const [referenceDoc, setReferenceDoc] = useState(movement.reference_doc || '');
  const [notes, setNotes] = useState(movement.notes || '');
  const [isReconciled, setIsReconciled] = useState(movement.is_reconciled === 1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !concept) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', movement.id);
      formData.append('bank_account_id', bankAccountId);
      formData.append('date', date);
      formData.append('type', type);
      formData.append('concept', concept);
      formData.append('amount', amount);
      if (partidaId) formData.append('partida_id', partidaId);
      if (categoryId) formData.append('category_id', categoryId);
      if (referenceDoc) formData.append('reference_doc', referenceDoc);
      if (notes) formData.append('notes', notes);
      formData.append('is_reconciled', isReconciled ? 'true' : 'false');

      await updateMovementAction(formData);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Editar Movemento Bancario</h3>
              <p className="text-xs text-slate-500">Modifique os datos contables, partida ou categoría</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Switcher */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => { setType('GASTO'); setCategoryId(''); }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                type === 'GASTO'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="h-4 w-4" />
              <span>GASTO (Pago)</span>
            </button>
            <button
              type="button"
              onClick={() => { setType('INGRESO'); setCategoryId(''); }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                type === 'INGRESO'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>INGRESO (Cobro)</span>
            </button>
          </div>

          {/* Account & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Conta Bancaria *
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                required
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Data da Operación *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                required
              />
            </div>
          </div>

          {/* Amount & Concept */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Importe (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Concepto / Descrición *
              </label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                required
              />
            </div>
          </div>

          {/* Imputación a Partida e Categoría */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <span>Imputación Contable e Consellería</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Partida Orzamentaria Anual
                </label>
                <select
                  value={partidaId}
                  onChange={(e) => setPartidaId(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                >
                  <option value="">-- Sen imputar a partida --</option>
                  {partidas.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.is_base ? '(Básica)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Categoría Oficial da Consellería
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                >
                  <option value="">-- Seleccionar categoría oficial --</option>
                  {type === 'INGRESO' ? (
                    incomeCategories
                      .filter(cat => cat.code.toLowerCase() !== 'h' && cat.id !== 'inc-h')
                      .map(cat => {
                        const depth = (cat.code.match(/\./g) || []).length;
                        const indent = '\u00A0\u00A0'.repeat(depth);
                        return (
                          <option 
                            key={cat.id} 
                            value={cat.id}
                            disabled={cat.is_group === 1}
                            className={cat.is_group === 1 ? 'font-bold bg-slate-100 text-slate-500' : ''}
                          >
                            {indent}{cat.code}) {cat.name} {cat.is_group === 1 ? '(Grupo)' : ''}
                          </option>
                        );
                      })
                  ) : (
                    expenseCategories.map(cat => {
                      const depth = (cat.code.match(/\./g) || []).length;
                      const indent = '\u00A0\u00A0'.repeat(depth);
                      return (
                        <option 
                          key={cat.id} 
                          value={cat.id}
                          disabled={cat.is_group === 1}
                          className={cat.is_group === 1 ? 'font-bold bg-slate-100 text-slate-500' : ''}
                        >
                          {indent}{cat.code}.- {cat.name} {cat.is_group === 1 ? '(Grupo)' : ''}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nº Factura / Ref. Documental
              </label>
              <input
                type="text"
                placeholder="Ex: FAC-2026/089"
                value={referenceDoc}
                onChange={(e) => setReferenceDoc(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Observacións / Notas
              </label>
              <input
                type="text"
                placeholder="Detalles adicionais"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
          </div>

          {/* Reconciled Checkbox */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={isReconciled}
                onChange={(e) => setIsReconciled(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800 block">
                  Movemento conciliado no extracto bancario
                </span>
                <span className="text-xs text-slate-500 block">
                  Marque esta casa se o movemento xa foi verificado co banco.
                </span>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending ? 'Gardando...' : 'Gardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

