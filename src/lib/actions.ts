'use server';

import { getDb } from './db';
import { revalidatePath } from 'next/cache';
import crypto from 'node:crypto';
import { getBudgetPartidas } from './queries';
import { BudgetPartida } from './types';
import { formatCurrency } from './utils';

export async function createMovementAction(formData: FormData) {
  const db = getDb();
  
  const id = 'mov-' + crypto.randomUUID().slice(0, 8);
  const bankAccountId = formData.get('bank_account_id') as string;
  const academicYearId = formData.get('academic_year_id') as string;
  const date = formData.get('date') as string;
  const type = formData.get('type') as 'INGRESO' | 'GASTO';
  const concept = formData.get('concept') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const partidaId = (formData.get('partida_id') as string) || null;
  const categoryId = (formData.get('category_id') as string) || null;
  const referenceDoc = (formData.get('reference_doc') as string) || null;
  const notes = (formData.get('notes') as string) || null;
  const isReconciled = formData.get('is_reconciled') === 'true' ? 1 : 0;
  const reconciledDate = isReconciled ? (formData.get('reconciled_date') as string || date) : null;

  let incomeCategoryId: string | null = null;
  let expenseCategoryId: string | null = null;

  if (type === 'INGRESO') {
    // Category H ('inc-h') is reserved exclusively for initial remanentes and never goes in bank movements
    incomeCategoryId = categoryId === 'inc-h' ? null : categoryId;
  } else {
    expenseCategoryId = categoryId;
  }

  const stmt = db.prepare(`
    INSERT INTO movements (
      id, bank_account_id, academic_year_id, date, type, concept, amount,
      partida_id, income_category_id, expense_category_id, is_reconciled,
      reconciled_date, reference_doc, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    bankAccountId,
    academicYearId,
    date,
    type,
    concept,
    amount,
    partidaId,
    incomeCategoryId,
    expenseCategoryId,
    isReconciled,
    reconciledDate,
    referenceDoc,
    notes
  );

  revalidatePath('/', 'layout');
  return { success: true, id };
}

export async function updateMovementAction(formData: FormData) {
  const db = getDb();

  const id = formData.get('id') as string;
  const bankAccountId = formData.get('bank_account_id') as string;
  const date = formData.get('date') as string;
  const type = formData.get('type') as 'INGRESO' | 'GASTO';
  const concept = formData.get('concept') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const partidaId = (formData.get('partida_id') as string) || null;
  const categoryId = (formData.get('category_id') as string) || null;
  const referenceDoc = (formData.get('reference_doc') as string) || null;
  const notes = (formData.get('notes') as string) || null;
  const isReconciled = formData.get('is_reconciled') === 'true' ? 1 : 0;
  const reconciledDate = isReconciled ? (formData.get('reconciled_date') as string || date) : null;

  let incomeCategoryId: string | null = null;
  let expenseCategoryId: string | null = null;

  if (type === 'INGRESO') {
    // Category H ('inc-h') is reserved exclusively for initial remanentes and never goes in bank movements
    incomeCategoryId = categoryId === 'inc-h' ? null : categoryId;
  } else {
    expenseCategoryId = categoryId;
  }

  const stmt = db.prepare(`
    UPDATE movements
    SET bank_account_id = ?,
        date = ?,
        type = ?,
        concept = ?,
        amount = ?,
        partida_id = ?,
        income_category_id = ?,
        expense_category_id = ?,
        is_reconciled = ?,
        reconciled_date = ?,
        reference_doc = ?,
        notes = ?
    WHERE id = ?
  `);

  stmt.run(
    bankAccountId,
    date,
    type,
    concept,
    amount,
    partidaId,
    incomeCategoryId,
    expenseCategoryId,
    isReconciled,
    reconciledDate,
    referenceDoc,
    notes,
    id
  );

  revalidatePath('/', 'layout');
  return { success: true, id };
}

export async function toggleReconciliationAction(movementId: string, newState: boolean) {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const stmt = db.prepare(`
    UPDATE movements
    SET is_reconciled = ?,
        reconciled_date = ?
    WHERE id = ?
  `);

  stmt.run(newState ? 1 : 0, newState ? today : null, movementId);

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function deleteMovementAction(movementId: string) {
  const db = getDb();
  const stmt = db.prepare(`DELETE FROM movements WHERE id = ?`);
  stmt.run(movementId);

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function createBudgetPartidaAction(formData: FormData) {
  const db = getDb();

  const id = 'part-' + crypto.randomUUID().slice(0, 8);
  const academicYearId = formData.get('academic_year_id') as string;
  const name = (formData.get('name') as string)?.trim();
  const code = ((formData.get('code') as string)?.trim()) || ('PART-' + Math.floor(100 + Math.random() * 900));
  const initialBudget = parseFloat(formData.get('initial_budget') as string) || 0;
  const description = ((formData.get('description') as string)?.trim()) || null;

  if (!name) {
    return { success: false, error: 'O nome da partida é obrigatorio.' };
  }

  if (initialBudget < 0) {
    return { success: false, error: 'A dotación inicial non pode ser negativa.' };
  }

  let funcPartida: { id: string; initial_budget: number } | undefined;
  if (initialBudget > 0) {
    funcPartida = db.prepare(`
      SELECT id, initial_budget
      FROM budget_partidas
      WHERE academic_year_id = ? AND is_base = 1 AND (code = 'PART-FUNC' OR LOWER(name) IN ('funcionamento', 'funcionamiento'))
      LIMIT 1
    `).get(academicYearId) as { id: string; initial_budget: number } | undefined;

    if (!funcPartida) {
      return { success: false, error: 'Non se atopou a partida básica de Funcionamento para este exercicio escolar.' };
    }

    if (initialBudget > funcPartida.initial_budget) {
      return {
        success: false,
        error: `A cantidade indicada (${formatCurrency(initialBudget)}) supera a dotación inicial dispoñible na partida básica Funcionamento (${formatCurrency(funcPartida.initial_budget)}).`
      };
    }
  }

  db.exec('BEGIN');
  try {
    const stmt = db.prepare(`
      INSERT INTO budget_partidas (
        id, academic_year_id, code, name, is_base, initial_budget, description
      ) VALUES (?, ?, ?, ?, 0, ?, ?)
    `);

    stmt.run(id, academicYearId, code.toUpperCase(), name, initialBudget, description);

    if (funcPartida && initialBudget > 0) {
      const newFuncBudget = Math.round((funcPartida.initial_budget - initialBudget) * 100) / 100;
      db.prepare(`
        UPDATE budget_partidas
        SET initial_budget = ?
        WHERE id = ?
      `).run(newFuncBudget, funcPartida.id);
    }

    db.exec('COMMIT');
  } catch (err: any) {
    db.exec('ROLLBACK');
    return { success: false, error: err?.message || 'Erro ao gardar a partida orzamentaria.' };
  }

  revalidatePath('/', 'layout');
  return { success: true, id };
}

export async function updateBudgetPartidaAction(id: string, initialBudget: number, description?: string) {
  const db = getDb();
  const partida = db.prepare(`SELECT academic_year_id, is_base FROM budget_partidas WHERE id = ?`).get(id) as { academic_year_id: string; is_base: number } | undefined;

  const stmt = db.prepare(`
    UPDATE budget_partidas
    SET initial_budget = ?,
        description = ?
    WHERE id = ?
  `);

  stmt.run(initialBudget, description || null, id);

  // Se é unha partida básica (Funcionamento ou Comedor), sincronizar automaticamente o initial_remanente do ano
  if (partida && partida.is_base === 1) {
    const baseSum = db.prepare(`
      SELECT COALESCE(SUM(initial_budget), 0) as total
      FROM budget_partidas
      WHERE academic_year_id = ? AND is_base = 1
    `).get(partida.academic_year_id) as { total: number };
    db.prepare(`UPDATE academic_years SET initial_remanente = ? WHERE id = ?`).run(baseSum.total, partida.academic_year_id);
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function deleteBudgetPartidaAction(id: string) {
  const db = getDb();
  // Don't allow deleting base partidas
  const partida = db.prepare(`SELECT academic_year_id, is_base, initial_budget FROM budget_partidas WHERE id = ?`).get(id) as { academic_year_id: string; is_base: number; initial_budget: number } | undefined;
  if (!partida || partida.is_base === 1) {
    return { success: false, error: 'Non se poden eliminar as partidas básicas de Funcionamento ou Comedor.' };
  }

  db.exec('BEGIN');
  try {
    // Detach movements before deleting
    db.prepare(`UPDATE movements SET partida_id = NULL WHERE partida_id = ?`).run(id);
    db.prepare(`DELETE FROM budget_partidas WHERE id = ?`).run(id);

    // Reintegrar a dotación inicial á partida básica Funcionamento se tiña dotación asignada
    if (partida.initial_budget > 0) {
      const funcPartida = db.prepare(`
        SELECT id, initial_budget FROM budget_partidas
        WHERE academic_year_id = ? AND is_base = 1 AND (code = 'PART-FUNC' OR LOWER(name) IN ('funcionamento', 'funcionamiento'))
        LIMIT 1
      `).get(partida.academic_year_id) as { id: string; initial_budget: number } | undefined;

      if (funcPartida) {
        const restoredBudget = Math.round((funcPartida.initial_budget + partida.initial_budget) * 100) / 100;
        db.prepare(`
          UPDATE budget_partidas
          SET initial_budget = ?
          WHERE id = ?
        `).run(restoredBudget, funcPartida.id);
      }
    }

    db.exec('COMMIT');
  } catch (err: any) {
    db.exec('ROLLBACK');
    return { success: false, error: err?.message || 'Erro ao eliminar a partida.' };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function switchAcademicYearAction(yearId: string) {
  const db = getDb();
  db.prepare(`UPDATE academic_years SET is_current = CASE WHEN id = ? THEN 1 ELSE 0 END`).run(yearId);

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function createAcademicYearAction(formData: FormData) {
  const db = getDb();
  const id = (formData.get('id') as string).trim();
  const name = (formData.get('name') as string).trim();
  const startDate = (formData.get('start_date') as string) || null;
  const endDate = (formData.get('end_date') as string) || null;
  const setAsCurrent = formData.get('set_as_current') === 'true';
  const initialBudgetFunc = parseFloat(formData.get('initial_budget_func') as string) || 0;
  const initialBudgetCom = parseFloat(formData.get('initial_budget_com') as string) || 0;
  const initialRemanente = initialBudgetFunc + initialBudgetCom;

  // Check if year already exists
  const existing = db.prepare(`SELECT id FROM academic_years WHERE id = ?`).get(id);
  if (existing) {
    return { success: false, error: 'Xa existe un exercicio/ano con este identificador.' };
  }

  if (setAsCurrent) {
    db.prepare(`UPDATE academic_years SET is_current = 0`).run();
  }

  db.prepare(`
    INSERT INTO academic_years (id, name, is_current, start_date, end_date, initial_remanente)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, setAsCurrent ? 1 : 0, startDate, endDate, initialRemanente);

  // Automatically create the 2 base partidas for this year
  const insertPartida = db.prepare(`
    INSERT INTO budget_partidas (id, academic_year_id, code, name, is_base, initial_budget, description)
    VALUES (?, ?, ?, ?, 1, ?, ?)
  `);

  insertPartida.run(
    `part-func-${id}`,
    id,
    'PART-FUNC',
    'Funcionamento',
    initialBudgetFunc,
    `Partida básica anual de funcionamento xeral do centro escolar (${name})`
  );

  insertPartida.run(
    `part-com-${id}`,
    id,
    'PART-COM',
    'Comedor',
    initialBudgetCom,
    `Partida básica anual destinada ao servizo de comedor escolar (${name})`
  );

  revalidatePath('/', 'layout');
  return { success: true, id };
}

