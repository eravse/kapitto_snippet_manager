import { prisma } from './prisma';
import { getSession } from './auth';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'DOWNLOAD'
  | 'VIEW'
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'MAINTENANCE'
  | 'MIGRATION';

export interface AuditLogData {
  action: AuditAction;
  entity: string;
  entityId: number; // Şemada String olduğu için zorunlu yaptık
  snippetId?: number; // Şemanızda var, buraya da ekledik
  oldValue?: string;
  newValue?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    const session = await getSession();

    // Şemada userId zorunlu olduğu için oturum yoksa log tutulamaz veya 
    // sistem kullanıcısı gibi bir ID atanmalıdır.
    if (!session?.id) {
      console.warn('AuditLog: Oturum açmış kullanıcı bulunamadı, log oluşturulmadı.');
      return;
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id, // Zorunlu alan
        action: data.action,
        entity: data.entity,
        entityId: data.entityId, // Zorunlu alan
        snippetId: data.snippetId || null,
        oldValue: data.oldValue || null,
        newValue: data.newValue || null,
        details: data.details || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
  } catch (error) {
    // Docker build sırasında veya çalışma anında hata almamak için 
    console.error('Failed to create audit log:', error);
  }
}

export async function getAuditLogs(options?: {
  userId?: number;
  entity?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}) {
  const where: any = {};

  if (options?.userId) {
    where.userId = options.userId;
  }

  if (options?.entity) {
    where.entity = options.entity;
  }

  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      where.createdAt.gte = options.startDate;
    }
    if (options.endDate) {
      where.createdAt.lte = options.endDate;
    }
  }

  if (options?.search) {
    where.OR = [
      { action: { contains: options.search, mode: 'insensitive' } },
      { entity: { contains: options.search, mode: 'insensitive' } },
      { details: { contains: options.search, mode: 'insensitive' } },
      { user: { name: { contains: options.search, mode: 'insensitive' } } },
      { user: { email: { contains: options.search, mode: 'insensitive' } } },
    ];
  }

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: options?.limit || 25,
      skip: options?.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, totalCount };
}

/**
 * Tarih formatlama fonksiyonu
 * Prisma'dan gelen Date objelerini veya stringleri işler
 */
export const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};