import { calcEngagementMetrics, type EngagementObservationInput } from "../f11";

describe("F11 — Engagement Metrics", () => {
  it("TC11 — insufficient observations", () => {
    const observations: EngagementObservationInput[] = [
      {
        observed_at: new Date("2026-05-01"),
        engagement_type: "practice_attendance",
        value: 1,
        data_source_class: "C",
      },
      {
        observed_at: new Date("2026-05-08"),
        engagement_type: "academic_session",
        value: 0.5,
        data_source_class: "C",
      },
    ];

    const result = calcEngagementMetrics(observations, {}, new Date("2026-05-20"));
    expect(result.evidence_tier).toBe("Insufficient");
    expect(result.insufficient_reason).toBe("below_minimum_observations");
    expect(result.trend).toBe("insufficient");
    expect(result.window_avg).toBeNull();
  });

  it("TC11b — withdrawal flag fires with 3 consecutive absences", () => {
    const observations: EngagementObservationInput[] = [
      {
        observed_at: new Date("2026-05-01"),
        engagement_type: "practice_attendance",
        value: 1,
        data_source_class: "C",
      },
      {
        observed_at: new Date("2026-05-08"),
        engagement_type: "practice_attendance",
        value: 0,
        data_source_class: "C",
      },
      {
        observed_at: new Date("2026-05-12"),
        engagement_type: "practice_attendance",
        value: 0,
        data_source_class: "C",
      },
      {
        observed_at: new Date("2026-05-16"),
        engagement_type: "practice_attendance",
        value: 0,
        data_source_class: "C",
      },
    ];

    const result = calcEngagementMetrics(observations, {}, new Date("2026-05-20"));
    expect(result.withdrawal_flag).toBe(true);
    expect(result.consecutive_absences).toBe(3);
  });

  it("TC11c — low engagement flag with average below 0.40", () => {
    const observations: EngagementObservationInput[] = [
      {
        observed_at: new Date("2026-05-01"),
        engagement_type: "academic_session",
        value: 0.3,
        data_source_class: "C",
      },
      {
        observed_at: new Date("2026-05-05"),
        engagement_type: "team_activity",
        value: 0.2,
        data_source_class: "C",
      },
      {
        observed_at: new Date("2026-05-10"),
        engagement_type: "advisor_contact",
        value: 0.35,
        data_source_class: "C",
      },
      {
        observed_at: new Date("2026-05-13"),
        engagement_type: "self_report_motivation",
        value: 0.25,
        data_source_class: "C",
      },
    ];

    const result = calcEngagementMetrics(observations, {}, new Date("2026-05-20"));
    expect(result.low_engagement_flag).toBe(true);
    expect(result.window_avg).toBeLessThan(0.4);
  });
});
