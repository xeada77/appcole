import path from 'node:path';
import fs from 'node:fs';
import { getDb } from './db';

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');

export interface BackupItem {
  name: string;
  sizeBytes: number;
  createdAt: string;
}

export interface BackupStatus {
  lastBackupDate: string | null;
  totalBackups: number;
  backups: BackupItem[];
}

/**
 * Asegura que o directorio de copias de seguridade existe
 */
export function ensureBackupDir(): string {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  return BACKUP_DIR;
}

/**
 * Xera unha copia de seguridade segura da base de datos usando VACUUM INTO de SQLite.
 * VACUUM INTO garante atomicidade e integridade mesmo con transaccións e modo WAL activo.
 */
export function createSafeBackup(customFilename?: string): { filePath: string; filename: string } {
  const dir = ensureBackupDir();
  const db = getDb();

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = customFilename || `backup_appcole_${timestamp}.db`;
  const filePath = path.join(dir, filename);

  // Se o ficheiro xa existe por calquera motivo, elimínase para que VACUUM INTO non falle
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignorar se non se pode borrar
    }
  }

  // SQLite precisa barras inclinadas '/' no camiño do ficheiro, mesmo en Windows
  const normalizedPath = filePath.replace(/\\/g, '/');
  db.exec(`VACUUM INTO '${normalizedPath}';`);

  return { filePath, filename };
}

/**
 * Mantén un número máximo de copias de seguridade, eliminando as máis antigas
 */
export function rotateBackups(maxBackups = 7): void {
  try {
    const dir = ensureBackupDir();
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.db'))
      .map(f => {
        const fullPath = path.join(dir, f);
        const stats = fs.statSync(fullPath);
        return { name: f, fullPath, mtime: stats.mtime.getTime() };
      })
      .sort((a, b) => b.mtime - a.mtime); // Máis recentes primeiro

    if (files.length > maxBackups) {
      const toDelete = files.slice(maxBackups);
      toDelete.forEach(file => {
        try {
          fs.unlinkSync(file.fullPath);
        } catch (err) {
          console.error(`Erro ao eliminar copia antiga ${file.name}:`, err);
        }
      });
    }
  } catch (error) {
    console.error('Erro na rotación de copias de seguridade:', error);
  }
}

/**
 * Tarea automática: xera unha copia diaria se aínda non existe a de hoxe
 * e aplica rotación mantendo as últimas 7 copias.
 */
export function runAutomaticDailyBackup(): { created: boolean; filename?: string } {
  try {
    const dir = ensureBackupDir();
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const expectedPrefix = `backup_appcole_auto_${todayStr}`;

    // Comproba se xa existe unha copia automática de hoxe
    const existing = fs.readdirSync(dir).find(f => f.startsWith(expectedPrefix) && f.endsWith('.db'));
    if (existing) {
      return { created: false, filename: existing };
    }

    // Crea a copia automática de hoxe
    const filename = `${expectedPrefix}.db`;
    const result = createSafeBackup(filename);

    // Rotar para non saturar o disco (manter as últimas 7)
    rotateBackups(7);

    return { created: true, filename: result.filename };
  } catch (error) {
    console.error('Erro ao executar a copia automática diaria:', error);
    return { created: false };
  }
}

/**
 * Devolve o estado e a listaxe das copias de seguridade existentes
 */
export function getBackupStatus(): BackupStatus {
  try {
    const dir = ensureBackupDir();
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.db'))
      .map(f => {
        const fullPath = path.join(dir, f);
        const stats = fs.statSync(fullPath);
        return {
          name: f,
          sizeBytes: stats.size,
          createdAt: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      lastBackupDate: files.length > 0 ? files[0].createdAt : null,
      totalBackups: files.length,
      backups: files
    };
  } catch {
    return {
      lastBackupDate: null,
      totalBackups: 0,
      backups: []
    };
  }
}
