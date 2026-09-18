'use client';

import { useState, useTransition, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Check, AlertCircle, Pencil, Paperclip, FileText, Trash2, ExternalLink } from 'lucide-react';
import { BankAccount, BudgetPartida, Category, Movement, AcademicYear } from '@/lib/types';
import { updateMovementAction, getPartidasByYearAction } from '@/lib/actions';

interface EditMovementModalProps {
  movement: Movement;
  accounts: BankAccount[];
  partidas: BudgetPartida[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  years?: AcademicYear[];
  isOpen: boolean;
  onClose: () => void;
}

export default function EditMovementModal({
  movement,
  accounts,
  partidas,
  incomeCategories,
  expenseCategories,
  years,
  isOpen,
  onClose
}: EditMovementModalProps) {
  const [isPending, startTransition] = useTransition();

  // Find previous years
  const currentYear = years?.find(y => y.id === movement.academic_year_id);
  const previousYears = (years || [])
    .filter(y => {
      if (y.id === movement.academic_year_id) return false;
      if (currentYear?.start_date && y.start_date) {
        return new Date(y.start_date).getTime() < new Date(currentYear.start_date).getTime();
      }
      const currentNum = parseInt(movement.academic_year_id, 10);
      const yNum = parseInt(y.id, 10);
      if (!isNaN(currentNum) && !isNaN(yNum)) {
        return yNum < currentNum;
      }
      return y.id.localeCompare(movement.academic_year_id, undefined, { numeric: true }) < 0;
    })
    .sort((a, b) => {
      if (a.start_date && b.start_date) {
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      }
      return b.id.localeCompare(a.id, undefined, { numeric: true });
    });

  const isInitiallyPrevious = Boolean(
    movement.partida_year_id && movement.partida_year_id !== movement.academic_year_id
  );

  const [imputeToPreviousYear, setImputeToPreviousYear] = useState(isInitiallyPrevious);
  const [selectedPrevYearId, setSelectedPrevYearId] = useState<string>(
    movement.partida_year_id && movement.partida_year_id !== movement.academic_year_id
      ? movement.partida_year_id
      : (previousYears[0]?.id || '')
  );
  const [prevYearPartidas, setPrevYearPartidas] = useState<BudgetPartida[]>([]);
  const [isLoadingPrevPartidas, setIsLoadingPrevPartidas] = useState(false);

  const loadPreviousPartidas = async (yearId: string) => {
    setIsLoadingPrevPartidas(true);
    try {
      const data = await getPartidasByYearAction(yearId);
      setPrevYearPartidas(data);
    } catch (err) {
      console.error('Erro ao cargar as partidas do ano anterior:', err);
    } finally {
      setIsLoadingPrevPartidas(false);
    }
  };

  useEffect(() => {
    if (imputeToPreviousYear && selectedPrevYearId) {
      loadPreviousPartidas(selectedPrevYearId);
    }
  }, [imputeToPreviousYear, selectedPrevYearId]);

  const handleTogglePreviousYear = (checked: boolean) => {
    setImputeToPreviousYear(checked);
    if (checked) {
      const targetYear = selectedPrevYearId || previousYears[0]?.id;
      if (targetYear) {
        setSelectedPrevYearId(targetYear);
      }
    } else {
      setPartidaId('');
    }
  };

  const handleChangePrevYear = (newYearId: string) => {
    setSelectedPrevYearId(newYearId);
    setPartidaId('');
  };

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
  const [removeInvoice, setRemoveInvoice] = useState(false);
  const [newInvoiceFile, setNewInvoiceFile] = useState<File | null>(null);

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
      if (removeInvoice) formData.append('remove_invoice', 'true');
      if (newInvoiceFile) formData.append('invoice', newInvoiceFile);

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
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${type === 'GASTO'
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
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${type === 'INGRESO'
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/60 pb-2">
              <div className="text-base font-bold text-indigo-900 flex items-center gap-1.5">
                <span>Imputación Contable</span>
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
                  className={`w-full text-sm rounded-lg border px-3 py-2 bg-white focus:outline-hidden focus:ring-2 text-slate-800 transition-colors ${imputeToPreviousYear
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

          {/* Xestión de Factura / Xustificante dixital */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-indigo-600" />
                Factura / Xustificante dixital
              </span>
              <span className="text-[11px] font-normal text-slate-400">PDF, PNG, JPG ata 15MB</span>
            </label>

            {/* Caso 1: Xa tiña factura asociada */}
            {movement.invoice_key && !removeInvoice ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {movement.invoice_filename || 'Factura adxunta'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {movement.invoice_size ? `${(movement.invoice_size / 1024).toFixed(0)} KB • ` : ''}Almacenado en RustFS
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/api/movements/${movement.id}/invoice?v=${encodeURIComponent(movement.invoice_key || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium text-xs shadow-2xs transition-colors"
                      title="Abrir factura nunha nova pestana"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Ver</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setRemoveInvoice(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium text-xs shadow-2xs transition-colors cursor-pointer"
                      title="Eliminar esta factura"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>

                {/* Opción para substituír a factura existente */}
                {newInvoiceFile ? (
                  <div className="flex items-center justify-between p-2 rounded-lg border border-amber-200 bg-amber-50/50 text-xs">
                    <span className="text-amber-800 font-medium truncate">
                      Substituír por: {newInvoiceFile.name} ({(newInvoiceFile.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewInvoiceFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium pl-1">
                    <span>Substituír por outro arquivo...</span>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 15 * 1024 * 1024) {
                            alert('O arquivo supera o tamaño máximo permitido de 15 MB.');
                            e.target.value = '';
                            return;
                          }
                          setNewInvoiceFile(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            ) : removeInvoice ? (
              /* Caso 2: O usuario marcou a factura para eliminar */
              <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-rose-300 bg-rose-50/50 text-xs">
                <span className="text-rose-700 font-medium">
                  A factura actual será eliminada permanentemente ao gardar.
                </span>
                <button
                  type="button"
                  onClick={() => setRemoveInvoice(false)}
                  className="px-2.5 py-1 rounded-md bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold cursor-pointer"
                >
                  Desfacer
                </button>
              </div>
            ) : (
              /* Caso 3: Non tiña factura ou quere subir unha */
              <div>
                {newInvoiceFile ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/50 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{newInvoiceFile.name}</span>
                      <span className="text-slate-500 shrink-0">({(newInvoiceFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewInvoiceFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Eliminar arquivo seleccionado"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-slate-50/70 cursor-pointer transition-colors text-xs text-slate-600">
                    <Paperclip className="h-4 w-4 text-slate-400" />
                    <span>Faga clic para adxuntar unha factura ou xustificante</span>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 15 * 1024 * 1024) {
                            alert('O arquivo supera o tamaño máximo permitido de 15 MB.');
                            e.target.value = '';
                            return;
                          }
                          setNewInvoiceFile(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
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

