import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { SESSION_COOKIE_NAME } from '@/lib/auth-crypto';
import { getInvoiceStream } from '@/lib/storage';
import { Readable } from 'node:stream';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar autenticación directamente coas cookies da petición HTTP
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Non autorizado: sesión non atopada' }, { status: 401 });
    }

    const db = getDb();
    const now = new Date().toISOString();
    const userSession = db.prepare(`
      SELECT u.id, u.email, u.name, s.expires_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(sessionId) as { id: string; email: string; name: string | null; expires_at: string } | undefined;

    if (!userSession || userSession.expires_at < now) {
      return NextResponse.json({ error: 'Non autorizado: sesión non válida ou expirada' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Identificador non válido' }, { status: 400 });
    }

    // 2. Buscar o movemento na base de datos
    const mov = db.prepare(`
      SELECT id, concept, invoice_key, invoice_filename, invoice_mimetype, invoice_size
      FROM movements
      WHERE id = ?
    `).get(id) as {
      id: string;
      concept: string;
      invoice_key: string | null;
      invoice_filename: string | null;
      invoice_mimetype: string | null;
      invoice_size: number | null;
    } | undefined;

    if (!mov || !mov.invoice_key) {
      return NextResponse.json(
        { error: 'Este movemento non ten ningunha factura asociada.' },
        { status: 404 }
      );
    }

    // 3. Obter o fluxo do arquivo dende RustFS / almacenamento
    const invoiceData = await getInvoiceStream(mov.invoice_key);
    if (!invoiceData) {
      return NextResponse.json(
        { error: 'Non se puido atopar o arquivo físico da factura no almacenamento.' },
        { status: 404 }
      );
    }

    let body: any = invoiceData.stream;
    if (body && typeof body.transformToByteArray === 'function') {
      const bytes = await body.transformToByteArray();
      body = bytes;
    } else if (body instanceof Readable) {
      body = Readable.toWeb(body);
    }

    const filename = mov.invoice_filename || 'factura.pdf';
    const mimetype = mov.invoice_mimetype || invoiceData.mimetype || 'application/pdf';

    const headers: Record<string, string> = {
      'Content-Type': mimetype,
      'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    if (invoiceData.size) {
      headers['Content-Length'] = invoiceData.size.toString();
    }

    return new NextResponse(body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Erro ao servir a factura:', error);
    return NextResponse.json(
      { error: 'Erro interno ao recuperar a factura.' },
      { status: 500 }
    );
  }
}
