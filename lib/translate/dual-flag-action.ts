const DUAL_FLAG_ACTION_PROSE: Record<string, string> = {
  credit_recovery_to_C_or_higher:
    "Enroll in summer credit recovery to replace the D grade with a C or higher so the course can satisfy the UC A-G requirement.",
};

export function translateDualFlagAction(code: string): string {
  return (
    DUAL_FLAG_ACTION_PROSE[code] ??
    "Review the course record with the counselor and registrar before advising the student."
  );
}
