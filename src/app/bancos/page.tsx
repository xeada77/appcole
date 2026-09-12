import Header from '@/components/Header';
import BankMovementsView from '@/components/BankMovementsView';
import { 
  getBankAccounts, 
  getMovements, 
  getBudgetPartidas, 
  getIncomeCategories, 
  getExpenseCategories, 
  getCurrentAcademicYear, 
  getAcademicYears 
} from '@/lib/queries';

export default async function BancosPage({
  searchParams
}: {
  searchParams: Promise<{ conta?: string }>;
}) {
  const { conta } = await searchParams;
  const currentYear = getCurrentAcademicYear();
  const years = getAcademicYears();
  const accounts = getBankAccounts();
  const partidas = getBudgetPartidas(currentYear.id);
  const incomeCats = getIncomeCategories();
  const expenseCats = getExpenseCategories();
  const movements = getMovements({ academicYearId: currentYear.id });

  return (
    <div className="flex-1 flex flex-col">
      <Header
        accounts={accounts}
        partidas={partidas}
        incomeCategories={incomeCats}
        expenseCategories={expenseCats}
        currentYear={currentYear}
        years={years}
        title="Contas Bancarias & Conciliación"
        subtitle="Xestión de ingresos, gastos e verificación con extractos bancarios"
      />

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
        <BankMovementsView
          accounts={accounts}
          movements={movements}
          partidas={partidas}
          incomeCategories={incomeCats}
          expenseCategories={expenseCats}
          currentYear={currentYear}
          years={years}
          initialAccountFilter={conta}
        />
      </main>
    </div>
  );
}
