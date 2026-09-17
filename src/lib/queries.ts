import { getDb } from './db';
import { 
  BankAccount, 
  AcademicYear, 
  BudgetPartida, 
  Category, 
  Movement, 
  DashboardStats,
  CrossYearMovement,
  CrossYearMovementsSummary
} from './types';

function toPlain<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export function getAcademicYears(): AcademicYear[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, name, is_current, start_date, end_date, initial_remanente, created_at
    FROM academic_years
    ORDER BY is_current DESC, id DESC
  `).all() as unknown as AcademicYear[];
  return toPlain(rows);
}

export function getCurrentAcademicYear(): AcademicYear {
  const db = getDb();
  const year = db.prepare(`
    SELECT id, name, is_current, start_date, end_date, initial_remanente, created_at
    FROM academic_years
    WHERE is_current = 1
    LIMIT 1
  `).get() as unknown as AcademicYear | undefined;

  if (!year) {
    const fallback = db.prepare(`SELECT * FROM academic_years ORDER BY id DESC LIMIT 1`).get() as unknown as AcademicYear;
    return toPlain(fallback);
  }
  return toPlain(year);
}

export function getBankAccounts(): BankAccount[] {
  const db = getDb();
  const accounts = db.prepare(`
    SELECT id, name, code, account_number, description, initial_balance, created_at
    FROM bank_accounts
    ORDER BY code ASC
  `).all() as unknown as BankAccount[];

  const mapped = accounts.map(acc => {
    const totals = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'INGRESO' THEN amount ELSE -amount END), 0) as netMovements,
        COALESCE(SUM(CASE WHEN is_reconciled = 1 THEN (CASE WHEN type = 'INGRESO' THEN amount ELSE -amount END) ELSE 0 END), 0) as netReconciled,
        COALESCE(SUM(CASE WHEN is_reconciled = 0 THEN 1 ELSE 0 END), 0) as pendingCount
      FROM movements
      WHERE bank_account_id = ?
    `).get(acc.id) as unknown as { netMovements: number; netReconciled: number; pendingCount: number };

    return {
      ...acc,
      current_balance: acc.initial_balance + totals.netMovements,
      reconciled_balance: acc.initial_balance + totals.netReconciled,
      pending_movements_count: totals.pendingCount
    };
  });

  return toPlain(mapped);
}

export function getBankAccountById(id: string): BankAccount | null {
  const db = getDb();
  const acc = db.prepare(`
    SELECT id, name, code, account_number, description, initial_balance, created_at
    FROM bank_accounts
    WHERE id = ?
  `).get(id) as unknown as BankAccount | undefined;

  if (!acc) return null;

  const totals = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'INGRESO' THEN amount ELSE -amount END), 0) as netMovements,
      COALESCE(SUM(CASE WHEN is_reconciled = 1 THEN (CASE WHEN type = 'INGRESO' THEN amount ELSE -amount END) ELSE 0 END), 0) as netReconciled,
      COALESCE(SUM(CASE WHEN is_reconciled = 0 THEN 1 ELSE 0 END), 0) as pendingCount
    FROM movements
    WHERE bank_account_id = ?
  `).get(acc.id) as unknown as { netMovements: number; netReconciled: number; pendingCount: number };

  return toPlain({
    ...acc,
    current_balance: acc.initial_balance + totals.netMovements,
    reconciled_balance: acc.initial_balance + totals.netReconciled,
    pending_movements_count: totals.pendingCount
  });
}

export function getBudgetPartidas(academicYearId?: string): BudgetPartida[] {
  const db = getDb();
  const yearId = academicYearId || getCurrentAcademicYear().id;

  const partidas = db.prepare(`
    SELECT id, academic_year_id, code, name, is_base, initial_budget, description, created_at
    FROM budget_partidas
    WHERE academic_year_id = ?
    ORDER BY is_base DESC, code ASC
  `).all(yearId) as unknown as BudgetPartida[];

  const mapped = partidas.map(p => {
    const totals = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'INGRESO' THEN amount ELSE 0 END), 0) as totalIncome,
        COALESCE(SUM(CASE WHEN type = 'GASTO' THEN amount ELSE 0 END), 0) as totalExpenses
      FROM movements
      WHERE partida_id = ?
    `).get(p.id) as unknown as { totalIncome: number; totalExpenses: number };

    const allocated_income = totals.totalIncome;
    const spent_amount = totals.totalExpenses;
    const available_balance = p.initial_budget + allocated_income - spent_amount;

    return {
      ...p,
      allocated_income,
      spent_amount,
      available_balance
    };
  });

  return toPlain(mapped);
}

