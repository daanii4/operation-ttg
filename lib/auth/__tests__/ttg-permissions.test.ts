/**
 * Sprint 6 / Workstream C — permission table tests.
 */

import {
  PermissionError,
  ROLE_PERMISSIONS,
  assertPermission,
  hasPermission,
} from "../ttg-permissions";

describe("ttg-permissions", () => {
  it("owner has every permission", () => {
    expect(hasPermission("owner", "team:manage")).toBe(true);
    expect(hasPermission("owner", "student:assign")).toBe(true);
    expect(hasPermission("owner", "export:all")).toBe(true);
    expect(hasPermission("owner", "export:own")).toBe(true);
    expect(hasPermission("owner", "student:read")).toBe(true);
    expect(hasPermission("owner", "student:write")).toBe(true);
  });

  it("advisor can read/write students + export own but cannot manage team", () => {
    expect(hasPermission("advisor", "student:read")).toBe(true);
    expect(hasPermission("advisor", "student:write")).toBe(true);
    expect(hasPermission("advisor", "export:own")).toBe(true);
    expect(hasPermission("advisor", "team:manage")).toBe(false);
    expect(hasPermission("advisor", "student:assign")).toBe(false);
    expect(hasPermission("advisor", "export:all")).toBe(false);
  });

  it("viewer is read-only", () => {
    expect(hasPermission("viewer", "student:read")).toBe(true);
    expect(hasPermission("viewer", "student:write")).toBe(false);
    expect(hasPermission("viewer", "export:own")).toBe(false);
    expect(hasPermission("viewer", "team:manage")).toBe(false);
  });

  it("assertPermission throws PermissionError for denied permissions", () => {
    expect(() => assertPermission("advisor", "team:manage")).toThrow(PermissionError);
    expect(() => assertPermission("viewer", "student:write")).toThrow(PermissionError);
  });

  it("assertPermission no-ops for granted permissions", () => {
    expect(() => assertPermission("owner", "team:manage")).not.toThrow();
    expect(() => assertPermission("advisor", "student:read")).not.toThrow();
  });

  it("PermissionError encodes the missing permission", () => {
    try {
      assertPermission("advisor", "export:all");
      throw new Error("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(PermissionError);
      expect((err as PermissionError).permission).toBe("export:all");
      expect((err as Error).message).toContain("export:all");
    }
  });

  it("permission table is consistent with snapshot expectations", () => {
    // Snapshot the role -> permission count to catch silent additions.
    expect(ROLE_PERMISSIONS.owner.length).toBe(6);
    expect(ROLE_PERMISSIONS.advisor.length).toBe(3);
    expect(ROLE_PERMISSIONS.viewer.length).toBe(1);
  });
});
