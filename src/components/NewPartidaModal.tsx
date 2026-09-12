'use client';

import { useState, useTransition } from 'react';
import { Plus, X, FolderPlus } from 'lucide-react';
import { createBudgetPartidaAction } from '@/lib/actions';

interface NewPartidaModalProps {
  currentYearId: string;
}

export default function NewPartidaModal({ currentYearId }: NewPartidaModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [initialBudget, setInitialBudget] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('academic_year_id', currentYearId);
      formData.append('name', name);
      formData.append('code', code);
      formData.append('initial_budget', initialBudget || '0');
      formData.append('description', description);

      await createBudgetPartidaAction(formData);

      setName('');
      setCode('');
      setInitialBudget('');
      setDescription('');
      setIsOpen(false);
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
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
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome da Partida *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Proxecto Erasmus+, Mellora Patio, Biblioteca..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                    onChange={(e) => setCode(e.target.value)}
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
                    onChange={(e) => setInitialBudget(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                  />
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
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

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

