import { Role } from "@prisma/client";

export function isSuperAdmin(role?: string | null): boolean {
  return role === Role.SUPERADMIN;
}

export function getSuperAdminEmail(): string | undefined {
  return process.env.SUPERADMIN_EMAIL?.toLowerCase().trim() || undefined;
}

export function resolveRoleForEmail(email: string): Role {
  const superEmail = getSuperAdminEmail();
  if (superEmail && email.toLowerCase() === superEmail) {
    return Role.SUPERADMIN;
  }
  return Role.USER;
}
