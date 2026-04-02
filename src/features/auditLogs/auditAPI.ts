export interface AuditLogRow {
  id: string;
  actor: string;
  action: string;
  resource: string;
  at: string;
  severity: "info" | "warning" | "critical";
}

export async function fetchAuditLogs(): Promise<AuditLogRow[]> {
  await delay(280);
  return [
    {
      id: "a1",
      actor: "Sarah Chen",
      action: "Updated merchant profile",
      resource: "Merchant m3",
      at: new Date().toISOString(),
      severity: "info",
    },
    {
      id: "a2",
      actor: "System",
      action: "Kiosk health check batch",
      resource: "Kiosk k2",
      at: new Date(Date.now() - 3600_000).toISOString(),
      severity: "warning",
    },
    {
      id: "a3",
      actor: "Sagar JAdhav",
      action: "Exported user directory",
      resource: "Users",
      at: new Date(Date.now() - 86400_000).toISOString(),
      severity: "info",
    },
  ];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
