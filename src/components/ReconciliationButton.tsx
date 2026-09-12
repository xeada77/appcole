'use client';

import { useTransition } from 'react';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { toggleReconciliationAction } from '@/lib/actions';

interface ReconciliationButtonProps {
  movementId: string;
  isReconciled: number;
}

export default function ReconciliationButton({ movementId, isReconciled }: ReconciliationButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleReconciliationAction(movementId, isReconciled === 0);
    });
  };

  if (isPending) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-400 cursor-not-allowed"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Actualizando...</span>
      </button>
    );
  }

  if (isReconciled === 1) {
    return (
      <button
        onClick={handleToggle}
        title="Prema para marcar como pendente de conciliar"
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        <span>Conciliado</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      title="Prema para marcar como conciliado co extracto bancario"
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300/80 hover:bg-amber-100 transition-colors cursor-pointer"
    >
      <Clock className="h-3.5 w-3.5 text-amber-600" />
      <span>Pendente</span>
    </button>
  );
}

