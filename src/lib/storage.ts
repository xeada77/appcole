import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand
} from '@aws-sdk/client-s3';
import path from 'node:path';
import fs from 'node:fs';
import { Readable } from 'node:stream';

const RUSTFS_ENDPOINT = process.env.RUSTFS_ENDPOINT || 'http://127.0.0.1:9000';
const RUSTFS_BUCKET = process.env.RUSTFS_BUCKET || 'facturas';
const RUSTFS_ACCESS_KEY = process.env.RUSTFS_ACCESS_KEY || 'appcoleadmin';
const RUSTFS_SECRET_KEY = process.env.RUSTFS_SECRET_KEY || 'appcoleadminsecret123';

const LOCAL_FALLBACK_DIR = path.join(process.cwd(), 'data', 'rustfs', RUSTFS_BUCKET);

let s3Client: S3Client | null = null;
let bucketVerified = false;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: RUSTFS_ENDPOINT,
      region: 'us-east-1',
      credentials: {
        accessKeyId: RUSTFS_ACCESS_KEY,
        secretAccessKey: RUSTFS_SECRET_KEY,
      },
      forcePathStyle: true, // Imprescindible para RustFS / MinIO
    });
  }
  return s3Client;
}

/**
 * Asegura que o bucket de facturas exista en RustFS.
 */
async function ensureBucket(): Promise<boolean> {
  if (bucketVerified) return true;
  const client = getS3Client();
  try {
    await client.send(new HeadBucketCommand({ Bucket: RUSTFS_BUCKET }));
    bucketVerified = true;
    return true;
  } catch (err: any) {
    const isNotFound = err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound';
    if (isNotFound) {
      try {
        await client.send(new CreateBucketCommand({ Bucket: RUSTFS_BUCKET }));
        bucketVerified = true;
        console.log(`[RustFS] Bucket "${RUSTFS_BUCKET}" creado con éxito.`);
        return true;
      } catch (createErr) {
        console.warn(`[RustFS] Non se puido crear o bucket "${RUSTFS_BUCKET}":`, createErr);
        return false;
      }
    }
    // Erro de conexión (ex: RustFS non arrincado en contorno local de dev)
    return false;
  }
}

export interface UploadInvoiceResult {
  key: string;
  filename: string;
  mimetype: string;
  size: number;
}

/**
 * Sanea o nome do arquivo para evitar caracteres conflitivos.
 */
function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
    .replace(/[^a-zA-Z0-9._-]/g, '_'); // Substitúe caracteres estraños por guión baixo
}

/**
 * Sube unha factura a RustFS (ou fallback local se RustFS non está dispoñible).
 */
export async function uploadInvoice(
  file: File,
  movementId: string,
  yearId: string,
  accountId: string
): Promise<UploadInvoiceResult> {
  const originalFilename = file.name || 'factura.pdf';
  //const cleanName = sanitizeFilename(originalFilename);
  const cleanName = sanitizeFilename('factura.pdf');// Forzar nome fixo
  const ext = path.extname(cleanName) || '.pdf';
  const baseName = path.basename(cleanName, ext);

  // Exemplo de chave: 2026/funcionamento/mov-001_1720000000_factura.pdf
  const objectKey = `${yearId}/${accountId}/${movementId}_${Date.now()}_${baseName}${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimetype = file.type || (ext === '.pdf' ? 'application/pdf' : 'application/octet-stream');
  const size = buffer.length;

  const hasBucket = await ensureBucket();
  let uploadedToS3 = false;

  if (hasBucket) {
    try {
      const client = getS3Client();
      await client.send(
        new PutObjectCommand({
          Bucket: RUSTFS_BUCKET,
          Key: objectKey,
          Body: buffer,
          ContentType: mimetype,
          Metadata: {
            'original-filename': encodeURIComponent(originalFilename),
            'movement-id': movementId,
          },
        })
      );
      uploadedToS3 = true;
    } catch (s3Err) {
      console.warn('[RustFS] Erro ao subir a S3, empregando persistencia local:', s3Err);
    }
  }

  // Se non se puido subir a S3 (ex: desenvolvemento en Windows sen RustFS), gardar en disco local
  if (!uploadedToS3) {
    const localFilePath = path.join(LOCAL_FALLBACK_DIR, objectKey);
    const localDir = path.dirname(localFilePath);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.writeFileSync(localFilePath, buffer);
  }

  return {
    key: objectKey,
    filename: originalFilename,
    mimetype,
    size,
  };
}

export interface InvoiceStreamResult {
  stream: ReadableStream | Readable | Buffer;
  mimetype: string;
  size?: number;
  filename?: string;
}

/**
 * Obtén o fluxo ou contido da factura para visualización/descarga.
 */
export async function getInvoiceStream(objectKey: string): Promise<InvoiceStreamResult | null> {
  // Probar primeiro con RustFS S3
  try {
    const client = getS3Client();
    const response = await client.send(
      new GetObjectCommand({
        Bucket: RUSTFS_BUCKET,
        Key: objectKey,
      })
    );

    if (response.Body) {
      return {
        stream: response.Body as any,
        mimetype: response.ContentType || 'application/pdf',
        size: response.ContentLength,
      };
    }
  } catch (err: any) {
    // Se falla por conexión ou non atopado en S3, probar fallback local
  }

  // Fallback local en ./data/rustfs/facturas/...
  const localFilePath = path.join(LOCAL_FALLBACK_DIR, objectKey);
  if (fs.existsSync(localFilePath)) {
    const stats = fs.statSync(localFilePath);
    const stream = fs.createReadStream(localFilePath);
    const ext = path.extname(objectKey).toLowerCase();
    let mimetype = 'application/pdf';
    if (['.jpg', '.jpeg'].includes(ext)) mimetype = 'image/jpeg';
    else if (ext === '.png') mimetype = 'image/png';
    else if (ext === '.webp') mimetype = 'image/webp';

    return {
      stream,
      mimetype,
      size: stats.size,
    };
  }

  return null;
}

/**
 * Elimina unha factura de RustFS (e do fallback local se existise).
 */
export async function deleteInvoice(objectKey: string | null | undefined): Promise<boolean> {
  if (!objectKey) return true;

  try {
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: RUSTFS_BUCKET,
        Key: objectKey,
      })
    );
  } catch (err) {
    // Silenciar se non conectou con S3
  }

  // Eliminar tamén de disco local se existise
  try {
    const localFilePath = path.join(LOCAL_FALLBACK_DIR, objectKey);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  } catch (localErr) {
    // Ignorar se xa non existe
  }

  return true;
}

