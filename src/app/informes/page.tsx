import Header from '@/components/Header';
import InformesView from '@/components/InformesView';
import { 
  getBankAccounts, 
  getBudgetPartidas, 
  getIncomeCategories, 
  getExpenseCategories, 
  getCurrentAcademicYear, 
  getAcademicYears,
  getCategoriesWithTotals 
} from '@/lib/queries';

export default async function InformesPage() {
  const currentYear = getCurrentAcademicYear();
  const years = getAcademicYears();
  const accounts = getBankAccounts();
  const partidas = getBudgetPartidas(currentYear.id);
  const incomeCats = getIncomeCategories();
  const expenseCats = getExpenseCategories();
  const { incomeWithTotals, expensesWithTotals } = getCategoriesWithTotals(currentYear.id);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        accounts={accounts}
        partidas={partidas}
        incomeCategories={incomeCats}
        expenseCategories={expenseCats}
        currentYear={currentYear}
        years={years}
        title="Informes & Rendición de Contas"
        subtitle="Memoria económica e liquidación orzamentaria para o Consello Escolar e a Administración"
      />

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none">
        <InformesView
          accounts={accounts}
          partidas={partidas}
          currentYear={currentYear}
          incomeWithTotals={incomeWithTotals}
          expensesWithTotals={expensesWithTotals}
        />
      </main>
    </div>
  );
}

