'use client';

import { useState, useTransition } from 'react';
import { X, FolderPlus, AlertCircle } from 'lucide-react';
import { createBudgetPartidaAction } from '@/lib/actions';
import { formatCurrency } from '@/lib/utils';

interface NewPartidaModalProps {
  currentYearId: string;
  funcInitialBudget?: number;
}

export default function NewPartidaModal({ currentYearId, funcInitialBudget }: NewPartidaModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [initialBudget, setInitialBudget] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setName('');
    setCode('');
    setInitialBudget('');
    setDescription('');
    setError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setError(null);
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numBudget = parseFloat(initialBudget) || 0;
    if (funcInitialBudget !== undefined && numBudget > funcInitialBudget) {
      setError(`A dotación inicial (${formatCurrency(numBudget)}) supera a dispoñible na partida básica Funcionamento (${formatCurrency(funcInitialBudget)}).`);
      return;
    }

    startTransition(async () => {
      setError(null);
      const formData = new FormData();
      formData.append('academic_year_id', currentYearId);
      formData.append('name', name.trim());
      formData.append('code', code.trim());
      formData.append('initial_budget', initialBudget || '0');
      formData.append('description', description.trim());

      const res = await createBudgetPartidaAction(formData);

      if (!res.success) {
        setError(res.error || 'Erro ao crear a partida orzamentaria.');
        return;
      }

      setName('');
      setCode('');
      setInitialBudget('');
      setDescription('');
      setError(null);
      setIsOpen(false);
    });
  };

  const isOverBudget = funcInitialBudget !== undefined && (parseFloat(initialBudget) || 0) > funcInitialBudget;

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
      >
        <FolderPlus className="h-4 w-4" />
        <span>Nova Partida Anual</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Crear Nova Partida Orzamentaria</h3>
                <p className="text-xs text-slate-500">Engada unha partida específica para este exercicio escolar</p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome da Partida *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Proxecto Erasmus+, Mellora Patio, Biblioteca..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Código de Referencia
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: PART-ERASMUS (opcional)"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Dotación Inicial (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={initialBudget}
                    onChange={(e) => {
                      setInitialBudget(e.target.value);
                      if (error) setError(null);
                    }}
                    className={`w-full text-sm rounded-lg border px-3 py-2 bg-white focus:outline-hidden focus:ring-2 font-semibold text-slate-800 ${
                      isOverBudget
                        ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                        : 'border-slate-300 focus:ring-emerald-500'
                    }`}
                  />
                  {funcInitialBudget !== undefined && (
                    <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                      Descontarase de Funcionamento (dispoñible: <span className="font-semibold text-slate-700">{formatCurrency(funcInitialBudget)}</span>).
                    </p>
                  )}
                  {isOverBudget && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">
                      Supera a dotación de Funcionamento ({formatCurrency(funcInitialBudget!)})
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Descrición / Finalidade
                </label>
                <textarea
                  rows={3}
                  placeholder="Obxectivo ou destino específico desta partida..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || isOverBudget}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isPending ? 'Creando...' : 'Crear Partida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

