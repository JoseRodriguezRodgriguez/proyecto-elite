import type { AccountStatus, Employee } from "@prisma/client";

export type PublicEmployee = {
  id: number;
  name: string;
  role: string;
  phone: string;
  user: string;
  accountStatus: AccountStatus;
  activationExpiresAt: string | null;
  hasPendingActivation: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type EmployeeSafeSource = Pick<
  Employee,
  | "id"
  | "name"
  | "role"
  | "phone"
  | "user"
  | "accountStatus"
  | "activationTokenHash"
  | "activationExpiresAt"
  | "lastLoginAt"
  | "createdAt"
  | "updatedAt"
>;

export function toPublicEmployee(employee: EmployeeSafeSource): PublicEmployee {
  const now = Date.now();
  const hasPendingActivation = Boolean(
    employee.activationTokenHash &&
      employee.activationExpiresAt &&
      employee.activationExpiresAt.getTime() > now
  );

  return {
    id: employee.id,
    name: employee.name,
    role: employee.role,
    phone: employee.phone,
    user: employee.user,
    accountStatus: employee.accountStatus,
    activationExpiresAt: employee.activationExpiresAt
      ? employee.activationExpiresAt.toISOString()
      : null,
    hasPendingActivation,
    lastLoginAt: employee.lastLoginAt
      ? employee.lastLoginAt.toISOString()
      : null,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };
}

export const employeePublicSelect = {
  id: true,
  name: true,
  role: true,
  phone: true,
  user: true,
  accountStatus: true,
  activationTokenHash: true,
  activationExpiresAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;
