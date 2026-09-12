'use client';

import { useTransition } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteBudgetPartidaAction } from '@/lib/actions';

interface DeletePartidaButtonProps {
  partidaId: string;
  name: string;
  isBase: number;
}

export default function DeletePartidaButton({ partidaId, name, isBase }: DeletePartidaButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (isBase === 1) return null;

  const handleDelete = () => {
    if (confirm(`¿Confirma a eliminación da partida "${name}"? Os movementos asociados quedarán sen partida vinculada.`)) {
      startTransition(async () => {
        const res = await deleteBudgetPartidaAction(partidaId);
        if (!res.success && res.error) {
          alert(res.error);
        }
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title="Eliminar partida personalizada"
      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}