export async function deleteAcademicYearAction(yearId: string) {
  const db = getDb();
  
  // Don't allow deleting if it has movements
  const movCount = db.prepare(`SELECT COUNT(*) as count FROM movements WHERE academic_year_id = ?`).get(yearId) as { count: number };
  if (movCount && movCount.count > 0) {
    return { success: false, error: `Non se pode eliminar o exercicio porque contén ${movCount.count} movementos rexistrados.` };
  }

  // Check total years
  const totalYears = db.prepare(`SELECT COUNT(*) as count FROM academic_years`).get() as { count: number };
  if (totalYears && totalYears.count <= 1) {
    return { success: false, error: 'Non se pode eliminar o único exercicio escolar existente.' };
  }

  // Check if it was current
  const wasCurrent = db.prepare(`SELECT is_current FROM academic_years WHERE id = ?`).get(yearId) as { is_current: number };
  
  db.prepare(`DELETE FROM budget_partidas WHERE academic_year_id = ?`).run(yearId);
  db.prepare(`DELETE FROM academic_years WHERE id = ?`).run(yearId);

  if (wasCurrent && wasCurrent.is_current === 1) {
    const firstOther = db.prepare(`SELECT id FROM academic_years ORDER BY id DESC LIMIT 1`).get() as { id: string };
    if (firstOther) {
      db.prepare(`UPDATE academic_years SET is_current = 1 WHERE id = ?`).run(firstOther.id);
    }
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function createManualBackupAction() {
  try {
    const { createSafeBackup, rotateBackups, getBackupStatus } = await import('./backup');
    const result = createSafeBackup();
    rotateBackups(7);
    const status = getBackupStatus();
    return { success: true, filename: result.filename, status };
  } catch (error) {
    console.error('Erro ao crear copia manual:', error);
    return { success: false, error: 'Non se puido crear a copia de seguridade' };
  }
}

export async function getBackupStatusAction() {
  try {
    const { getBackupStatus } = await import('./backup');
    return { success: true, status: getBackupStatus() };
  } catch (error) {
    console.error('Erro ao obter estado de copias:', error);
    return { success: false, status: { lastBackupDate: null, totalBackups: 0, backups: [] } };
  }
}

export async function getPartidasByYearAction(yearId: string): Promise<BudgetPartida[]> {
  return getBudgetPartidas(yearId);
}



