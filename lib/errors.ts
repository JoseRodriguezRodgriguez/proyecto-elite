export function getErrorMessage(
  error: unknown,
  fallback = "Error desconocido"
): string {
  return error instanceof Error ? error.message : fallback;
}