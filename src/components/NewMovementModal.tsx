'use client';

import { useState, useTransition, useEffect } from 'react';
import { Plus, X, ArrowDownRight, ArrowUpRight, Check, AlertCircle } from 'lucide-react';
import { BankAccount, BudgetPartida, Category, AcademicYear } from '@/lib/types';
import { createMovementAction, getPartidasByYearAction } from '@/lib/actions';

interface NewMovementModalProps {
  accounts: BankAccount[];
  partidas: BudgetPartida[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  currentYearId: string;
  years?: AcademicYear[];
}

export default function NewMovementModal({
  accounts,
  partidas,
  incomeCategories,
  expenseCategories,
  currentYearId,
  years
}: NewMovementModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Find previous years
  const currentYear = years?.find(y => y.id === currentYearId);
  const previousYears = (years || [])
    .filter(y => {
      if (y.id === currentYearId) return false;
      if (currentYear?.start_date && y.start_date) {
        return new Date(y.start_date).getTime() < new Date(currentYear.start_date).getTime();
      }
      const currentNum = parseInt(currentYearId, 10);
      const yNum = parseInt(y.id, 10);
      if (!isNaN(currentNum) && !isNaN(yNum)) {
        return yNum < currentNum;
      }
      return y.id.localeCompare(currentYearId, undefined, { numeric: true }) < 0;
    })
    .sort((a, b) => {
      if (a.start_date && b.start_date) {
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      }
      return b.id.localeCompare(a.id, undefined, { numeric: true });
    });

  // Previous year imputation states
  const [imputeToPreviousYear, setImputeToPreviousYear] = useState(false);
  const [selectedPrevYearId, setSelectedPrevYearId] = useState<string>(previousYears[0]?.id || '');
  const [prevYearPartidas, setPrevYearPartidas] = useState<BudgetPartida[]>([]);
  const [isLoadingPrevPartidas, setIsLoadingPrevPartidas] = useState(false);

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

  // Function to load previous year's partidas
  const loadPreviousPartidas = async (yearId: string) => {
    setIsLoadingPrevPartidas(true);
    try {
      const data = await getPartidasByYearAction(yearId);
      setPrevYearPartidas(data);
      const match = data.find(p => p.code.toLowerCase().includes(bankAccountId === 'comedor' ? 'com' : 'func'));
      setPartidaId(match ? match.id : (data[0]?.id || ''));
    } catch (err) {
      console.error('Erro ao cargar as partidas do ano anterior:', err);
    } finally {
      setIsLoadingPrevPartidas(false);
    }
  };

  const handleTogglePreviousYear = (checked: boolean) => {
    setImputeToPreviousYear(checked);
    if (checked) {
      const targetYear = selectedPrevYearId || previousYears[0]?.id;
      if (targetYear) {
        setSelectedPrevYearId(targetYear);
        loadPreviousPartidas(targetYear);
      }
    } else {
      const match = partidas.find(p => p.code.toLowerCase().includes(bankAccountId === 'comedor' ? 'com' : 'func'));
      setPartidaId(match ? match.id : (partidas[0]?.id || ''));
    }
  };

  const handleChangePrevYear = (newYearId: string) => {
    setSelectedPrevYearId(newYearId);
    loadPreviousPartidas(newYearId);
  };

  // Sync default partida when account changes
  const handleAccountChange = (newAccId: string) => {
    setBankAccountId(newAccId);
    const targetPartidas = imputeToPreviousYear ? prevYearPartidas : partidas;
    if (newAccId === 'comedor') {
      const comPartida = targetPartidas.find(p => p.name.toLowerCase().includes('comedor'));
      if (comPartida) setPartidaId(comPartida.id);
    } else {
      const funcPartida = targetPartidas.find(p => p.name.toLowerCase().includes('funcionamento'));
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
      setImputeToPreviousYear(false);
      setPrevYearPartidas([]);
      const match = partidas.find(p => p.code.toLowerCase().includes(bankAccountId === 'comedor' ? 'com' : 'func'));
      setPartidaId(match ? match.id : (partidas[0]?.id || ''));
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/60 pb-2">
                  <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <span>Imputación Contable e Consellería</span>
                  </div>

                  {previousYears.length > 0 && (
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-2 py-1 rounded-md border border-amber-200/80 transition-colors select-none">
                      <input
                        type="checkbox"
                        checked={imputeToPreviousYear}
                        onChange={(e) => handleTogglePreviousYear(e.target.checked)}
                        className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span>Imputar a partida do ano anterior</span>
                    </label>
                  )}
                </div>

                {imputeToPreviousYear && (
                  <div className="p-2.5 rounded-lg bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold">Imputación a exercicio anterior: </span>
                        <span>O gasto/ingreso computarase na partida do exercicio seleccionado.</span>
                      </div>
                    </div>
                    {previousYears.length > 1 ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-semibold text-amber-800">Ano:</span>
                        <select
                          value={selectedPrevYearId}
                          onChange={(e) => handleChangePrevYear(e.target.value)}
                          className="text-xs rounded-md border border-amber-300 bg-white px-2 py-1 font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer"
                        >
                          {previousYears.map(py => (
                            <option key={py.id} value={py.id}>
                              {py.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="font-bold text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200 text-[11px] shrink-0">
                        {previousYears[0]?.name}
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-600">
                        Partida Orzamentaria {imputeToPreviousYear ? `(${previousYears.find(y => y.id === selectedPrevYearId)?.name || 'Ano anterior'})` : 'Anual'}
                      </label>
                      {isLoadingPrevPartidas && (
                        <span className="text-[10px] text-amber-600 animate-pulse font-medium">Cargando partidas...</span>
                      )}
                    </div>
                    <select
                      value={partidaId}
                      onChange={(e) => setPartidaId(e.target.value)}
                      disabled={isLoadingPrevPartidas}
                      className={`w-full text-sm rounded-lg border px-3 py-2 bg-white focus:outline-hidden focus:ring-2 text-slate-800 transition-colors ${
                        imputeToPreviousYear 
                          ? 'border-amber-300 focus:ring-amber-500 ring-1 ring-amber-200' 
                          : 'border-slate-300 focus:ring-indigo-500'
                      }`}
                    >
                      <option value="">-- Sen imputar a partida --</option>
                      {(imputeToPreviousYear ? prevYearPartidas : partidas).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.is_base ? '(Básica)' : ''} {imputeToPreviousYear ? `[${previousYears.find(y => y.id === selectedPrevYearId)?.name || 'Ano anterior'}]` : ''}
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

