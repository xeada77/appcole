'use client';

import { useTransition } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteMovementAction } from '@/lib/actions';

interface DeleteMovementButtonProps {
  movementId: string;
  concept: string;
}

export default function DeleteMovementButton({ movementId, concept }: DeleteMovementButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`¿Confirma a eliminación do movemento "${concept}"?`)) {
      startTransition(async () => {
        await deleteMovementAction(movementId);
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title="Eliminar movemento"
      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 cursor-pointer"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}

