"use client";

/**
 * Sprint 6 / Workstream C-4 — Team management UI (owner-only).
 *
 * Sections:
 *   • Team members table — name / email / role / students assigned / actions
 *   • Pending invites table
 *   • Invite form (email + role)
 *   • Per-row Assign students sheet
 */

import * as React from "react";
import Link from "next/link";
import {
  Loader2,
  Mail,
  RefreshCcw,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { AdvisorRole } from "@prisma/client";
import { Button, Input } from "@/components/ui/qn";

type Member = {
  advisorId: string;
  email: string | null;
  displayName: string | null;
  teamRole: AdvisorRole;
  studentsAssigned: number;
};

type Invite = {
  id: string;
  email: string;
  role: AdvisorRole;
  invitedBy: string;
  expiresAt: string;
};

type TeamSnapshot = { members: Member[]; invites: Invite[] };

type Student = {
  studentId: string;
  firstName: string;
  lastName: string;
  sport: string;
  grade: number;
};

export interface TeamPageClientProps {
  callerAdvisorId: string;
  callerRole: AdvisorRole;
  team: TeamSnapshot;
  students: Student[];
}

const ROLE_LABEL: Record<AdvisorRole, string> = {
  owner: "Owner",
  advisor: "Advisor",
  viewer: "Viewer",
};

export default function TeamPageClient({
  callerAdvisorId,
  team,
  students,
}: TeamPageClientProps) {
  const [snapshot, setSnapshot] = React.useState<TeamSnapshot>(team);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<"advisor" | "viewer">("advisor");
  const [assigning, setAssigning] = React.useState<Member | null>(null);

  const refresh = React.useCallback(async () => {
    const res = await fetch("/api/team", { cache: "no-store" });
    if (res.ok) setSnapshot((await res.json()) as TeamSnapshot);
  }, []);

  const onChangeRole = async (advisorId: string, role: AdvisorRole) => {
    setBusy(`role:${advisorId}`);
    try {
      const res = await fetch("/api/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advisorId, role }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Failed to update role (${res.status})`);
      }
      toast.success("Role updated");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update role");
    } finally {
      setBusy(null);
    }
  };

  const onRemove = async (advisorId: string) => {
    if (
      !window.confirm(
        "Remove this advisor from the team? Their assigned students will be transferred to you."
      )
    )
      return;
    setBusy(`remove:${advisorId}`);
    try {
      const res = await fetch("/api/team/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advisorId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Failed to remove (${res.status})`);
      }
      toast.success("Advisor removed");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't remove advisor");
    } finally {
      setBusy(null);
    }
  };

  const onInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setBusy("invite");
    try {
      const res = await fetch("/api/team/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Invite failed (${res.status})`);
      }
      const payload = (await res.json()) as {
        data: { emailDelivered: boolean; acceptUrl: string };
      };
      if (payload.data.emailDelivered) {
        toast.success("Invite emailed", {
          description: inviteEmail.trim(),
        });
      } else {
        toast.success("Invite created — share the link manually", {
          description: payload.data.acceptUrl,
          duration: Infinity,
          action: {
            label: "Copy",
            onClick: () => {
              void navigator.clipboard.writeText(payload.data.acceptUrl);
            },
          },
        });
      }
      setInviteEmail("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invite failed");
    } finally {
      setBusy(null);
    }
  };

  const onSaveAssignments = async (advisorId: string, studentIds: string[]) => {
    setBusy(`assign:${advisorId}`);
    try {
      const res = await fetch("/api/team/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advisorId, studentIds }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Assignment failed (${res.status})`);
      }
      toast.success("Assignments saved");
      await refresh();
      setAssigning(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save assignments");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Settings
        </p>
        <h1
          className="font-serif"
          style={{ fontSize: 28, lineHeight: "36px", color: "var(--color-text)", marginTop: 4 }}
        >
          Team
        </h1>
        <p style={{ marginTop: 4, fontSize: 13, color: "var(--color-muted)" }}>
          Manage advisors, roles, and student assignments. Owners can invite
          advisors and assign students to them.
        </p>
        <div className="mt-3">
          <Link
            href="/dashboard/settings"
            className="text-[12px] font-medium"
            style={{ color: "var(--color-green)" }}
          >
            ← Back to Settings
          </Link>
        </div>
      </header>

      <Section title="Team members">
        <div
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--color-row-alt)" }}>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th width={140}>Role</Th>
                <Th width={120}>Students</Th>
                <Th width={220} align="right">
                  Actions
                </Th>
              </tr>
            </thead>
            <tbody>
              {snapshot.members.map((m) => {
                const isSelf = m.advisorId === callerAdvisorId;
                return (
                  <tr
                    key={m.advisorId}
                    style={{ borderTop: "1px solid var(--color-border)" }}
                  >
                    <Td>{m.displayName ?? "(name pending)"}</Td>
                    <Td>{m.email ?? "—"}</Td>
                    <Td>
                      <RoleSelect
                        value={m.teamRole}
                        disabled={isSelf || busy === `role:${m.advisorId}`}
                        onChange={(role) => onChangeRole(m.advisorId, role)}
                      />
                    </Td>
                    <Td>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 13,
                          color: "var(--color-text)",
                        }}
                      >
                        {m.studentsAssigned}
                      </span>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          icon={Users}
                          onClick={() => setAssigning(m)}
                          disabled={busy === `assign:${m.advisorId}`}
                        >
                          Assign students
                        </Button>
                        <Button
                          variant="danger"
                          icon={Trash2}
                          disabled={isSelf || busy === `remove:${m.advisorId}`}
                          onClick={() => onRemove(m.advisorId)}
                        >
                          Remove
                        </Button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Invite advisor">
        <form
          onSubmit={onInvite}
          className="flex flex-wrap items-end gap-3"
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div style={{ minWidth: 280, flex: 1 }}>
            <Input
              label="Email"
              type="email"
              placeholder="advisor@school.edu"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <label className="flex flex-col gap-1">
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--color-muted)",
              }}
            >
              Role
            </span>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "advisor" | "viewer")}
              className="rounded-md border bg-white"
              style={{
                height: 36,
                paddingLeft: 12,
                paddingRight: 12,
                fontSize: 13,
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              <option value="advisor">Advisor</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
          <Button
            type="submit"
            variant="primary"
            icon={Mail}
            loading={busy === "invite"}
            loadingLabel="Sending…"
          >
            Send invite
          </Button>
        </form>
      </Section>

      {snapshot.invites.length > 0 ? (
        <Section title="Pending invites">
          <div
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--color-row-alt)" }}>
                  <Th>Email</Th>
                  <Th width={140}>Role</Th>
                  <Th>Expires</Th>
                </tr>
              </thead>
              <tbody>
                {snapshot.invites.map((inv) => (
                  <tr
                    key={inv.id}
                    style={{ borderTop: "1px solid var(--color-border)" }}
                  >
                    <Td>{inv.email}</Td>
                    <Td>
                      <RoleBadge role={inv.role} pending />
                    </Td>
                    <Td>{new Date(inv.expiresAt).toLocaleDateString()}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      <div className="flex justify-end">
        <Button variant="ghost" icon={RefreshCcw} onClick={refresh}>
          Refresh
        </Button>
      </div>

      {assigning ? (
        <AssignmentSheet
          member={assigning}
          students={students}
          busy={busy === `assign:${assigning.advisorId}`}
          onClose={() => setAssigning(null)}
          onSave={(ids) => onSaveAssignments(assigning.advisorId, ids)}
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2
        className="text-base font-semibold"
        style={{ color: "var(--color-text)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: AdvisorRole;
  onChange: (role: AdvisorRole) => void;
  disabled: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as AdvisorRole)}
      className="rounded-md border bg-white"
      style={{
        height: 32,
        paddingLeft: 8,
        paddingRight: 8,
        fontSize: 13,
        borderColor: "var(--color-border)",
        color: "var(--color-text)",
      }}
    >
      <option value="owner">Owner</option>
      <option value="advisor">Advisor</option>
      <option value="viewer">Viewer</option>
    </select>
  );
}

function RoleBadge({
  role,
  pending,
}: {
  role: AdvisorRole;
  pending?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full"
      style={{
        padding: "2px 8px",
        background: pending ? "var(--color-yellow-tint)" : "var(--color-row-alt)",
        color: pending ? "#92400E" : "var(--color-text)",
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {ROLE_LABEL[role]}
      {pending ? <span style={{ fontSize: 10 }}>· pending</span> : null}
    </span>
  );
}

function AssignmentSheet({
  member,
  students,
  busy,
  onSave,
  onClose,
}: {
  member: Member;
  students: Student[];
  busy: boolean;
  onSave: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [filter, setFilter] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/team", { cache: "no-store" });
      if (!res.ok || cancelled) return;
      void (await res.json());
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const filtered = students.filter((s) => {
    if (!filter) return true;
    const hay = `${s.firstName} ${s.lastName} ${s.sport}`.toLowerCase();
    return hay.includes(filter.toLowerCase());
  });

  return (
    <div role="dialog" aria-modal="true" aria-label="Assign students">
      <div
        aria-hidden
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 60 }}
      />
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: "min(480px, 100vw)",
          background: "var(--color-bg)",
          zIndex: 65,
          boxShadow: "var(--shadow-sheet)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          className="flex items-center justify-between"
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
              Assign students
            </h2>
            <p style={{ fontSize: 12, color: "var(--color-muted)" }}>
              {member.displayName ?? member.email ?? member.advisorId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            style={{ color: "var(--color-muted)" }}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div style={{ padding: 16, borderBottom: "1px solid var(--color-border)" }}>
          <Input
            placeholder="Filter students"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter students"
          />
        </div>

        <ul role="list" className="flex-1 overflow-y-auto" style={{ padding: 8 }}>
          {!loaded ? (
            <li
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 32,
                color: "var(--color-muted)",
              }}
            >
              <Loader2 size={16} className="animate-spin" aria-hidden />
            </li>
          ) : (
            filtered.map((s) => {
              const checked = selected.has(s.studentId);
              return (
                <li key={s.studentId}>
                  <label
                    className="flex items-center justify-between gap-3 rounded-md"
                    style={{
                      padding: "10px 12px",
                      cursor: "pointer",
                      background: checked ? "var(--color-green-tint)" : "transparent",
                    }}
                  >
                    <div>
                      <p
                        style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}
                      >
                        {s.firstName} {s.lastName}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--color-muted)" }}>
                        Grade {s.grade} · {s.sport}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(s.studentId)}
                      className="h-4 w-4 accent-[var(--color-green)]"
                    />
                  </label>
                </li>
              );
            })
          )}
        </ul>

        <footer
          style={{
            padding: 16,
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={busy}
            loadingLabel="Saving…"
            onClick={() => onSave(Array.from(selected))}
          >
            Save assignments
          </Button>
        </footer>
      </div>
    </div>
  );
}

function Th({
  children,
  width,
  align,
}: {
  children: React.ReactNode;
  width?: number;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      style={{
        textAlign: align ?? "left",
        padding: "10px 12px",
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--color-muted)",
        width,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      style={{
        textAlign: align ?? "left",
        padding: "10px 12px",
        fontSize: 13,
        color: "var(--color-text)",
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}
