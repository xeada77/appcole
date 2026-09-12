import { NextResponse } from 'next/server';
import fs from 'node:fs';
import { createSafeBackup } from '@/lib/backup';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const downloadFilename = `copia_seguridade_appcole_${todayStr}.db`;
    
    // Xera a copia mediante VACUUM INTO seguro
    const { filePath } = createSafeBackup(`download_${Date.now()}.db`);
    
    // Le o arquivo xerado
    const fileBuffer = fs.readFileSync(filePath);

    // Opcionalmente podemos limpar o arquivo temporal despois de lelo
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignorar se está en uso
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.sqlite3',
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Erro ao descargar a copia de seguridade:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao xerar o arquivo de copia de seguridade' },
      { status: 500 }
    );
  }
}
