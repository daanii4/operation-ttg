const FALLBACK_ACTION_PROSE: Record<string, string> = {
  pivot_to_d2_register_eligibility_center:
    "Open the NCAA Division II pathway immediately. Confirm the student's Eligibility Center account and review DII core-course requirements with the family.",
  evaluate_post_grad_exception:
    "Evaluate whether a post-graduation core-course exception could keep an NCAA path open after senior year.",
  schedule_juco_pathway_conversation:
    "Schedule a JUCO pathway conversation that keeps college athletics visible while the student rebuilds academic eligibility.",
};

export function translateFallbackAction(code: string): string {
  return (
    FALLBACK_ACTION_PROSE[code] ??
    "Review this pathway action with the advisor team before the next student meeting."
  );
}
