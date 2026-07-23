import { requireAdminPage } from "@/lib/auth/session";

/**
 * Server-side guard for /employees and any nested routes under it.
 * The page itself remains a Client Component; authorization runs here first.
 */
export default async function EmployeesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();
  return children;
}