export function getIncomeCategories(): Category[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, parent_id, code, name, is_group
    FROM income_categories
  `).all() as unknown as Category[];
  rows.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }));
  return toPlain(rows);
}

export function getExpenseCategories(): Category[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, parent_id, code, name, is_group
    FROM expense_categories
  `).all() as unknown as Category[];
  rows.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }));
  return toPlain(rows);
}

export interface MovementFilterParams {
  bankAccountId?: string;
  academicYearId?: string;
  isReconciled?: number; // 0 o 1
  type?: 'INGRESO' | 'GASTO';
  partidaId?: string;
  searchTerm?: string;
  includeImputedPartidas?: boolean;
}

export function getMovements(filters: MovementFilterParams = {}): Movement[] {
  const db = getDb();
  const yearId = filters.academicYearId || getCurrentAcademicYear().id;

  let query = `
    SELECT 
      m.id, m.bank_account_id, m.academic_year_id, m.date, m.type, m.concept,
      m.amount, m.partida_id, m.income_category_id, m.expense_category_id,
      m.is_reconciled, m.reconciled_date, m.reference_doc, m.notes,
      m.invoice_key, m.invoice_filename, m.invoice_mimetype, m.invoice_size,
      m.created_at,
      b.name as account_name, b.code as account_code,
      p.name as partida_name, p.academic_year_id as partida_year_id,
      COALESCE(ic.name, ec.name) as category_name,
      COALESCE(ic.code, ec.code) as category_code
    FROM movements m
    JOIN bank_accounts b ON m.bank_account_id = b.id
    LEFT JOIN budget_partidas p ON m.partida_id = p.id
    LEFT JOIN income_categories ic ON m.income_category_id = ic.id
    LEFT JOIN expense_categories ec ON m.expense_category_id = ec.id
  `;

  const params: (string | number)[] = [];

  if (filters.includeImputedPartidas) {
    query += ' WHERE (m.academic_year_id = ? OR m.partida_id IN (SELECT id FROM budget_partidas WHERE academic_year_id = ?))';
    params.push(yearId, yearId);
  } else {
    query += ' WHERE m.academic_year_id = ?';
    params.push(yearId);
  }

  if (filters.bankAccountId) {
    query += ' AND m.bank_account_id = ?';
    params.push(filters.bankAccountId);
  }

  if (filters.isReconciled !== undefined) {
    query += ' AND m.is_reconciled = ?';
    params.push(filters.isReconciled);
  }

  if (filters.type) {
    query += ' AND m.type = ?';
    params.push(filters.type);
  }

  if (filters.partidaId) {
    query += ' AND m.partida_id = ?';
    params.push(filters.partidaId);
  }

  if (filters.searchTerm) {
    query += ' AND (m.concept LIKE ? OR m.reference_doc LIKE ? OR m.notes LIKE ?)';
    const like = `%${filters.searchTerm}%`;
    params.push(like, like, like);
  }

  query += ' ORDER BY m.date DESC, m.created_at DESC';

  const rows = db.prepare(query).all(...params) as unknown as Movement[];
  return toPlain(rows);
}

