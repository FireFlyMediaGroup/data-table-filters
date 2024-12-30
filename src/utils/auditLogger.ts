interface AuditEvent {
  action: string;
  userId: string;
  resourceId?: string;
  details?: Record<string, any>;
}

export const auditLogger = {
  log: async (event: AuditEvent) => {
    console.log('Audit Event:', {
      timestamp: new Date().toISOString(),
      ...event,
    });
    // In production, send to secure logging service
  }
};

export const logAuditEvent = auditLogger.log;
