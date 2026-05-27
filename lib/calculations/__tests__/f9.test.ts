import { calcGpaTrajectory, type GradeUpdateInput } from "../f9";

describe("F9 — GPA Trajectory", () => {
  it("TC9 — insufficient data forces Insufficient tier and regression_flag false", () => {
    const updates: GradeUpdateInput[] = [
      {
        observed_grade: "B",
        observed_at: new Date("2026-05-01"),
        data_source_class: "C",
      },
      {
        observed_grade: "C",
        observed_at: new Date("2026-05-11"),
        data_source_class: "C",
      },
    ];

    const result = calcGpaTrajectory(updates, new Date("2026-05-20"));
    expect(result.evidence_tier).toBe("Insufficient");
    expect(result.insufficient_reason).toBe("below_minimum_observations");
    expect(result.regression_flag).toBe(false);
    expect(result.slope).not.toBeNull();
  });

  it("TC9b — CI crossing zero returns flat_or_uncertain direction", () => {
    const updates: GradeUpdateInput[] = [
      {
        observed_grade: "B",
        observed_at: new Date("2026-04-01"),
        data_source_class: "C",
      },
      {
        observed_grade: "C",
        observed_at: new Date("2026-04-15"),
        data_source_class: "C",
      },
      {
        observed_grade: "B",
        observed_at: new Date("2026-04-28"),
        data_source_class: "C",
      },
      {
        observed_grade: "C",
        observed_at: new Date("2026-05-11"),
        data_source_class: "C",
      },
    ];

    const result = calcGpaTrajectory(updates, new Date("2026-05-12"));
    expect(result.direction).toBe("flat_or_uncertain");
    expect(result.confidence_interval).not.toBeNull();
  });

  it("TC9c — mixed source class downgrades to Provisional with effective class A", () => {
    const updates: GradeUpdateInput[] = [
      {
        observed_grade: "B",
        observed_at: new Date("2026-04-01"),
        data_source_class: "C",
      },
      {
        observed_grade: "B",
        observed_at: new Date("2026-04-20"),
        data_source_class: "B",
      },
      {
        observed_grade: "A",
        observed_at: new Date("2026-05-10"),
        data_source_class: "C",
      },
    ];

    const result = calcGpaTrajectory(updates, new Date("2026-05-15"));
    expect(result.data_class_effective).toBe("A");
    expect(result.evidence_tier).toBe("Provisional");
  });
});
