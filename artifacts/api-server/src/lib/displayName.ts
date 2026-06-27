export function resolveDisplayName(
  displayName: string | null | undefined,
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  if (displayName) return displayName;
  const full = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return full || "Student";
}
