import {
  getNextRoadmapFocus,
  getProductRoadmapSnapshot,
} from "../resolve-roadmap";

describe("product roadmap", () => {
  it("resolves v0.1 as LIVE with F5 live", () => {
    const snapshot = getProductRoadmapSnapshot();
    const v01 = snapshot.phases.find((p) => p.id === "v0.1");
    expect(v01?.status).toBe("LIVE");
    const f5 = v01?.items.find((i) => i.id === "f5-10-7");
    expect(f5?.status).toBe("live");
  });

  it("marks band chart live when mounted on cohort analytics page", () => {
    const snapshot = getProductRoadmapSnapshot();
    const v01 = snapshot.phases.find((p) => p.id === "v0.1");
    const chart = v01?.items.find((i) => i.id === "cohort-band-chart");
    expect(chart?.status).toBe("live");
  });

  it("resolves v0.2 as IN_BUILD with Supabase auth live and DB reads planned", () => {
    const snapshot = getProductRoadmapSnapshot();
    const v02 = snapshot.phases.find((p) => p.id === "v0.2");
    expect(v02?.status).toBe("IN_BUILD");
    expect(v02?.items.find((i) => i.id === "f1-f7-calcs")?.status).toBe("live");
    expect(v02?.items.find((i) => i.id === "auth-supabase")?.status).toBe("live");
    expect(v02?.items.find((i) => i.id === "db-cohort-reads")?.status).toBe("planned");
  });

  it("returns next focus as highest-priority non-live item", () => {
    const next = getNextRoadmapFocus();
    expect(next).not.toBeNull();
    expect(next!.capabilityId).toBe("db-cohort-reads");
    expect(next!.status).toBe("planned");
  });
});
