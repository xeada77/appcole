'use client';

import { useState, useTransition, useEffect } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Database, 
  X, 
  HardDrive, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { createManualBackupAction, getBackupStatusAction } from '@/lib/actions';
import { formatDate } from '@/lib/utils';
import { BackupStatus } from '@/lib/backup';

interface BackupModalProps {
  variant?: 'header' | 'sidebar';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function BackupModal({ variant = 'header' }: BackupModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadStatus = async () => {
    const res = await getBackupStatusAction();
    if (res.success && res.status) {
      setStatus(res.status);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setFeedbackMsg(null);
    }
  }, [isOpen]);

  const handleDownload = () => {
    setIsDownloading(true);
    setFeedbackMsg(null);
    try {
      window.location.href = '/api/backup/download';
      setTimeout(() => {
        setIsDownloading(false);
        setFeedbackMsg({
          type: 'success',
          text: 'Descarga iniciada con éxito. O arquivo .db gardouse no seu ordenador.'
        });
      }, 1000);
    } catch {
      setIsDownloading(false);
      setFeedbackMsg({
        type: 'error',
        text: 'Non se puido iniciar a descarga. Probe de novo.'
      });
    }
  };

  const handleCreateManual = () => {
    setFeedbackMsg(null);
    startTransition(async () => {
      const res = await createManualBackupAction();
      if (res.success && res.status) {
        setStatus(res.status);
        setFeedbackMsg({
          type: 'success',
          text: `Copia xerada con éxito: ${res.filename}`
        });
      } else {
        setFeedbackMsg({
          type: 'error',
          text: res.error || 'Erro ao xerar a copia'
        });
      }
    });
  };

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Copias de Seguridade</span>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Xestión de copias de seguridade e descarga"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-all cursor-pointer"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="hidden sm:inline">Copia Seguridade</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Copias de Seguridade (Backups)</h3>
                  <p className="text-xs text-slate-500">Protección e integridade da base de datos local SQLite</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {feedbackMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                    feedbackMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {feedbackMsg.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  )}
                  <span>{feedbackMsg.text}</span>
                </div>
              )}

              {/* Status do sistema de copias automáticas */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Copia Automática Diaria: Activa
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Rotación dos últimos 7 días
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  O sistema xera automaticamente unha copia de seguridade íntegra cada día en segundo plano no cartafol <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[11px] font-mono">data/backups/</code> usando a instrución atómica <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[11px] font-mono">VACUUM INTO</code>, que garante que o arquivo nunca resulte corrupto nin se perda información.
                </p>
              </div>

              {/* Botóns de Acción Directa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Descarga local (.db) */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex flex-col items-start p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all group cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                    <Download className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-emerald-950">Descargar Copia (.db)</span>
                  <span className="text-[11px] text-emerald-700 mt-0.5">
                    Garda unha copia limpa no teu disco ou nun pendrive
                  </span>
                </button>

                {/* Xerar copia manual no servidor */}
                <button
                  type="button"
                  onClick={handleCreateManual}
                  disabled={isPending}
                  className="flex flex-col items-start p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50 hover:border-indigo-300 text-left transition-all group cursor-pointer disabled:opacity-50"
                >
                  <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                    <HardDrive className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-indigo-950">
                    {isPending ? 'Xerando copia...' : 'Xerar Copia no Servidor'}
                  </span>
                  <span className="text-[11px] text-indigo-700 mt-0.5">
                    Crea unha nova instantánea no servidor agora mesmo
                  </span>
                </button>
              </div>

              {/* Histórico recente de copias no servidor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Copias Gardadas no Servidor ({status?.totalBackups || 0})
                  </span>
                  <button
                    type="button"
                    onClick={loadStatus}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" /> Actualizar
                  </button>
                </div>

                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {status && status.backups.length > 0 ? (
                    status.backups.map((b) => (
                      <div key={b.name} className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-slate-400 shrink-0" />
                          <div>
                            <span className="font-mono font-medium text-slate-800 block truncate max-w-[260px]">
                              {b.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(b.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                        </div>
                        <span className="text-slate-500 font-mono text-[11px] font-semibold">
                          {formatBytes(b.sizeBytes)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Non hai copias arquivadas aínda. Xerarase a primeira automaticamente.
                    </div>
                  )}
                </div>
              </div>

              {/* Consello para a dirección e secretaría */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Recomendación do centro:</strong> Descargue unha copia ao seu ordenador ou pendrive ao rematar o trimestre ou antes de realizar cambios importantes de exercicio escolar para dispor de respaldo externo.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                Pechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
