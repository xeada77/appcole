'use client';

import { useState, useMemo } from 'react';
import {
  Building,
  Building2,
  Utensils,
  Search,

  ArrowDownRight,
  ArrowUpRight,
  Printer,
  ShieldCheck,
  Pencil,
 
  FileText
} from 'lucide-react';
import { BankAccount, Movement, BudgetPartida, Category, AcademicYear, Supplier } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import ReconciliationButton from './ReconciliationButton';
import DeleteMovementButton from './DeleteMovementButton';
import NewMovementModal from './NewMovementModal';
import EditMovementModal from './EditMovementModal';
import YearSelector from './YearSelector';

interface BankMovementsViewProps {
  accounts: BankAccount[];
  movements: Movement[];
  partidas: BudgetPartida[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  currentYear: AcademicYear;
  years: AcademicYear[];
  suppliers?: Supplier[];
  initialAccountFilter?: string;
}

export default function BankMovementsView({
  accounts,
  movements,
  partidas,
  incomeCategories,
  expenseCategories,
  currentYear,
  years,
  suppliers = [],
  initialAccountFilter
}: BankMovementsViewProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialAccountFilter || 'all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'reconciled' | 'pending'>('all');
  const [filterType, setFilterType] = useState<'all' | 'INGRESO' | 'GASTO'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);

  const funcAcc = accounts.find(a => a.id === 'funcionamento');
  const comAcc = accounts.find(a => a.id === 'comedor');

  // Dynamic register numbers calculation (e.g. 01/26F, 01/26C)
  const registerMap = useMemo(() => {
    // Sort chronologically ascending (oldest first)
    const sorted = [...movements].sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      const createdCmp = (a.created_at || '').localeCompare(b.created_at || '');
      if (createdCmp !== 0) return createdCmp;
      return a.id.localeCompare(b.id);
    });

    const counters: Record<string, number> = {};
    const map = new Map<string, string>();

    for (const mov of sorted) {
      const accSuffix = mov.bank_account_id === 'comedor' ? 'C' : 'F';
      const rawYear = mov.academic_year_id || (mov.date ? mov.date.slice(0, 4) : currentYear.id);
      const yearStr = rawYear.slice(-2);
      const key = `${accSuffix}-${yearStr}`;

      counters[key] = (counters[key] || 0) + 1;
      const seqStr = String(counters[key]).padStart(2, '0');
      const reg = `${seqStr}/${yearStr}${accSuffix}`;
      map.set(mov.id, reg);
    }

