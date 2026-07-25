import DashboardShell from "@/components/dashboard/dashboard-shell";
import { requireActivePage } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { employee } =
    await requireActivePage();

  return (
    <DashboardShell
      currentUser={{
        name: employee.name,
        username: employee.user,
        role: employee.role,
      }}
    >
      {children}
    </DashboardShell>
  );
}