export function getDashboardStats(academicYearId?: string): DashboardStats {
  const currentYear = academicYearId ? { id: academicYearId } : getCurrentAcademicYear();
  const accounts = getBankAccounts();
  const yearId = currentYear.id;

  const db = getDb();
  const totals = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'INGRESO' THEN amount ELSE 0 END), 0) as totalIncome,
      COALESCE(SUM(CASE WHEN type = 'GASTO' THEN amount ELSE 0 END), 0) as totalExpenses,
      COALESCE(SUM(CASE WHEN is_reconciled = 0 THEN 1 ELSE 0 END), 0) as pendingReconciliation
    FROM movements
    WHERE academic_year_id = ?
  `).get(yearId) as unknown as { totalIncome: number; totalExpenses: number; pendingReconciliation: number };

  const funcAcc = accounts.find(a => a.id === 'funcionamento');
  const comAcc = accounts.find(a => a.id === 'comedor');

  const totalBalance = accounts.reduce((acc, a) => acc + (a.current_balance || 0), 0);
  const recentMovements = getMovements({ academicYearId: yearId }).slice(0, 7);
  const partidasOverview = getBudgetPartidas(yearId);

  return toPlain({
    totalBalance,
    totalIncome: totals.totalIncome,
    totalExpenses: totals.totalExpenses,
    funcionamentoBalance: funcAcc?.current_balance || 0,
    comedorBalance: comAcc?.current_balance || 0,
    pendingReconciliationCount: totals.pendingReconciliation,
    recentMovements,
    partidasOverview
  });
}

export interface CategoryWithTotal extends Category {
  totalAmount: number;
  subcategories?: CategoryWithTotal[];
}

function buildCategoryTree(
  categories: Category[],
  amountsMap: Map<string, number>,
  parentId: string | null = null
): CategoryWithTotal[] {
  const directChildren = categories.filter(c => c.parent_id === parentId);

  return directChildren.map(cat => {
    const subcategories = buildCategoryTree(categories, amountsMap, cat.id);
    const directAmount = amountsMap.get(cat.id) || 0;
    const subTotal = subcategories.reduce((acc, sub) => acc + sub.totalAmount, 0);
    const totalAmount = directAmount + subTotal;

    return {
      ...cat,
      totalAmount,
      subcategories: subcategories.length > 0 ? subcategories : undefined
    };
  });
}

export function getCategoriesWithTotals(academicYearId?: string): {
  incomeWithTotals: CategoryWithTotal[];
  expensesWithTotals: CategoryWithTotal[];
} {
  const db = getDb();
  const yearId = academicYearId || getCurrentAcademicYear().id;

  const incomeCats = getIncomeCategories();
  const expenseCats = getExpenseCategories();

  // Get total income by category, attributed according to the partida's academic year if assigned
  const incomeTotals = db.prepare(`
    SELECT m.income_category_id, COALESCE(SUM(m.amount), 0) as total
    FROM movements m
    LEFT JOIN budget_partidas p ON m.partida_id = p.id
    WHERE COALESCE(p.academic_year_id, m.academic_year_id) = ? 
      AND m.type = 'INGRESO' 
      AND m.income_category_id IS NOT NULL
    GROUP BY m.income_category_id
  `).all(yearId) as unknown as { income_category_id: string; total: number }[];

  const incomeMap = new Map<string, number>();
  incomeTotals.forEach(row => incomeMap.set(row.income_category_id, row.total));

  // Category H: "Remanentes do ano anterior"
  // Esta categoría especial reflicte as dotacións iniciais consolidadas das partidas do ano (básicas e específicas)
  // e nunca procede dun movemento nas contas correntes bancarias.
  const allPartidasSum = db.prepare(`
    SELECT COALESCE(SUM(initial_budget), 0) as total
    FROM budget_partidas
    WHERE academic_year_id = ?
  `).get(yearId) as { total: number };

  const remanenteH = allPartidasSum?.total || 0;
  incomeMap.set('inc-h', remanenteH);

  // Get total expense by category, attributed according to the partida's academic year if assigned
  const expenseTotals = db.prepare(`
    SELECT m.expense_category_id, COALESCE(SUM(m.amount), 0) as total
    FROM movements m
    LEFT JOIN budget_partidas p ON m.partida_id = p.id
    WHERE COALESCE(p.academic_year_id, m.academic_year_id) = ? 
      AND m.type = 'GASTO' 
      AND m.expense_category_id IS NOT NULL
    GROUP BY m.expense_category_id
  `).all(yearId) as unknown as { expense_category_id: string; total: number }[];

  const expenseMap = new Map<string, number>();
  expenseTotals.forEach(row => expenseMap.set(row.expense_category_id, row.total));

  // Build recursive tree for income and expenses
  const incomeWithTotals = buildCategoryTree(incomeCats, incomeMap, null);
  const expensesWithTotals = buildCategoryTree(expenseCats, expenseMap, null);

  return toPlain({ incomeWithTotals, expensesWithTotals });
}

export function getCrossYearCategoryMovements(academicYearId?: string): CrossYearMovementsSummary {
  const db = getDb();
  const yearId = academicYearId || getCurrentAcademicYear().id;

  // 1. Movements recorded in this academic year but attributed to a partida of another year
  const attributedToOtherYears = db.prepare(`
    SELECT 
      m.id, m.date, m.type, m.concept, m.amount, m.bank_account_id,
      b.name as account_name,
      m.partida_id, p.name as partida_name, p.code as partida_code,
      m.academic_year_id as movement_year_id, y_m.name as movement_year_name,
      p.academic_year_id as partida_year_id, y_p.name as partida_year_name,
      COALESCE(ic.code, ec.code) as category_code,
      COALESCE(ic.name, ec.name) as category_name
    FROM movements m
    JOIN budget_partidas p ON m.partida_id = p.id
    JOIN bank_accounts b ON m.bank_account_id = b.id
    JOIN academic_years y_m ON m.academic_year_id = y_m.id
    JOIN academic_years y_p ON p.academic_year_id = y_p.id
    LEFT JOIN income_categories ic ON m.income_category_id = ic.id
    LEFT JOIN expense_categories ec ON m.expense_category_id = ec.id
    WHERE m.academic_year_id = ? AND p.academic_year_id != ?
    ORDER BY m.date DESC, m.created_at DESC
  `).all(yearId, yearId) as unknown as CrossYearMovement[];

  // 2. Movements recorded in another academic year but attributed to a partida of this year
  const attributedFromOtherYears = db.prepare(`
    SELECT 
      m.id, m.date, m.type, m.concept, m.amount, m.bank_account_id,
      b.name as account_name,
      m.partida_id, p.name as partida_name, p.code as partida_code,
      m.academic_year_id as movement_year_id, y_m.name as movement_year_name,
      p.academic_year_id as partida_year_id, y_p.name as partida_year_name,
      COALESCE(ic.code, ec.code) as category_code,
      COALESCE(ic.name, ec.name) as category_name
    FROM movements m
    JOIN budget_partidas p ON m.partida_id = p.id
    JOIN bank_accounts b ON m.bank_account_id = b.id
    JOIN academic_years y_m ON m.academic_year_id = y_m.id
    JOIN academic_years y_p ON p.academic_year_id = y_p.id
    LEFT JOIN income_categories ic ON m.income_category_id = ic.id
    LEFT JOIN expense_categories ec ON m.expense_category_id = ec.id
    WHERE m.academic_year_id != ? AND p.academic_year_id = ?
    ORDER BY m.date DESC, m.created_at DESC
  `).all(yearId, yearId) as unknown as CrossYearMovement[];

  return toPlain({
    attributedToOtherYears,
    attributedFromOtherYears
  });
}

export interface ComedorReportData {
  incomeCatA6: CategoryWithTotal | null;
  expenseCat14: CategoryWithTotal | null;
  totalIncomeComedor: number;
  totalExpenseComedor: number;
  netBalanceComedor: number;
}

export function getComedorReportData(academicYearId?: string): ComedorReportData {
  const db = getDb();
  const yearId = academicYearId || getCurrentAcademicYear().id;
  const { incomeWithTotals, expensesWithTotals } = getCategoriesWithTotals(yearId);

  // Find a.6: subcategory of 'a'
  const parentA = incomeWithTotals.find(c => c.code.toLowerCase() === 'a');
  const catA6Raw = parentA?.subcategories?.find(s => s.code.toLowerCase() === 'a.6') || null;

  // Find 14: root category of expenses
  const cat14 = expensesWithTotals.find(c => c.code === '14') || null;

  const comPartida = db.prepare(`
    SELECT initial_budget FROM budget_partidas 
    WHERE academic_year_id = ? AND is_base = 1 AND (code = 'PART-COM' OR name = 'Comedor') 
    LIMIT 1
  `).get(yearId) as { initial_budget: number } | undefined;
  const dotacionComedor = comPartida?.initial_budget || 0;

  let catA6: CategoryWithTotal | null = null;
  if (catA6Raw) {
    const subs = (catA6Raw.subcategories || []).map(s => {
      if (s.code === 'a.6.1') {
        return {
          ...s,
          totalAmount: s.totalAmount + dotacionComedor
        };
      }
      return s;
    });
    catA6 = {
      ...catA6Raw,
      subcategories: subs,
      totalAmount: subs.reduce((sum, s) => sum + s.totalAmount, 0)
    };
  }

  const totalIncomeComedor = catA6?.totalAmount || 0;
  const totalExpenseComedor = cat14?.totalAmount || 0;
  const netBalanceComedor = totalIncomeComedor - totalExpenseComedor;

  return toPlain({
    incomeCatA6: catA6,
    expenseCat14: cat14,
    totalIncomeComedor,
    totalExpenseComedor,
    netBalanceComedor
  });
}

