import { AccountStatus, Prisma } from "@prisma/client";
import { ADMIN_ROLE } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";

export async function countActiveAdmins(
  tx: Prisma.TransactionClient = prisma
): Promise<number> {
  return tx.employee.count({
    where: {
      role: ADMIN_ROLE,
      accountStatus: AccountStatus.ACTIVE,
    },
  });
}

export async function assertCanDisableEmployee(
  target: { id: number; role: string; accountStatus: AccountStatus },
  actorId: number,
  tx: Prisma.TransactionClient = prisma
): Promise<void> {
  if (target.id === actorId) {
    throw new Error("You cannot disable your own account.");
  }

  if (
    target.role === ADMIN_ROLE &&
    target.accountStatus === AccountStatus.ACTIVE
  ) {
    const activeAdmins = await countActiveAdmins(tx);
    if (activeAdmins <= 1) {
      throw new Error("Cannot disable the last active administrator.");
    }
  }
}
