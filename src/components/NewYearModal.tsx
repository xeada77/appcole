'use client';

import { useState, useTransition } from 'react';
import { Plus, X, Calendar, Sparkles } from 'lucide-react';
import { createAcademicYearAction } from '@/lib/actions';

interface NewYearModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewYearModal({ isOpen, onClose }: NewYearModalProps) {
  const [isPending, startTransition] = useTransition();

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [initialBudgetFunc, setInitialBudgetFunc] = useState('0.00');
  const [initialBudgetCom, setInitialBudgetCom] = useState('0.00');
  const [setAsCurrent, setSetAsCurrent] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name) return;

    setErrorMsg('');
    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('name', name);
      formData.append('start_date', startDate);
      formData.append('end_date', endDate);
      formData.append('set_as_current', setAsCurrent ? 'true' : 'false');
      formData.append('initial_budget_func', initialBudgetFunc);
      formData.append('initial_budget_com', initialBudgetCom);

      const res = await createAcademicYearAction(formData);
      if (!res.success && res.error) {
        setErrorMsg(res.error);
      } else {
        onClose();
      }
    });
  };

  // Quick preset helper (Anos naturais 01/01 a 31/12)
  const applyPreset = (year: number) => {
    setId(`${year}`);
    setName(`Ano ${year}`);
    setStartDate(`${year}-01-01`);
    setEndDate(`${year}-12-31`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Crear Novo Ano / Exercicio Natural</h3>
              <p className="text-xs text-slate-500">Configuración do orzamento e partidas para o novo ano</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Quick presets */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Suxestións de Anos Naturais
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset(2027)}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                Ano 2027
              </button>
              <button
                type="button"
                onClick={() => applyPreset(2026)}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                Ano 2026
              </button>
              <button
                type="button"
                onClick={() => applyPreset(2025)}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                Ano 2025
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Identificador / Ano *
              </label>
              <input
                type="text"
                placeholder="Ex: 2026, 2027..."
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome do Exercicio *
              </label>
              <input
                type="text"
                placeholder="Ex: Ano 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Data Inicio (Ano Natural)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Data Fin (Ano Natural)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
          </div>

          {/* Dotacións iniciais das dúas partidas básicas */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Dotación Inicial das Partidas Básicas</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Xeraranse automaticamente as dúas partidas básicas esixidas. A suma de ambas asignarase á categoría oficial de ingresos <strong>h) Remanentes do ano anterior</strong> para o resumo anual:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Funcionamento (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={initialBudgetFunc}
                  onChange={(e) => setInitialBudgetFunc(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Comedor (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={initialBudgetCom}
                  onChange={(e) => setInitialBudgetCom(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-800 font-semibold"
                />
              </div>
            </div>

            {/* Previsualización da Categoría H */}
            <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  h
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">Categoría h: Remanentes do ano anterior</span>
                  <span className="text-[11px] text-emerald-700">Imputación inicial sumada para o resumo anual</span>
                </div>
              </div>
              <span className="text-sm font-black font-mono text-emerald-800">
                {((parseFloat(initialBudgetFunc) || 0) + (parseFloat(initialBudgetCom) || 0)).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </span>
            </div>
          </div>

          {/* Checkbox Establecer como ano actual */}
          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={setAsCurrent}
              onChange={(e) => setSetAsCurrent(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-semibold text-slate-800">
              Cambiar inmediatamente a este ano como exercicio de traballo activo
            </span>
          </label>

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
              {isPending ? 'Creando...' : 'Crear Ano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
