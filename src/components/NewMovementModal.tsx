'use client';

import { useState, useTransition } from 'react';
import { Plus, X, ArrowDownRight, ArrowUpRight, Check, AlertCircle } from 'lucide-react';
import { BankAccount, BudgetPartida, Category } from '@/lib/types';
import { createMovementAction } from '@/lib/actions';

interface NewMovementModalProps {
  accounts: BankAccount[];
  partidas: BudgetPartida[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  currentYearId: string;
}

export default function NewMovementModal({
  accounts,
  partidas,
  incomeCategories,
  expenseCategories,
  currentYearId
}: NewMovementModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [bankAccountId, setBankAccountId] = useState(accounts[0]?.id || 'funcionamento');
  const [type, setType] = useState<'GASTO' | 'INGRESO'>('GASTO');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [concept, setConcept] = useState('');
  const [partidaId, setPartidaId] = useState(() => {
    // Default to matching base partida
    const match = partidas.find(p => p.code.toLowerCase().includes(bankAccountId === 'comedor' ? 'com' : 'func'));
    return match ? match.id : (partidas[0]?.id || '');
  });
  const [categoryId, setCategoryId] = useState('');
  const [referenceDoc, setReferenceDoc] = useState('');
  const [notes, setNotes] = useState('');
  const [isReconciled, setIsReconciled] = useState(false);

  // Sync default partida when account changes
  const handleAccountChange = (newAccId: string) => {
    setBankAccountId(newAccId);
    if (newAccId === 'comedor') {
      const comPartida = partidas.find(p => p.name.toLowerCase().includes('comedor'));
      if (comPartida) setPartidaId(comPartida.id);
    } else {
      const funcPartida = partidas.find(p => p.name.toLowerCase().includes('funcionamento'));
      if (funcPartida) setPartidaId(funcPartida.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !concept) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('bank_account_id', bankAccountId);
      formData.append('academic_year_id', currentYearId);
      formData.append('date', date);
      formData.append('type', type);
      formData.append('concept', concept);
      formData.append('amount', amount);
      if (partidaId) formData.append('partida_id', partidaId);
      if (categoryId) formData.append('category_id', categoryId);
      if (referenceDoc) formData.append('reference_doc', referenceDoc);
      if (notes) formData.append('notes', notes);
      formData.append('is_reconciled', isReconciled ? 'true' : 'false');

      await createMovementAction(formData);
      
      // Reset form & close
      setAmount('');
      setConcept('');
      setReferenceDoc('');
      setNotes('');
      setIsReconciled(false);
      setIsOpen(false);
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
      >
        <Plus className="h-4 w-4" />
        <span>Novo Movemento</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Rexistrar Novo Movemento</h3>
                <p className="text-xs text-slate-500">Introduza os datos bancarios e a imputación orzamentaria</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type Switcher: Gasto vs Ingreso */}
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setType('GASTO'); setCategoryId(''); }}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                    type === 'GASTO'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownRight className="h-4 w-4" />
                  <span>GASTO (Pago)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setType('INGRESO'); setCategoryId(''); }}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                    type === 'INGRESO'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>INGRESO (Cobro)</span>
                </button>
              </div>

              {/* Cuenta Bancaria & Fecha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Conta Bancaria *
                  </label>
                  <select
                    value={bankAccountId}
                    onChange={(e) => handleAccountChange(e.target.value)}
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

              {/* Importe y Concepto */}
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
                    placeholder="Ex: Factura electricidade outubro, material fotocopias..."
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Imputación a Partida e Categoría Oficial */}
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
                          .map(cat => (
                            <option 
                              key={cat.id} 
                              value={cat.id}
                              disabled={cat.is_group === 1}
                              className={cat.is_group === 1 ? 'font-bold bg-slate-100 text-slate-500' : ''}
                            >
                              {cat.code}) {cat.name}
                            </option>
                          ))
                      ) : (
                        expenseCategories.map(cat => (
                          <option 
                            key={cat.id} 
                            value={cat.id}
                            disabled={cat.is_group === 1}
                            className={cat.is_group === 1 ? 'font-bold bg-slate-100 text-slate-500' : ''}
                          >
                            {cat.code}.- {cat.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Referencia documental y Observaciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nº Factura / Ref. Documental
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: FAC-2025/089, REC-9921..."
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
                    placeholder="Detalles adicionais do movemento"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Checkbox Conciliación Bancaria */}
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
                      Marcar como xa conciliado no banco
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Activa esta opción se o movemento xa figura verificado no extracto da conta corrente.
                    </span>
                  </div>
                </label>
              </div>

              {/* Botóns de Acción */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isPending ? 'Gardando...' : 'Rexistrar Movemento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

