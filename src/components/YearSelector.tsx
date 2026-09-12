'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Calendar, ChevronDown, Check, Plus, Trash2, Loader2, Sparkles } from 'lucide-react';
import { AcademicYear } from '@/lib/types';
import { switchAcademicYearAction, deleteAcademicYearAction } from '@/lib/actions';
import NewYearModal from './NewYearModal';

interface YearSelectorProps {
  currentYear: AcademicYear;
  years: AcademicYear[];
  variant?: 'header' | 'sidebar';
}

export default function YearSelector({ currentYear, years, variant = 'header' }: YearSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNewYearModal, setShowNewYearModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectYear = (yearId: string) => {
    if (yearId === currentYear.id) {
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      await switchAcademicYearAction(yearId);
      setIsOpen(false);
    });
  };

  const handleDeleteYear = (e: React.MouseEvent, year: AcademicYear) => {
    e.stopPropagation();
    if (confirm(`¿Desexa eliminar o ano "${year.name}"? Só é posible se non ten movementos asociados.`)) {
      startTransition(async () => {
        const res = await deleteAcademicYearAction(year.id);
        if (!res.success && res.error) {
          alert(res.error);
        }
      });
    }
  };

  return (
    <>
      <div className={`relative text-left ${variant === 'sidebar' ? 'w-full' : 'inline-block'}`} ref={dropdownRef}>
        {variant === 'header' ? (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
            ) : (
              <Calendar className="h-5 w-5 text-indigo-600" />
            )}
            <span  className="text-[12px] uppercase font-bold  px-1.5 py-0.2 rounded">{currentYear.name}</span>
            <span className="text-[10px] uppercase font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded">
              Activo
            </span>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isPending}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 text-xs text-slate-200 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 shrink-0">
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Calendar className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs group-hover:text-indigo-200 transition-colors">
                    {currentYear.name}
                  </span>
                  <span className="text-[9px] uppercase font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                    Activo
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Prema para cambiar de ano</span>
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-transform" />
          </button>
        )}

        {/* Dropdown Menu */}
        {isOpen && (
          <div className={`absolute mt-1.5 origin-top rounded-xl bg-white shadow-2xl ring-1 ring-black/10 focus:outline-hidden z-50 border border-slate-200 animate-in fade-in zoom-in-95 duration-100 overflow-hidden ${
            variant === 'sidebar' ? 'left-0 right-0 w-full' : 'right-0 w-72'
          }`}>
            <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Cambiar de Exercicio
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {years.length} dispoñibles
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Seleccione o ano natural para consultar ou rexistrar movementos.
              </p>
            </div>

            <div className="py-1 max-h-56 overflow-y-auto">
              {years.map((y) => {
                const isCurrent = y.id === currentYear.id;
                return (
                  <div
                    key={y.id}
                    onClick={() => handleSelectYear(y.id)}
                    className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-indigo-50 text-indigo-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`h-2 w-2 rounded-full ${isCurrent ? 'bg-indigo-600 ring-2 ring-indigo-300' : 'bg-slate-300'}`} />
                      <div>
                        <span className="block">{y.name}</span>
                        {/* {y.start_date && y.end_date && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {y.start_date.split('-')[0]} - {y.end_date.split('-')[0]}
                          </span>
                        )} */}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCurrent ? (
                        <span className="text-[10px] uppercase font-bold bg-indigo-600 text-white px-1.5 py-0.2 rounded">
                          Activo
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteYear(e, y)}
                          title="Eliminar este exercicio baleiro"
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-2 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowNewYearModal(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm">Crear Novo Ano</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <NewYearModal
        isOpen={showNewYearModal}
        onClose={() => setShowNewYearModal(false)}
      />
    </>
  );
}
