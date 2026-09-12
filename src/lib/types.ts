export interface BankAccount {
  id: string;
  name: string;
  code: string;
  account_number: string;
  description: string | null;
  initial_balance: number;
  current_balance?: number;
  reconciled_balance?: number;
  pending_movements_count?: number;
  created_at: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  is_current: number;
  start_date: string | null;
  end_date: string | null;
  initial_remanente?: number;
  created_at: string;
}

export interface BudgetPartida {
  id: string;
  academic_year_id: string;
  code: string;
  name: string;
  is_base: number; // 1 = base (Funcionamento o Comedor), 0 = extra
  initial_budget: number;
  allocated_income?: number;
  spent_amount?: number;
  available_balance?: number;
  description: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  parent_id: string | null;
  code: string;
  name: string;
  is_group: number;
}

export interface Movement {
  id: string;
  bank_account_id: string;
  academic_year_id: string;
  date: string;
  type: 'INGRESO' | 'GASTO';
  concept: string;
  amount: number;
  partida_id: string | null;
  income_category_id: string | null;
  expense_category_id: string | null;
  is_reconciled: number; // 0 o 1
  reconciled_date: string | null;
  reference_doc: string | null;
  notes: string | null;
  created_at: string;
  
  // Joined fields for display
  account_name?: string;
  account_code?: string;
  partida_name?: string;
  category_name?: string;
  category_code?: string;
}

export interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  funcionamentoBalance: number;
  comedorBalance: number;
  pendingReconciliationCount: number;
  recentMovements: Movement[];
  partidasOverview: BudgetPartida[];
}

