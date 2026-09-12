import Header from '@/components/Header';
import PartidasView from '@/components/PartidasView';
import { 
  getBankAccounts, 
  getBudgetPartidas, 
  getMovements, 
  getIncomeCategories, 
  getExpenseCategories, 
  getCurrentAcademicYear, 
  getAcademicYears 
} from '@/lib/queries';

export default async function PartidasPage() {
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
        title="Partidas Orzamentarias"
        subtitle="Control do orzamento anual, dotacións, ingresos e gastos imputados"
      />

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
        <PartidasView
          partidas={partidas}
          movements={movements}
          currentYearId={currentYear.id}
        />
      </main>
    </div>
  );
}

