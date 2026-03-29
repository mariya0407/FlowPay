import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

type AuditLogPayload = {
  companyId: number;
  userId?: number;
  action: AuditAction;
  entityType: string;
  entityId: number;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
};

export async function logAudit(payload: AuditLogPayload) {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: payload.companyId,
        userId: payload.userId,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        oldData: payload.oldData || null,
        newData: payload.newData || null,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to write Audit Log to database:', error);
    // We swallow the error locally because an audit log failure shouldn't break the main business logic
  }
}
