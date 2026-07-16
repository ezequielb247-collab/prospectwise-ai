type DatabaseError = { code?: unknown; message?: unknown };
export function logDatabaseError(input: {
  table: string;
  operation: string;
  error: DatabaseError;
  authenticated: boolean;
}) {
  console.error("database_operation_failed", {
    table: input.table,
    operation: input.operation,
    code: typeof input.error.code === "string" ? input.error.code : "unknown",
    message:
      typeof input.error.message === "string"
        ? input.error.message
        : "Database operation failed",
    authenticated: input.authenticated,
  });
}
