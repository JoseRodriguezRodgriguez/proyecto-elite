import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import { requireActivePage } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const {
    employee,
  } = await requireActivePage();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentUser={{
          name: employee.name,
          username: employee.user,
          role: employee.role,
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto bg-white p-6">
          {children}
        </main>
      </div>
    </div>
  );
}