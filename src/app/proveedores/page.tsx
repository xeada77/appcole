import Header from '@/components/Header';
import ProveedoresView from '@/components/ProveedoresView';
import { 
  getBankAccounts, 
  getBudgetPartidas, 
  getIncomeCategories, 
  getExpenseCategories, 
  getCurrentAcademicYear, 
  getAcademicYears,
  getSuppliers
} from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function ProveedoresPage() {
  const currentYear = getCurrentAcademicYear();
  const years = getAcademicYears();
  const accounts = getBankAccounts();
  const partidas = getBudgetPartidas(currentYear.id);
  const incomeCats = getIncomeCategories();
  const expenseCats = getExpenseCategories();
  const suppliers = getSuppliers(currentYear.id);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        accounts={accounts}
        partidas={partidas}
        incomeCategories={incomeCats}
        expenseCategories={expenseCats}
        currentYear={currentYear}
        years={years}
        suppliers={suppliers}
        title="Xestión de Provedores"
        subtitle="Directorio de empresas, contactos, histórico de gastos e facturación"
      />

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
        <ProveedoresView
          suppliers={suppliers}
          currentYear={currentYear}
        />
      </main>
    </div>
  );
}

