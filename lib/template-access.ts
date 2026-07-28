export function getTemplateAccessEmail(): string | undefined {
  return process.env.TEMPLATE_ACCESS_EMAIL?.toLowerCase().trim() || undefined;
}

export function canAccessEnqueteTemplate(email?: string | null): boolean {
  const allowed = getTemplateAccessEmail();
  if (!allowed || !email) return false;
  return email.toLowerCase().trim() === allowed;
}
