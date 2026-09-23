'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Calendar,
  X,
  Check,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Receipt
} from 'lucide-react';
import { Supplier, Movement, AcademicYear } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
  getSupplierMovementsAction
} from '@/lib/actions';

interface ProveedoresViewProps {
  suppliers: Supplier[];
  currentYear: AcademicYear;
}

export default function ProveedoresView({ suppliers, currentYear }: ProveedoresViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplierForDetail, setSelectedSupplierForDetail] = useState<Supplier | null>(null);

  // Detail drawer / modal state
  const [detailMovements, setDetailMovements] = useState<Movement[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Transitions
  const [isPending, startTransition] = useTransition();

  // Statistics calculation
  const totalSuppliersCount = suppliers.length;
  const activeSuppliers = useMemo(() => {
    return suppliers.filter(s => (s.current_year_movements_count || 0) > 0);
  }, [suppliers]);
  const activeSuppliersCount = activeSuppliers.length;

  const totalCurrentYearExpenses = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.current_year_expenses || 0), 0);
  }, [suppliers]);

  const topSupplier = useMemo(() => {
    if (suppliers.length === 0) return null;
    const sorted = [...suppliers].sort((a, b) => (b.current_year_expenses || 0) - (a.current_year_expenses || 0));
    return sorted[0]?.current_year_expenses && sorted[0].current_year_expenses > 0 ? sorted[0] : null;
  }, [suppliers]);

  // Filtering suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      if (filterActiveOnly && (s.current_year_movements_count || 0) === 0) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesCif = s.cif_nif?.toLowerCase().includes(q) || false;
        const matchesEmail = s.email?.toLowerCase().includes(q) || false;
        const matchesPhone = s.phone?.toLowerCase().includes(q) || false;
        const matchesAddress = s.address?.toLowerCase().includes(q) || false;
        const matchesCp = s.postal_code?.toLowerCase().includes(q) || false;
        const matchesNotes = s.notes?.toLowerCase().includes(q) || false;
        return matchesName || matchesCif || matchesEmail || matchesPhone || matchesAddress || matchesCp || matchesNotes;
      }
      return true;
    });
  }, [suppliers, filterActiveOnly, searchQuery]);

  // Open detail view for supplier
  const handleOpenDetail = async (supplier: Supplier) => {
    setSelectedSupplierForDetail(supplier);
    setIsLoadingDetail(true);
    try {
      const data = await getSupplierMovementsAction(supplier.id, currentYear.id);
      if (data && data.movements) {
        setDetailMovements(data.movements);
      } else {
        setDetailMovements([]);
      }
    } catch (err) {
      console.error('Error fetching supplier movements:', err);
      setDetailMovements([]);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Suppliers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Provedores</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {totalSuppliersCount}
            </span>
            <span className="text-xs text-slate-500 ml-1.5">rexistrados</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Directorio da comunidade</span>
            <span className="text-blue-600 font-semibold">{activeSuppliersCount} activos no curso</span>
          </div>
        </div>

        {/* Active Suppliers this Year */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Activos en {currentYear.name}</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {activeSuppliersCount}
            </span>
            <span className="text-xs text-slate-500 ml-1.5">con facturas este ano</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Actividade do exercicio</span>
            <span className="font-semibold text-indigo-600">
              {totalSuppliersCount > 0 ? Math.round((activeSuppliersCount / totalSuppliersCount) * 100) : 0}% do total
            </span>
          </div>
        </div>

        {/* Total Expenses with Suppliers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gasto Total ({currentYear.name})</span>
            <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-700 tracking-tight">
              {formatCurrency(totalCurrentYearExpenses)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Suma de compras e subministros</span>
            <span className="text-rose-600 font-semibold">{currentYear.name}</span>
          </div>
        </div>

        {/* Top Supplier */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Maior Facturación</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 truncate">
            {topSupplier ? (
              <>
                <span className="text-lg font-black text-slate-900 tracking-tight block truncate" title={topSupplier.name}>
                  {topSupplier.name}
                </span>
                <span className="text-xs font-bold text-amber-600">
                  {formatCurrency(topSupplier.current_year_expenses || 0)}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-slate-400">Sen gastos no curso</span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Ano escolar actual</span>
          </div>
        </div>
      </div>

      {/* Action Banner & Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar provedor por nome, CIF, teléfono, email, dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-800"
          />
        </div>

        {/* Filters & Add Button */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Active filter toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilterActiveOnly(false)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                !filterActiveOnly
                  ? 'bg-white text-slate-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({totalSuppliersCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterActiveOnly(true)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filterActiveOnly
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Activos no curso ({activeSuppliersCount})
            </button>
          </div>

          {/* New Supplier Button */}
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Provedor</span>
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Provedor / Razón Social</th>
                <th className="px-5 py-3.5">NIF / CIF</th>
                <th className="px-5 py-3.5">Contacto</th>
                <th className="px-5 py-3.5">Dirección & CP</th>
                <th className="px-5 py-3.5 text-center">Movementos {currentYear.name}</th>
                <th className="px-5 py-3.5 text-right">Gasto {currentYear.name}</th>
                <th className="px-5 py-3.5 text-right">Accións</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <Building2 className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Non se atoparon provedores</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Modifique o termo de busca ou prema en "Novo Provedor" para engadilo.'
                        : 'Comece engadindo provedores habituais do centro.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => {
                  const hasMovementsThisYear = (s.current_year_movements_count || 0) > 0;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => handleOpenDetail(s)}
                      className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                    >
                      {/* Name & Notes */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-900 transition-colors flex items-center gap-2">
                          <span>{s.name}</span>
                        </div>
                        {s.notes && (
                          <p className="text-xs text-slate-400 line-clamp-1 italic mt-0.5" title={s.notes}>
                            {s.notes}
                          </p>
                        )}
                      </td>

                      {/* CIF/NIF */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {s.cif_nif ? (
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {s.cif_nif}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs italic">-</span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-3.5 text-xs text-slate-600" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          {s.phone && (
                            <a
                              href={`tel:${s.phone}`}
                              className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
                              title="Chamar por teléfono"
                            >
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{s.phone}</span>
                            </a>
                          )}
                          {s.email && (
                            <a
                              href={`mailto:${s.email}`}
                              className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 transition-colors"
                              title="Enviar correo electrónico"
                            >
                              <Mail className="h-3 w-3 text-indigo-500" />
                              <span className="truncate max-w-[180px]">{s.email}</span>
                            </a>
                          )}
                          {!s.phone && !s.email && <span className="text-slate-300 italic">-</span>}
                        </div>
                      </td>

                      {/* Address */}
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {s.address || s.postal_code ? (
                          <div className="flex items-start gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <span>{s.address || '-'}</span>
                              {s.postal_code && (
                                <span className="block text-[11px] text-slate-400 font-mono">CP: {s.postal_code}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">-</span>
                        )}
                      </td>

                      {/* Movements Count */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        {hasMovementsThisYear ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Receipt className="h-3 w-3" />
                            <span>{s.current_year_movements_count}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">0</span>
                        )}
                      </td>

                      {/* Active Year Expenses */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <span
                          className={`font-bold text-sm ${
                            (s.current_year_expenses || 0) > 0 ? 'text-rose-700' : 'text-slate-400'
                          }`}
                        >
                          {formatCurrency(s.current_year_expenses || 0)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(s)}
                            title="Ver estatísticas e facturas"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSupplier(s)}
                            title="Editar datos do provedor"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingSupplier(s)}
                            title="Eliminar provedor"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Supplier Modal */}
      {isCreateOpen && (
        <CreateSupplierModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />
      )}

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <EditSupplierModal
          supplier={editingSupplier}
          isOpen={!!editingSupplier}
          onClose={() => setEditingSupplier(null)}
        />
      )}

      {/* Delete Supplier Confirmation Modal */}
      {deletingSupplier && (
        <DeleteSupplierModal
          supplier={deletingSupplier}
          isOpen={!!deletingSupplier}
          onClose={() => setDeletingSupplier(null)}
        />
      )}

      {/* Supplier Detail & Movements Drawer/Modal */}
      {selectedSupplierForDetail && (
        <SupplierDetailModal
          supplier={selectedSupplierForDetail}
          currentYear={currentYear}
          movements={detailMovements}
          isLoading={isLoadingDetail}
          isOpen={!!selectedSupplierForDetail}
          onClose={() => setSelectedSupplierForDetail(null)}
          onEdit={() => {
            const s = selectedSupplierForDetail;
            setSelectedSupplierForDetail(null);
            setEditingSupplier(s);
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------
// Create Supplier Modal
// ----------------------------------------------------
function CreateSupplierModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await createSupplierAction(formData);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Erro ao gardar o provedor');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Engadir Novo Provedor</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Razón Social ou Nome <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ex: Distribucións Escolares Galegas S.L."
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              NIF / CIF
            </label>
            <input
              type="text"
              name="cif_nif"
              placeholder="Ex: B12345678"
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                placeholder="Rúa, número, andar..."
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Código Postal
              </label>
              <input
                type="text"
                name="postal_code"
                placeholder="Ex: 36201"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="Ex: 986 123 456"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                placeholder="administracion@empresa.com"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notas ou Observacións (Opcional)
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Detalles sobre subministracións, prezos acordados, etc."
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isPending ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  <span>Gardando...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Gardar Provedor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Edit Supplier Modal
// ----------------------------------------------------
function EditSupplierModal({
  supplier,
  isOpen,
  onClose
}: {
  supplier: Supplier;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await updateSupplierAction(formData);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Erro ao actualizar o provedor');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Editar Provedor</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={supplier.id} />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Razón Social ou Nome <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={supplier.name}
              placeholder="Ex: Distribucións Escolares Galegas S.L."
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              NIF / CIF
            </label>
            <input
              type="text"
              name="cif_nif"
              defaultValue={supplier.cif_nif || ''}
              placeholder="Ex: B12345678"
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                defaultValue={supplier.address || ''}
                placeholder="Rúa, número, andar..."
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Código Postal
              </label>
              <input
                type="text"
                name="postal_code"
                defaultValue={supplier.postal_code || ''}
                placeholder="Ex: 36201"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                name="phone"
                defaultValue={supplier.phone || ''}
                placeholder="Ex: 986 123 456"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                defaultValue={supplier.email || ''}
                placeholder="administracion@empresa.com"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notas ou Observacións (Opcional)
            </label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={supplier.notes || ''}
              placeholder="Detalles sobre subministracións, prezos acordados, etc."
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isPending ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Actualizar Provedor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Delete Supplier Modal
// ----------------------------------------------------
function DeleteSupplierModal({
  supplier,
  isOpen,
  onClose
}: {
  supplier: Supplier;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteSupplierAction(supplier.id);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Erro ao eliminar o provedor');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center gap-3 text-rose-600 mb-4">
          <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Eliminar Provedor</h3>
            <p className="text-xs text-slate-500">Esta acción retirará o provedor da base de datos</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 mb-4 space-y-1">
          <p>
            ¿Confirma que desexa eliminar a <strong>{supplier.name}</strong>?
          </p>
          {(supplier.current_year_movements_count || 0) > 0 && (
            <p className="text-amber-700 font-medium">
              Nota: Este provedor ten movementos bancarios asociados. Os movementos manteranse rexistrados nas contas sen alteración de importes, pero a vinculación co provedor quedará sen asignar.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {isPending ? 'Eliminando...' : 'Eliminar Definitivamente'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Supplier Detail & Movements Drawer/Modal
// ----------------------------------------------------
function SupplierDetailModal({
  supplier,
  currentYear,
  movements,
  isLoading,
  isOpen,
  onClose,
  onEdit
}: {
  supplier: Supplier;
  currentYear: AcademicYear;
  movements: Movement[];
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-indigo-400" />
              <h2 className="text-xl font-bold">{supplier.name}</h2>
              {supplier.cif_nif && (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/20">
                  {supplier.cif_nif}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-300 flex-wrap">
              {supplier.phone && (
                <a href={`tel:${supplier.phone}`} className="flex items-center gap-1 hover:text-white transition-colors">
                  <Phone className="h-3.5 w-3.5 text-indigo-300" />
                  <span>{supplier.phone}</span>
                </a>
              )}
              {supplier.email && (
                <a href={`mailto:${supplier.email}`} className="flex items-center gap-1 hover:text-white transition-colors">
                  <Mail className="h-3.5 w-3.5 text-indigo-300" />
                  <span>{supplier.email}</span>
                </a>
              )}
              {supplier.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-indigo-300" />
                  <span>{supplier.address}{supplier.postal_code ? ` (CP ${supplier.postal_code})` : ''}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Editar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Gasto Curso {currentYear.name}
              </span>
              <span className="text-xl font-black text-rose-700 mt-1 block">
                {formatCurrency(supplier.current_year_expenses || 0)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {supplier.current_year_movements_count || 0} facturas / compras
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Ingresos Curso {currentYear.name}
              </span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">
                {formatCurrency(supplier.current_year_income || 0)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Abonos ou devolucións
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Histórico Acumulado
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatCurrency(supplier.all_time_expenses || 0)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Todos os exercicios escolares
              </span>
            </div>
          </div>

          {supplier.notes && (
            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-amber-900">
              <strong className="font-semibold block mb-0.5 text-amber-950">Observacións:</strong>
              {supplier.notes}
            </div>
          )}

          {/* Movements & Invoices Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-indigo-600" />
                <span>Movementos e Facturas Rexistradas ({currentYear.name})</span>
              </h3>
              <span className="text-xs text-slate-500">
                {movements.length} {movements.length === 1 ? 'movemento' : 'movementos'}
              </span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-slate-400">
                <Clock className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-2" />
                <p className="text-xs font-semibold">Cargando movementos do provedor...</p>
              </div>
            ) : movements.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400">
                <p className="text-xs font-semibold text-slate-600">Non hai movementos rexistrados neste curso escolar</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ao crear ou editar movementos bancarios, pode vincular este provedor no selector correspondente.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Data</th>
                      <th className="px-4 py-2.5">Conta</th>
                      <th className="px-4 py-2.5">Concepto</th>
                      <th className="px-4 py-2.5">Partida / Categoría</th>
                      <th className="px-4 py-2.5 text-center">Factura</th>
                      <th className="px-4 py-2.5 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-600 whitespace-nowrap">
                          {formatDate(m.date)}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              m.bank_account_id === 'comedor'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {m.bank_account_id === 'comedor' ? 'COMEDOR' : 'FUNCIONAMENTO'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-slate-900">{m.concept}</div>
                          {m.reference_doc && (
                            <span className="text-slate-400 font-mono text-[10px]">
                              Doc: {m.reference_doc}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {m.partida_name && (
                            <span className="font-medium text-indigo-700 block">{m.partida_name}</span>
                          )}
                          {m.category_name && (
                            <span className="text-[11px] text-slate-500">
                              {m.category_code}.- {m.category_name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                          {m.invoice_key ? (
                            <a
                              href={`/api/movements/${m.id}/invoice?v=${encodeURIComponent(m.invoice_key)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-semibold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2 py-0.5 rounded-md transition-colors"
                              title={`Ver factura adxunta: ${m.invoice_filename || 'Descargar'}`}
                            >
                              <FileText className="h-3 w-3 text-indigo-600" />
                              <span>Factura</span>
                            </a>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <span
                            className={`font-bold text-xs ${
                              m.type === 'INGRESO' ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {m.type === 'INGRESO' ? '+' : '-'}{formatCurrency(m.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
          >
            Pechar
          </button>
        </div>
      </div>
    </div>
  );
}

