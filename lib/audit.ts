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
  | 'REGISTER';

export interface AuditLogData {
  action: AuditAction;
  entity: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    const session = await getSession();
    
    await prisma.auditLog.create({
      data: {
        userId: session?.id,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export async function getAuditLogs(options?: {
  userId?: number;
  entity?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  
  if (options?.userId) {
    where.userId = options.userId;
  }
  
  if (options?.entity) {
    where.entity = options.entity;
  }

  return prisma.auditLog.findMany({
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
    take: options?.limit || 100,
    skip: options?.offset || 0,
  });
}


export const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};