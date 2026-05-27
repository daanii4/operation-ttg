import { calcAimsRiskSignal, type AimsAssessmentInput } from "../f10";

const THRESHOLD_CONFIG = {
  method: "within_subject_pct_delta_v0.1_placeholder",
  pct_delta_threshold: 0.2, // THRESHOLD_PENDING_D3: placeholder 20% delta — replace with SD-based config from Brewer et al. when D3 delivers
};

describe("F10 — AIMS Risk Signal", () => {
  it("TC10 — baseline only returns Insufficient", () => {
    const assessments: AimsAssessmentInput[] = [
      {
        social_identity_score: 40,
        exclusivity_score: 30,
        negative_affectivity_score: 20,
        administered_at: new Date("2026-05-01"),
        aims_version: "AIMS-2",
      },
    ];

    const result = calcAimsRiskSignal(assessments, THRESHOLD_CONFIG);
    expect(result.risk_band).toBe("Insufficient");
    expect(result.evidence_tier).toBe("Insufficient");
    expect(result.insufficient_reason).toBe("baseline_only_no_delta");
    expect(result.cross_layer_flags).toEqual([]);
    expect(result.within_subject_delta_pct).toBeNull();
  });

  it("TC10b — version mismatch returns Insufficient with mismatch flag", () => {
    const assessments: AimsAssessmentInput[] = [
      {
        social_identity_score: 40,
        exclusivity_score: 30,
        negative_affectivity_score: 20,
        administered_at: new Date("2026-04-01"),
        aims_version: "AIMS-2",
      },
      {
        social_identity_score: 41,
        exclusivity_score: 31,
        negative_affectivity_score: 19,
        administered_at: new Date("2026-05-01"),
        aims_version: "AIMS-3",
      },
    ];

    const result = calcAimsRiskSignal(assessments, THRESHOLD_CONFIG);
    expect(result.risk_band).toBe("Insufficient");
    expect(result.version_mismatch).toBe(true);
    expect(result.insufficient_reason).toBe("version_mismatch");
  });

  it("TC10c — two-admin normal case with delta below 20% is Low risk", () => {
    const assessments: AimsAssessmentInput[] = [
      {
        social_identity_score: 40,
        exclusivity_score: 30,
        negative_affectivity_score: 20,
        administered_at: new Date("2026-04-01"),
        aims_version: "AIMS-2",
      },
      {
        social_identity_score: 41,
        exclusivity_score: 31,
        negative_affectivity_score: 21,
        administered_at: new Date("2026-05-01"),
        aims_version: "AIMS-2",
      },
    ];

    const result = calcAimsRiskSignal(assessments, THRESHOLD_CONFIG);
    expect(result.risk_band).toBe("Low");
    expect(result.evidence_tier).toBe("Strong");
  });
});
