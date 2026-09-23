'use client';

import { useState, useRef, useEffect } from 'react';
import { Building2, Search, X, Check, ChevronDown } from 'lucide-react';
import { Supplier } from '@/lib/types';

interface SupplierComboboxProps {
  suppliers: Supplier[];
  selectedSupplierId: string | null;
  onSelectSupplier: (supplierId: string | null) => void;
  name?: string;
  placeholder?: string;
}

export default function SupplierCombobox({
  suppliers,
  selectedSupplierId,
  onSelectSupplier,
  name = 'supplier_id',
  placeholder = 'Buscar provedor por nome ou NIF/CIF...'
}: SupplierComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId) || null;

  // Filter suppliers by name or cif_nif
  const filteredSuppliers = suppliers.filter(s => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const matchName = s.name.toLowerCase().includes(q);
    const matchCif = s.cif_nif ? s.cif_nif.toLowerCase().includes(q) : false;
    return matchName || matchCif;
  });

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (supId: string | null) => {
    onSelectSupplier(supId);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectSupplier(null);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden input for standard Form submission */}
      <input type="hidden" name={name} value={selectedSupplierId || ''} />

      {selectedSupplier ? (
        /* Selected Supplier Card */
        <div className="flex items-center justify-between p-2.5 bg-indigo-50/70 border border-indigo-200/90 rounded-xl transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-indigo-600/10 text-indigo-700 flex items-center justify-center shrink-0">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-900 truncate">
                {selectedSupplier.name}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                {selectedSupplier.cif_nif && <span>NIF: {selectedSupplier.cif_nif}</span>}
                {selectedSupplier.phone && <span>· Tel: {selectedSupplier.phone}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="text-[11px] text-indigo-700 font-medium hover:underline px-1.5 py-0.5"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="h-6 w-6 rounded-md hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
              title="Quitar provedor"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Input Box with live search */
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full text-xs pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl divide-y divide-slate-100 text-xs">
          {/* Quick Clear option */}
          {selectedSupplierId && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full text-left px-3.5 py-2 hover:bg-rose-50/70 text-rose-600 font-medium flex items-center gap-2 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Sen provedor asociado (limpar)</span>
            </button>
          )}

          {filteredSuppliers.length === 0 ? (
            <div className="p-4 text-center text-slate-400">
              Non se atoparon provedores con &quot;{query}&quot;.
            </div>
          ) : (
            filteredSuppliers.map((s) => {
              const isSelected = s.id === selectedSupplierId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelect(s.id)}
                  className={`w-full text-left px-3.5 py-2.5 hover:bg-indigo-50/60 transition-colors flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-indigo-50/80 font-bold' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {s.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                      {s.cif_nif && <span>NIF: {s.cif_nif}</span>}
                      {s.postal_code && <span>CP: {s.postal_code}</span>}
                      {s.phone && <span>Tel: {s.phone}</span>}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