    return map;
  }, [movements, currentYear.id]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      // Account filter
      if (selectedAccountId !== 'all' && m.bank_account_id !== selectedAccountId) {
        return false;
      }
      // Status filter
      if (filterStatus === 'reconciled' && m.is_reconciled !== 1) return false;
      if (filterStatus === 'pending' && m.is_reconciled !== 0) return false;
      // Type filter
      if (filterType !== 'all' && m.type !== filterType) return false;
      // Search term
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const regNumber = registerMap.get(m.id)?.toLowerCase() || '';
        const matchesReg = regNumber.includes(query);
        const matchesConcept = m.concept.toLowerCase().includes(query);
        const matchesDoc = m.reference_doc?.toLowerCase().includes(query) || false;
        const matchesNotes = m.notes?.toLowerCase().includes(query) || false;
        const matchesCat = m.category_name?.toLowerCase().includes(query) || false;
        const matchesSupplier = m.supplier_name?.toLowerCase().includes(query) || m.supplier_cif?.toLowerCase().includes(query) || false;
        if (!matchesReg && !matchesConcept && !matchesDoc && !matchesNotes && !matchesCat && !matchesSupplier) {
          return false;
        }
      }
      return true;
    });
  }, [movements, selectedAccountId, filterStatus, filterType, searchQuery, registerMap]);

  // Current active account details (if single account selected)
  const currentAccount = accounts.find(a => a.id === selectedAccountId);

  // Reconciliation summary calculations for current view
  const currentTotalBalance = selectedAccountId === 'all'
    ? accounts.reduce((s, a) => s + (a.current_balance || 0), 0)
    : (currentAccount?.current_balance || 0);

  const currentReconciledBalance = selectedAccountId === 'all'
    ? accounts.reduce((s, a) => s + (a.reconciled_balance || 0), 0)
    : (currentAccount?.reconciled_balance || 0);

  const pendingDiff = currentTotalBalance - currentReconciledBalance;
  const pendingCount = selectedAccountId === 'all'
    ? accounts.reduce((s, a) => s + (a.pending_movements_count || 0), 0)
    : (currentAccount?.pending_movements_count || 0);

  return (
    <div className="space-y-6">
      {/* Account Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tab: All Accounts */}
        <button
          onClick={() => setSelectedAccountId('all')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${selectedAccountId === 'all'
            ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
            : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
            }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Visión Conxunta</span>
            <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded font-mono">2 CONTAS</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(accounts.reduce((s, a) => s + (a.current_balance || 0), 0))}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Conciliado: {formatCurrency(accounts.reduce((s, a) => s + (a.reconciled_balance || 0), 0))}</span>
            {pendingCount > 0 ? (
              <span className="text-amber-600 font-semibold">{pendingCount} pendentes</span>
            ) : (
              <span className="text-emerald-600 font-semibold">Conciliadas</span>
            )}
          </div>
        </button>

        {/* Tab: Funcionamento */}
        <button
          onClick={() => setSelectedAccountId('funcionamento')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${selectedAccountId === 'funcionamento'
            ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
            : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
            }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <Building className="h-4 w-4 text-blue-600" /> Funcionamento
            </span>
            <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-bold">FUNC</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(funcAcc?.current_balance || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Conciliado: {formatCurrency(funcAcc?.reconciled_balance || 0)}</span>
            {(funcAcc?.pending_movements_count || 0) > 0 ? (
              <span className="text-amber-600 font-semibold">{funcAcc?.pending_movements_count} pendentes</span>
            ) : (
              <span className="text-emerald-600 font-semibold">Conciliada</span>
            )}
          </div>
        </button>

        {/* Tab: Comedor */}
        <button
          onClick={() => setSelectedAccountId('comedor')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${selectedAccountId === 'comedor'
            ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
            : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
            }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <Utensils className="h-4 w-4 text-emerald-600" /> Comedor
            </span>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-bold">COM</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(comAcc?.current_balance || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Conciliado: {formatCurrency(comAcc?.reconciled_balance || 0)}</span>
            {(comAcc?.pending_movements_count || 0) > 0 ? (
              <span className="text-amber-600 font-semibold">{comAcc?.pending_movements_count} pendentes</span>
            ) : (
              <span className="text-emerald-600 font-semibold">Conciliada</span>
            )}
          </div>
        </button>
      </div>

      {/* Account IBAN & Conciliation Status Panel */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-15 w-15 text-indigo-400" />
                <h2 className="text-lg font-bold">
                  Conciliación Bancaria: {selectedAccountId === 'all' ? 'Consolidado' : currentAccount?.name}
                </h2>
              </div>
              {/* <YearSelector currentYear={currentYear} years={years} variant="header" /> */}
            </div>
            {currentAccount && (
              <p className="text-xs text-slate-300 mt-1 font-mono">
                IBAN: <span className="text-white font-semibold">{currentAccount.account_number}</span>
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Contén os movementos contables introducidos cos extractos remitidos pola entidade bancaria.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-2.5 border border-white/10">
              <span className="text-[11px] text-slate-300 block uppercase font-medium">Saldo nos Libros (Contable)</span>
              <span className="text-xl font-black text-white">{formatCurrency(currentTotalBalance)}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-2.5 border border-white/10">
              <span className="text-[11px] text-slate-300 block uppercase font-medium">Saldo no Extracto Bancario</span>
              <span className="text-xl font-black text-emerald-400">{formatCurrency(currentReconciledBalance)}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-2.5 border border-white/10">
              <span className="text-[11px] text-slate-300 block uppercase font-medium">Diferenza Pendente</span>
              <span className={`text-xl font-black ${Math.abs(pendingDiff) > 0.001 ? 'text-amber-400' : 'text-slate-300'}`}>
                {formatCurrency(pendingDiff)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por rexistro (ex: 01/26F), concepto, Nº factura, notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-800"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-xs font-medium rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas as conciliacións</option>
            <option value="pending">Só Pendentes ({pendingCount})</option>
            <option value="reconciled">Só Conciliados</option>
          </select>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-xs font-medium rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="INGRESO">Só Ingresos (+)</option>
            <option value="GASTO">Só Gastos (-)</option>
          </select>

          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
            title="Imprimir extracto de conciliación"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir</span>
          </button>

          {/* Quick Novo Movemento */}
          <NewMovementModal
            accounts={accounts}
            partidas={partidas}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            currentYearId={currentYear.id}
            years={years}
          />
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="w-full">
            <h3 className="text-base font-bold text-slate-900 flex justify-between items-center gap-2">
              <span>Rexistro de Movementos Bancarios e Conciliación</span>
              <span className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                {currentYear.name}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mostrando {filteredMovements.length} de {movements.length} movementos. Pode editar calquera movemento premendo no botón <strong>Editar</strong> ou facendo <strong>dobre clic</strong> na fila.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-center" title="Número de Rexistro">Reg.</th>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Conta</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Concepto & Ref.</th>
                <th className="px-5 py-3">Partida / Categoría</th>
                <th className="px-5 py-3 text-right">Importe</th>
                <th className="px-5 py-3 text-center">Conciliación</th>
                <th className="px-5 py-3 text-right">Accións</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-400">
                    <p className="font-medium text-slate-600">Non se atoparon movementos cos filtros actuais.</p>
                    <p className="text-xs text-slate-400 mt-1">Probe a cambiar os criterios de busca ou engada un novo movemento.</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => (
                  <tr
                    key={mov.id}
                    onDoubleClick={() => setEditingMovement(mov)}
                    title="Faga dobre clic para editar este movemento"
                    className="hover:bg-indigo-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${
                        mov.bank_account_id === 'comedor'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {registerMap.get(mov.id) || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-600 whitespace-nowrap text-xs">
                      {formatDate(mov.date)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${mov.bank_account_id === 'comedor'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                        }`}>
                        {mov.bank_account_id === 'comedor' ? 'COMEDOR' : 'FUNCIONAMENTO'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {mov.type === 'INGRESO' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                          <ArrowUpRight className="h-3.5 w-3.5" /> Ingreso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 text-xs font-semibold">
                          <ArrowDownRight className="h-3.5 w-3.5" /> Gasto
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-900 transition-colors">
                        {mov.concept}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {mov.supplier_name && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] text-blue-800 font-medium bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 rounded-md"
                            title={`Provedor: ${mov.supplier_name}${mov.supplier_cif ? ` (${mov.supplier_cif})` : ''}`}
                          >
                            <Building2 className="h-3 w-3 text-blue-600" />
                            <span>{mov.supplier_name}</span>
                          </span>
                        )}
                        {mov.reference_doc && (
                          <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.2 rounded">
                            Doc: {mov.reference_doc}
                          </span>
                        )}
                        {mov.invoice_key && (
                          <a
                            href={`/api/movements/${mov.id}/invoice?v=${encodeURIComponent(mov.invoice_key)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-semibold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2 py-0.5 rounded-md transition-colors"
                            title={`Ver factura adxunta: ${mov.invoice_filename || 'Descargar'}`}
                          >
                            <FileText className="h-3 w-3 text-indigo-600" />
                            <span>Factura</span>
                          </a>
                        )}
                        {mov.notes && (
                          <span className="text-[11px] text-slate-400 italic">
                            {mov.notes}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {mov.partida_name && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="block font-medium text-indigo-700">{mov.partida_name}</span>
                          {mov.partida_year_id && mov.partida_year_id !== mov.academic_year_id && (
                            <span
                              className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200"
                              title={`Movemento imputado á partida do ano ${mov.partida_year_id}`}
                            >
                              Ano {mov.partida_year_id}
                            </span>
                          )}
                        </div>
                      )}
                      {mov.category_name && (
                        <span className="block text-[11px] text-slate-500">
                          {mov.category_code}.- {mov.category_name}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <span className={`font-bold text-sm ${mov.type === 'INGRESO' ? 'text-emerald-600' : 'text-rose-700'
                        }`}>
                        {mov.type === 'INGRESO' ? '+' : '-'}{formatCurrency(mov.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <ReconciliationButton
                        movementId={mov.id}
                        isReconciled={mov.is_reconciled}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingMovement(mov)}
                          title="Editar movemento"
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <DeleteMovementButton
                          movementId={mov.id}
                          concept={mov.concept}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Movement Modal */}
      {editingMovement && (
        <EditMovementModal
          movement={editingMovement}
          accounts={accounts}
          partidas={partidas}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          years={years}
          suppliers={suppliers}
          isOpen={!!editingMovement}
          onClose={() => setEditingMovement(null)}
        />
      )}
    </div>
  );
}
