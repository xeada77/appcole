import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { hashPassword } from './auth-crypto';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'appcole.db');

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    initSchema(dbInstance);

    // Iniciar a tarefa automática de copia de seguridade en segundo plano
    setTimeout(async () => {
      try {
        const { runAutomaticDailyBackup } = await import('./backup');
        runAutomaticDailyBackup();
        // Comprobación periódica cada 6 horas mentres o servidor estea activo
        setInterval(() => {
          try {
            runAutomaticDailyBackup();
          } catch {}
        }, 6 * 60 * 60 * 1000);
      } catch (err) {
        console.error('Erro ao inicializar tarefa de copia automática:', err);
      }
    }, 1500);
  }
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      account_number TEXT NOT NULL,
      description TEXT,
      initial_balance REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS academic_years (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_current INTEGER NOT NULL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      initial_remanente REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budget_partidas (
      id TEXT PRIMARY KEY,
      academic_year_id TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      is_base INTEGER NOT NULL DEFAULT 0,
      initial_budget REAL NOT NULL DEFAULT 0,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS income_categories (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      is_group INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES income_categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expense_categories (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      is_group INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES expense_categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS movements (
      id TEXT PRIMARY KEY,
      bank_account_id TEXT NOT NULL,
      academic_year_id TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('INGRESO', 'GASTO')),
      concept TEXT NOT NULL,
      amount REAL NOT NULL,
      partida_id TEXT,
      income_category_id TEXT,
      expense_category_id TEXT,
      is_reconciled INTEGER NOT NULL DEFAULT 0,
      reconciled_date TEXT,
      reference_doc TEXT,
      notes TEXT,
      invoice_key TEXT,
      invoice_filename TEXT,
      invoice_mimetype TEXT,
      invoice_size INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE RESTRICT,
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
      FOREIGN KEY (partida_id) REFERENCES budget_partidas(id) ON DELETE SET NULL,
      FOREIGN KEY (income_category_id) REFERENCES income_categories(id) ON DELETE SET NULL,
      FOREIGN KEY (expense_category_id) REFERENCES expense_categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cif_nif TEXT,
      address TEXT,
      postal_code TEXT,
      email TEXT,
      phone TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT
    );
  `);

  // Safe migration for existing databases
  try {
    db.exec('ALTER TABLE academic_years ADD COLUMN initial_remanente REAL NOT NULL DEFAULT 0;');
  } catch {
    // Column already exists
  }

  // Safe migration for movement invoice columns
  try { db.exec('ALTER TABLE movements ADD COLUMN invoice_key TEXT;'); } catch {}
  try { db.exec('ALTER TABLE movements ADD COLUMN invoice_filename TEXT;'); } catch {}
  try { db.exec('ALTER TABLE movements ADD COLUMN invoice_mimetype TEXT;'); } catch {}
  try { db.exec('ALTER TABLE movements ADD COLUMN invoice_size INTEGER;'); } catch {}

  // Safe migration for supplier in movements
  try {
    db.exec('ALTER TABLE movements ADD COLUMN supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL;');
  } catch {}
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_movements_supplier_id ON movements(supplier_id);');
  } catch {}

  // Safe migration: Subcategorías de Comedor Escolar (Ingresos a.6 e Gastos 14)
  try {
    // Actualizar grupos raiz a is_group = 1
    db.prepare(`UPDATE income_categories SET is_group = 1 WHERE id = 'inc-a.6'`).run();
    db.prepare(`UPDATE expense_categories SET is_group = 1 WHERE id = 'exp-14'`).run();

    const insertIncCat = db.prepare(`
      INSERT INTO income_categories (id, parent_id, code, name, is_group)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET parent_id=excluded.parent_id, code=excluded.code, name=excluded.name, is_group=excluded.is_group
    `);

    const incomeSubs = [
      { id: 'inc-a.6.1', parent_id: 'inc-a.6', code: 'a.6.1', name: 'Remanente incorporado', is_group: 0 },
      { id: 'inc-a.6.2', parent_id: 'inc-a.6', code: 'a.6.2', name: 'Prezo do servizo', is_group: 0 },
      { id: 'inc-a.6.3', parent_id: 'inc-a.6', code: 'a.6.3', name: 'Ingreso da Conselleria de EOU', is_group: 0 },
      { id: 'inc-a.6.4', parent_id: 'inc-a.6', code: 'a.6.4', name: 'Recursos complementarios', is_group: 0 },
      { id: 'inc-a.6.5', parent_id: 'inc-a.6', code: 'a.6.5', name: 'Intereses da conta', is_group: 0 },
    ];
    for (const cat of incomeSubs) {
      insertIncCat.run(cat.id, cat.parent_id, cat.code, cat.name, cat.is_group);
    }

    const insertExpCat = db.prepare(`
      INSERT INTO expense_categories (id, parent_id, code, name, is_group)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET parent_id=excluded.parent_id, code=excluded.code, name=excluded.name, is_group=excluded.is_group
    `);

    const expenseSubs = [
      { id: 'exp-14.1', parent_id: 'exp-14', code: '14.1', name: 'Adquisicións', is_group: 0 },
      { id: 'exp-14.2', parent_id: 'exp-14', code: '14.2', name: 'Materiais', is_group: 1 },
      { id: 'exp-14.2.1', parent_id: 'exp-14.2', code: '14.2.1', name: 'Servilletas-Manteis', is_group: 0 },
      { id: 'exp-14.2.2', parent_id: 'exp-14.2', code: '14.2.2', name: 'Produtos de limpeza', is_group: 0 },
      { id: 'exp-14.2.3', parent_id: 'exp-14.2', code: '14.2.3', name: 'Panos e roupa de cocina', is_group: 0 },
      { id: 'exp-14.2.4', parent_id: 'exp-14.2', code: '14.2.4', name: 'Menaxe de cocina e comedor', is_group: 0 },
      { id: 'exp-14.3', parent_id: 'exp-14', code: '14.3', name: 'Subministracións', is_group: 1 },
      { id: 'exp-14.3.1', parent_id: 'exp-14.3', code: '14.3.1', name: 'Compra de alimentos', is_group: 0 },
      { id: 'exp-14.3.2', parent_id: 'exp-14.3', code: '14.3.2', name: 'Enerxia electrica', is_group: 0 },
      { id: 'exp-14.3.3', parent_id: 'exp-14.3', code: '14.3.3', name: 'Gas propano', is_group: 0 },
      { id: 'exp-14.4', parent_id: 'exp-14', code: '14.4', name: 'Gastos diversos', is_group: 0 },
      { id: 'exp-14.5', parent_id: 'exp-14', code: '14.5', name: 'Traballos', is_group: 0 },
    ];
    for (const cat of expenseSubs) {
      insertExpCat.run(cat.id, cat.parent_id, cat.code, cat.name, cat.is_group);
    }

    // Actualizar movementos de exemplo existentes se aínda tiñan categorías xenéricas
    db.prepare(`UPDATE movements SET income_category_id = 'inc-a.6.3' WHERE id = 'mov-006' AND income_category_id = 'inc-a.6'`).run();
    db.prepare(`UPDATE movements SET expense_category_id = 'exp-14.3.1' WHERE id = 'mov-008' AND expense_category_id = 'exp-14'`).run();
    db.prepare(`UPDATE movements SET expense_category_id = 'exp-14.2.4' WHERE id = 'mov-009' AND expense_category_id = 'exp-14'`).run();
  } catch (err) {
    console.error('Erro na migración de subcategorías de comedor:', err);
  }

  seedInitialData(db);

  // Sync initial_remanente for any existing years from base partidas
  try {
    db.exec(`
      UPDATE academic_years
      SET initial_remanente = (
        SELECT COALESCE(SUM(initial_budget), 0)
        FROM budget_partidas
        WHERE budget_partidas.academic_year_id = academic_years.id AND budget_partidas.is_base = 1
      )
      WHERE initial_remanente = 0 AND EXISTS (
        SELECT 1 FROM budget_partidas WHERE budget_partidas.academic_year_id = academic_years.id AND budget_partidas.is_base = 1
      );
    `);
  } catch {
    // Ignore migration sync errors
  }
}

function seedInitialData(db: DatabaseSync) {
  // Check if bank accounts exist
  const existingAccounts = db.prepare('SELECT COUNT(*) as count FROM bank_accounts').get() as { count: number };
  if (existingAccounts.count === 0) {
    const insertAccount = db.prepare(`
      INSERT INTO bank_accounts (id, name, code, account_number, description, initial_balance)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertAccount.run(
      'funcionamento',
      'Conta de Funcionamento',
      'FUNC',
      'ES82 2080 0300 1234 5678 9012',
      'Conta principal para gastos operativos, subministracións e mantemento do centro',
      15420.50
    );
    insertAccount.run(
      'comedor',
      'Conta de Comedor',
      'COM',
      'ES45 2080 0300 9876 5432 1098',
      'Conta específica para xestión de comedores escolares, menús e achegas das familias',
      6850.00
    );
  }

  // Check academic years (Anos naturais)
  const existingYears = db.prepare('SELECT COUNT(*) as count FROM academic_years').get() as { count: number };
  if (existingYears.count === 0) {
    const insertYear = db.prepare(`
      INSERT INTO academic_years (id, name, is_current, start_date, end_date, initial_remanente)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertYear.run('2026', 'Ano 2026', 1, '2026-01-01', '2026-12-31', 46500.00);
    insertYear.run('2025', 'Ano 2025', 0, '2025-01-01', '2025-12-31', 42000.00);
  }

  // Check base and custom partidas for 2026
  const existingPartidas = db.prepare('SELECT COUNT(*) as count FROM budget_partidas').get() as { count: number };
  if (existingPartidas.count === 0) {
    const insertPartida = db.prepare(`
      INSERT INTO budget_partidas (id, academic_year_id, code, name, is_base, initial_budget, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    // Base Partidas
    insertPartida.run('part-func-2026', '2026', 'PART-FUNC', 'Funcionamento', 1, 28000.00, 'Partida básica anual de funcionamento xeral do centro escolar (Ano 2026)');
    insertPartida.run('part-com-2026', '2026', 'PART-COM', 'Comedor', 1, 18500.00, 'Partida básica anual destinada ao servizo de comedor escolar (Ano 2026)');
    
    // Additional custom partidas for the year
    insertPartida.run('part-biblio-2026', '2026', 'PART-BIBLIO', 'Dotacións Biblioteca e Lectura', 0, 3200.00, 'Fondo específico para fondos bibliográficos e dinamización da biblioteca');
    insertPartida.run('part-mellora-2026', '2026', 'PART-MELLORA', 'Fondos Plan de Mellora', 0, 4500.00, 'Proxecto de reforzo pedagóxico e innovación educativa');
    insertPartida.run('part-libros-2026', '2026', 'PART-LIBROS', 'Fondo Solidario de Libros de Texto', 0, 5600.00, 'Axudas e adquisición de libros de texto e material escolar');
  }

  // Seed Income Categories
  const existingIncomeCats = db.prepare('SELECT COUNT(*) as count FROM income_categories').get() as { count: number };
  if (existingIncomeCats.count === 0) {
    const insertIncomeCat = db.prepare(`
      INSERT INTO income_categories (id, parent_id, code, name, is_group)
      VALUES (?, ?, ?, ?, ?)
    `);

    // a) Dotacións procedentes da Conselleria (Group)
    insertIncomeCat.run('inc-a', null, 'a', 'Dotacións procedentes da Consellería', 1);
    insertIncomeCat.run('inc-a.1', 'inc-a', 'a.1', 'Gastos Funcionamiento', 0);
    insertIncomeCat.run('inc-a.2', 'inc-a', 'a.2', 'Fondo solidario libros', 0);
    insertIncomeCat.run('inc-a.3', 'inc-a', 'a.3', 'Dotacións Biblioteca', 0);
    insertIncomeCat.run('inc-a.4', 'inc-a', 'a.4', 'Fondos Plan de Mellora', 0);
    insertIncomeCat.run('inc-a.5', 'inc-a', 'a.5', 'Fondos proxectos de OIE', 0);
    insertIncomeCat.run('inc-a.6', 'inc-a', 'a.6', 'Comedores escolares', 1);
    insertIncomeCat.run('inc-a.6.1', 'inc-a.6', 'a.6.1', 'Remanente incorporado', 0);
    insertIncomeCat.run('inc-a.6.2', 'inc-a.6', 'a.6.2', 'Prezo do servizo', 0);
    insertIncomeCat.run('inc-a.6.3', 'inc-a.6', 'a.6.3', 'Ingreso da Conselleria de EOU', 0);
    insertIncomeCat.run('inc-a.6.4', 'inc-a.6', 'a.6.4', 'Recursos complementarios', 0);
    insertIncomeCat.run('inc-a.6.5', 'inc-a.6', 'a.6.5', 'Intereses da conta', 0);
    insertIncomeCat.run('inc-a.7', 'inc-a', 'a.7', 'Sen contido neste exercicio', 0);
    insertIncomeCat.run('inc-a.8', 'inc-a', 'a.8', 'Outros', 0);

    // b to l
    insertIncomeCat.run('inc-b', null, 'b', 'Procedentes doutros Organismos Públicos', 0);
    insertIncomeCat.run('inc-c', null, 'c', 'Achegas de legados ou doazóns', 0);
    insertIncomeCat.run('inc-d', null, 'd', 'Ingresos por convenios', 0);
    insertIncomeCat.run('inc-e', null, 'e', 'Procedentes de alleamentos', 0);
    insertIncomeCat.run('inc-f', null, 'f', 'Procedentes de Prestacións de servizos', 0);
    insertIncomeCat.run('inc-g', null, 'g', 'Derivados de usos das instalacións', 0);
    insertIncomeCat.run('inc-h', null, 'h', 'Remanentes do ano anterior', 0);
    insertIncomeCat.run('inc-i', null, 'i', 'Ventas de fotocopias ou uso do teléfono', 0);
    insertIncomeCat.run('inc-j', null, 'j', 'Achegas por servizos de comedor ou residencias', 0);
    insertIncomeCat.run('inc-k', null, 'k', 'Xuros das contas bancarias', 0);
    insertIncomeCat.run('inc-l', null, 'l', 'Calquera outro ingreso autorizado', 0);
  }

  // Seed Expense Categories
  const existingExpenseCats = db.prepare('SELECT COUNT(*) as count FROM expense_categories').get() as { count: number };
  if (existingExpenseCats.count === 0) {
    const insertExpenseCat = db.prepare(`
      INSERT INTO expense_categories (id, parent_id, code, name, is_group)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertExpenseCat.run('exp-1', null, '1', 'Arrendamentos', 0);
    insertExpenseCat.run('exp-2', null, '2', 'Reparacións, mantementos e conservación', 0);
    insertExpenseCat.run('exp-3', null, '3', 'Material de oficina', 0);

    // 4.- Subministracións (Group)
    insertExpenseCat.run('exp-4', null, '4', 'Subministracións', 1);
    insertExpenseCat.run('exp-4.1', 'exp-4', '4.1', 'Gasóleo', 0);
    insertExpenseCat.run('exp-4.2', 'exp-4', '4.2', 'Gas', 0);
    insertExpenseCat.run('exp-4.3', 'exp-4', '4.3', 'Biomasa', 0);
    insertExpenseCat.run('exp-4.4', 'exp-4', '4.4', 'Electricidade', 0);
    insertExpenseCat.run('exp-4.5', 'exp-4', '4.5', 'Auga', 0);
    insertExpenseCat.run('exp-4.6', 'exp-4', '4.6', 'Outras Subministracións', 0);

    insertExpenseCat.run('exp-5', null, '5', 'Comunicacións', 0);
    insertExpenseCat.run('exp-6', null, '6', 'Transporte', 0);
    insertExpenseCat.run('exp-7', null, '7', 'Traballos realizados por outras empresas', 0);
    insertExpenseCat.run('exp-8', null, '8', 'Primas de seguro', 0);
    insertExpenseCat.run('exp-9', null, '9', 'Tributos', 0);
    insertExpenseCat.run('exp-10', null, '10', 'Axudas de custo e locomoción', 0);
    insertExpenseCat.run('exp-11', null, '11', 'Gastos diversos', 0);
    insertExpenseCat.run('exp-12', null, '12', 'Mobiliario e utensilios inventariables', 0);
    insertExpenseCat.run('exp-13', null, '13', 'Outros materiais inventariables', 0);

    // 14.- Comedores escolares (Group)
    insertExpenseCat.run('exp-14', null, '14', 'Comedores escolares', 1);
    insertExpenseCat.run('exp-14.1', 'exp-14', '14.1', 'Adquisicións', 0);
    insertExpenseCat.run('exp-14.2', 'exp-14', '14.2', 'Materiais', 1);
    insertExpenseCat.run('exp-14.2.1', 'exp-14.2', '14.2.1', 'Servilletas-Manteis', 0);
    insertExpenseCat.run('exp-14.2.2', 'exp-14.2', '14.2.2', 'Produtos de limpeza', 0);
    insertExpenseCat.run('exp-14.2.3', 'exp-14.2', '14.2.3', 'Panos e roupa de cocina', 0);
    insertExpenseCat.run('exp-14.2.4', 'exp-14.2', '14.2.4', 'Menaxe de cocina e comedor', 0);
    insertExpenseCat.run('exp-14.3', 'exp-14', '14.3', 'Subministracións', 1);
    insertExpenseCat.run('exp-14.3.1', 'exp-14.3', '14.3.1', 'Compra de alimentos', 0);
    insertExpenseCat.run('exp-14.3.2', 'exp-14.3', '14.3.2', 'Enerxia electrica', 0);
    insertExpenseCat.run('exp-14.3.3', 'exp-14.3', '14.3.3', 'Gas propano', 0);
    insertExpenseCat.run('exp-14.4', 'exp-14', '14.4', 'Gastos diversos', 0);
    insertExpenseCat.run('exp-14.5', 'exp-14', '14.5', 'Traballos', 0);
  }

  // Seed sample movements to demonstrate bank reconciliation & budgeting
  const existingMovements = db.prepare('SELECT COUNT(*) as count FROM movements').get() as { count: number };
  if (existingMovements.count === 0) {
    const insertMovement = db.prepare(`
      INSERT INTO movements (
        id, bank_account_id, academic_year_id, date, type, concept, amount,
        partida_id, income_category_id, expense_category_id, is_reconciled,
        reconciled_date, reference_doc, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Movimientos Funcionamento
    insertMovement.run(
      'mov-001', 'funcionamento', '2026', '2026-01-15', 'INGRESO',
      'Dotación inicial primeiro cuadrimestre Consellería', 14000.00,
      'part-func-2026', 'inc-a.1', null, 1,
      '2026-01-16', 'ORD-2026/098', 'Ingreso transferido pola Xunta'
    );
    insertMovement.run(
      'mov-002', 'funcionamento', '2026', '2026-01-28', 'GASTO',
      'Factura electricidade xaneiro - Naturgy', 784.30,
      'part-func-2026', null, 'exp-4.4', 1,
      '2026-01-30', 'FAC-NAT-8912', 'Cargado na conta por recibo'
    );
    insertMovement.run(
      'mov-003', 'funcionamento', '2026', '2026-02-05', 'GASTO',
      'Material escolar e folios para secretaría e aulas', 412.50,
      'part-func-2026', null, 'exp-3', 1,
      '2026-02-06', 'FAC-OFICINA-340', 'Papelería Central'
    );
    insertMovement.run(
      'mov-004', 'funcionamento', '2026', '2026-02-18', 'GASTO',
      'Reparación e mantemento de caldeira calefacción', 650.00,
      'part-func-2026', null, 'exp-2', 0,
      null, 'FAC-CLIMA-102', 'Pendente de comprobación no extracto mensual'
    );
    insertMovement.run(
      'mov-005', 'funcionamento', '2026', '2026-02-25', 'GASTO',
      'Subministración combustible calefacción Gasóleo C', 2450.00,
      'part-func-2026', null, 'exp-4.1', 0,
      null, 'ALB-REPSOL-99', 'Descarga de 2500 litros de combustible'
    );

    // Movimientos Comedor
    insertMovement.run(
      'mov-006', 'comedor', '2026', '2026-01-18', 'INGRESO',
      'Dotación Consellería servizo de comedor escolar', 9250.00,
      'part-com-2026', 'inc-a.6.3', null, 1,
      '2026-01-19', 'ORD-COM-01', 'Achega ordinaria primeiro trimestre'
    );
    insertMovement.run(
      'mov-007', 'comedor', '2026', '2026-02-02', 'INGRESO',
      'Remesa mensual de cotas de familias usuarias de comedor', 3420.00,
      'part-com-2026', 'inc-j', null, 1,
      '2026-02-03', 'REM-COM-FEB', 'Cobro domiciliacións bancarias'
    );
    insertMovement.run(
      'mov-008', 'comedor', '2026', '2026-02-15', 'GASTO',
      'Servizo de catering e menús escolares - Serunión', 4890.00,
      'part-com-2026', null, 'exp-14.3.1', 1,
      '2026-02-16', 'FAC-SERU-2026-02', 'Menús correspondentes ao mes de febreiro'
    );
    insertMovement.run(
      'mov-009', 'comedor', '2026', '2026-02-28', 'GASTO',
      'Reposición de louza, bandexas e vaixela de comedor', 380.00,
      'part-com-2026', null, 'exp-14.2.4', 0,
      null, 'FAC-MENAXE-44', 'Pendente de cargo no banco'
    );
  }

  // Sembrar usuario inicial si no existe
  try {
    const userCheck = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?').get('luismartq@gmail.com') as { count: number };
    if (userCheck.count === 0) {
      const { hash, salt } = hashPassword('Cole2026!MartQ#9');
      db.prepare(`
        INSERT INTO users (id, email, password_hash, salt, name)
        VALUES (?, ?, ?, ?, ?)
      `).run('user-luismartq', 'luismartq@gmail.com', hash, salt, 'Luis Martínez');
    }
  } catch (err) {
    console.error('Erro ao semear usuario inicial:', err);
  }
}

