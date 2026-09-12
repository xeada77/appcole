'use client';

import { useActionState, useState } from 'react';
import { 
  School, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  Landmark, 
  PieChart, 
  FileSpreadsheet 
} from 'lucide-react';
import { loginAction } from '@/lib/auth';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 font-sans">
      {/* ============================================================ */}
      {/* PANELLO ESQUERDO: Identidade e Marca                         */}
      {/* ============================================================ */}
      <div className="relative w-full lg:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/60 p-8 lg:p-16 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
        {/* Glow de fondo */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Cabeceira co Logotipo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-xl shadow-indigo-500/25 ring-1 ring-white/20 shrink-0">
              <School className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">AppCole</h1>
                <span className="text-xs font-bold uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  v16
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Xestión Económica e Orzamentaria Escolar</p>
            </div>
          </div>

          <div className="mt-8 lg:mt-16 max-w-lg">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Control económico transparente e eficiente para o teu centro educativo.
            </h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Plataforma integral desenvolvida para axilizar a contabilidade escolar, xustificación de partidas e supervisión de contas do Consello Escolar.
            </p>
          </div>
        </div>

        {/* Puntos destacados do sistema */}
        <div className="relative z-10 my-8 lg:my-0 space-y-3.5 max-w-md">
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-200">Conciliación Bancaria Exacta</h3>
              <p className="text-[11px] text-slate-400">Seguimento de saldo de funcionamento e comedor en tempo real.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
              <PieChart className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-200">Partidas e Orzamento Anual</h3>
              <p className="text-[11px] text-slate-400">Control estrito do gasto imputado segundo a normativa oficial.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-200">Informes para o Consello Escolar</h3>
              <p className="text-[11px] text-slate-400">Exportación automática de balances, estados de contas e xustificantes en PDF.</p>
            </div>
          </div>
        </div>

        {/* Pé de páxina do panel esquerdo */}
        <div className="relative z-10 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Consellería de Educación · Xunta de Galicia</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Servidor seguro
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PANELLO DEREITO: Formulario de Acceso Minimalista             */}
      {/* ============================================================ */}
      <div className="w-full lg:w-1/2 bg-slate-900/40 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {/* Caixa do Formulario */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Iniciar sesión</h2>
              <p className="text-xs text-slate-400 mt-1">
                Introduce o teu usuario e contrasinal para entrar no panel de xestión.
              </p>
            </div>

            {/* Alerta de erro se as credenciais fallan */}
            {state?.error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{state.error}</span>
              </div>
            )}

            <form action={formAction} className="space-y-4">
              {/* Campo Usuario / Correo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="email">
                  Correo electrónico / Usuario
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    defaultValue="luismartq@gmail.com"
                    placeholder="exemplo@correo.com"
                    autoComplete="email"
                    className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Campo Contrasinal */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="password">
                  Contrasinal de acceso
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="block w-full pl-10 pr-11 py-2.5 text-sm bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contrasinal' : 'Amosar contrasinal'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Botón de Enviar */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verificando credenciais...</span>
                    </>
                  ) : (
                    <>
                      <span>Acceder ao Sistema</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Aviso de Seguridade */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>Sesión cifrada con cookie HTTP-Only segura</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
