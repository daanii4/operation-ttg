/** NCAA HS Portal and UC A-G CMP deep links for a school. */
export function buildNcaaPortalUrl(ceebCode: string): string {
  return `https://web3.ncaa.org/hsportal/exec/ceebSearch?ceebCode=${encodeURIComponent(ceebCode)}`;
}

export function buildUcAgListUrl(ucInstitutionId: string | null | undefined): string {
  if (!ucInstitutionId) {
    return "https://hs-articulation.ucop.edu/agcourselist";
  }
  return `https://hs-articulation.ucop.edu/agcourselist/institution/${encodeURIComponent(ucInstitutionId)}`;
}
