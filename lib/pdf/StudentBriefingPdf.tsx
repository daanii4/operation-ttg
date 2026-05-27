/**
 * Sprint 5 — Student Briefing PDF
 *
 * Renders one student's F12 master briefing as a Letter-format PDF.
 * The same component is reused for the Cohort Summary (one page per student
 * in `condensed` mode).
 */

import * as React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { PDF_COLORS, bandColor } from "./colors";
import type { StudentBriefingRecord } from "@/lib/eligibility/build-student-briefing";
import { INTERVENTION_LABELS } from "@/lib/calculations/intervention-labels";
import type { InterventionCode } from "@/lib/calculations/types";

const PRIORITY_DOT_COLOR: Record<InterventionCode, string> = {
  IMMEDIATE_ADVISOR_CONTACT: PDF_COLORS.RED,
  D1_PATHWAY_REVIEW: PDF_COLORS.YELLOW,
  GPA_RECOVERY_PLAN: PDF_COLORS.YELLOW,
  AIMS_FOLLOW_UP: PDF_COLORS.YELLOW,
  MONITOR_ENGAGEMENT: PDF_COLORS.YELLOW,
  TRANSCRIPT_AUDIT: PDF_COLORS.YELLOW,
  SCHEDULE_ACADEMIC_SUPPORT: PDF_COLORS.YELLOW,
  NO_ACTION_REQUIRED: PDF_COLORS.GREEN,
};

interface BriefingPdfProps {
  record: StudentBriefingRecord;
  advisorName?: string;
  generatedAt: Date;
  /** Render condensed for cohort pages (smaller fonts, single page). */
  condensed?: boolean;
}

const styles = StyleSheet.create({
  page: {
    padding: 54, // 0.75in @ 72 dpi
    fontFamily: "Helvetica",
    fontSize: 10,
    color: PDF_COLORS.TEXT,
  },
  pageCondensed: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: PDF_COLORS.TEXT,
  },
  studentName: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  studentNameCondensed: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  metaLine: {
    fontSize: 12,
    color: PDF_COLORS.TEXT,
    marginBottom: 1,
  },
  metaLineCondensed: { fontSize: 10, color: PDF_COLORS.TEXT },
  generatedDate: {
    fontSize: 10,
    color: PDF_COLORS.MUTED,
    marginBottom: 14,
  },
  bandBlock: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 4,
    marginBottom: 14,
  },
  bandBlockText: {
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
  },
  bandBlockSub: {
    color: "#FFFFFF",
    fontSize: 10,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    marginTop: 10,
  },
  list: { flexDirection: "column" },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    marginTop: 4,
  },
  bullet: { fontSize: 10 },
  table: { width: "100%", marginTop: 4 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.ROW_ALT,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.BORDER,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.BORDER,
  },
  tableRowAlt: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.ROW_ALT,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.BORDER,
  },
  td: {
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: 9,
  },
  thLabel: { width: "33%", fontFamily: "Helvetica-Bold" },
  thStatus: { width: "33%", fontFamily: "Helvetica-Bold" },
  thFlag: { width: "34%", fontFamily: "Helvetica-Bold" },
  twoColumn: { flexDirection: "row", gap: 8, marginTop: 4 },
  column: { flex: 1, padding: 6, borderWidth: 1, borderColor: PDF_COLORS.BORDER, borderRadius: 4 },
  subHeader: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  agBar: {
    height: 6,
    backgroundColor: PDF_COLORS.ROW_ALT,
    borderRadius: 3,
    marginVertical: 2,
    overflow: "hidden",
  },
  agBarFill: { height: 6, backgroundColor: PDF_COLORS.GREEN },
  agRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 1, fontSize: 9 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  footer: {
    position: "absolute",
    left: 54,
    right: 54,
    bottom: 28,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.BORDER,
    paddingTop: 6,
    fontSize: 8,
    color: PDF_COLORS.MUTED,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pageNumber: { fontSize: 8, color: PDF_COLORS.MUTED },
});

export function StudentBriefingPdf(props: BriefingPdfProps) {
  return (
    <Document>
      <Page size="LETTER" style={props.condensed ? styles.pageCondensed : styles.page}>
        <BriefingBody {...props} />
        <BriefingFooter {...props} />
      </Page>
    </Document>
  );
}

export function BriefingBody({ record, condensed }: BriefingPdfProps) {
  const { header, f12, bundle, f9, f10, f11 } = record;
  const compositeColor = bandColor(f12.composite_band);

  return (
    <>
      <View>
        <Text style={condensed ? styles.studentNameCondensed : styles.studentName}>
          {header.fullName}
        </Text>
        <Text style={condensed ? styles.metaLineCondensed : styles.metaLine}>
          {header.sport} · {header.targetDivision}
        </Text>
        <Text style={condensed ? styles.metaLineCondensed : styles.metaLine}>
          Class of {header.graduationYear} · {header.highSchoolName}
        </Text>
        <Text style={styles.generatedDate}>
          Generated {new Date(record.computedAt).toLocaleString()}
        </Text>
      </View>

      <View style={[styles.bandBlock, { backgroundColor: compositeColor }]}>
        <Text style={styles.bandBlockText}>Composite band: {f12.composite_band}</Text>
        {f12.weeks_to_critical_action != null && (
          <Text style={styles.bandBlockSub}>
            {f12.weeks_to_critical_action === 0
              ? "Immediate action required"
              : `~${f12.weeks_to_critical_action} week(s) to critical action`}
          </Text>
        )}
        {f12.primary_concern && (
          <Text style={styles.bandBlockSub}>Primary concern: {f12.primary_concern}</Text>
        )}
      </View>

      <Text style={styles.sectionHeader}>Intervention Actions</Text>
      <View style={styles.list}>
        {f12.intervention_codes.map((code) => (
          <View key={code} style={styles.listItem}>
            <View style={[styles.dot, { backgroundColor: PRIORITY_DOT_COLOR[code] ?? PDF_COLORS.YELLOW }]} />
            <Text style={styles.bullet}>{INTERVENTION_LABELS[code]}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionHeader}>Layer Summary</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.td, styles.thLabel]}>Layer</Text>
          <Text style={[styles.td, styles.thStatus]}>Status</Text>
          <Text style={[styles.td, styles.thFlag]}>Flag</Text>
        </View>
        {layerRows(f12).map((row, idx) => (
          <View key={row.layer} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.td, { width: "33%" }]}>{row.layer}</Text>
            <Text style={[styles.td, { width: "33%", color: row.statusColor ?? PDF_COLORS.TEXT }]}>
              {row.status}
            </Text>
            <Text style={[styles.td, { width: "34%" }]}>{row.flag}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionHeader}>Eligibility Detail</Text>
      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <Text style={styles.subHeader}>A-G completion</Text>
          {Object.entries(bundle.f1.perCategory).map(([cat, info]) => (
            <View key={cat}>
              <View style={styles.agRow}>
                <Text>Cat {cat.toUpperCase()}</Text>
                <Text>
                  {info.completedYears.toFixed(1)} / {info.requiredYears.toFixed(1)} yr
                </Text>
              </View>
              <View style={styles.agBar}>
                <View
                  style={[
                    styles.agBarFill,
                    {
                      width: `${Math.min(100, (info.completedYears / info.requiredYears) * 100)}%`,
                      backgroundColor: info.complete ? PDF_COLORS.GREEN : PDF_COLORS.YELLOW,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
          <Text style={[styles.detailRow, { marginTop: 4 }]}>
            {bundle.f1.fullyComplete ? "All A-G categories complete" : "A-G categories outstanding"}
          </Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.subHeader}>NCAA D1 completion</Text>
          {Object.entries(bundle.f3.perCategory).map(([cat, info]) => (
            <View key={cat}>
              <View style={styles.agRow}>
                <Text>{cat}</Text>
                <Text>
                  {info.completedYears.toFixed(1)} / {info.requiredYears.toFixed(1)} yr
                </Text>
              </View>
              <View style={styles.agBar}>
                <View
                  style={[
                    styles.agBarFill,
                    {
                      width: `${Math.min(100, (info.completedYears / info.requiredYears) * 100)}%`,
                      backgroundColor: info.complete ? PDF_COLORS.GREEN : PDF_COLORS.YELLOW,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
          <Text style={[styles.detailRow, { marginTop: 4 }]}>
            {bundle.f3.fullyComplete ? "All NCAA D1 cores complete" : "NCAA D1 cores outstanding"}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>GPA Trajectory (F9)</Text>
      <View style={styles.detailRow}>
        <Text>Direction</Text>
        <Text>{f9.direction ?? "—"}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text>Slope</Text>
        <Text>{f9.slope != null ? f9.slope.toFixed(3) : "—"}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text>Regression flag</Text>
        <Text>{f9.regression_flag ? "Yes" : "No"}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text>Evidence tier</Text>
        <Text>{f9.evidence_tier}</Text>
      </View>

      <Text style={styles.sectionHeader}>AIMS Signal (F10)</Text>
      <View style={styles.detailRow}>
        <Text>Risk band</Text>
        <Text>{f10.risk_band}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text>Within-subject Δ%</Text>
        <Text>
          {f10.within_subject_delta_pct != null
            ? `${(f10.within_subject_delta_pct * 100).toFixed(1)}%`
            : "—"}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text>Cross-layer flags</Text>
        <Text>{f10.cross_layer_flags.length ? f10.cross_layer_flags.join(", ") : "None"}</Text>
      </View>

      <Text style={styles.sectionHeader}>Engagement (F11)</Text>
      <View style={styles.detailRow}>
        <Text>Window average</Text>
        <Text>{f11.window_avg != null ? f11.window_avg.toFixed(2) : "—"}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text>Trend</Text>
        <Text>{f11.trend}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text>Withdrawal flag</Text>
        <Text>{f11.withdrawal_flag ? "Yes" : "No"}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text>Consecutive absences</Text>
        <Text>{String(f11.consecutive_absences)}</Text>
      </View>
    </>
  );
}

export function BriefingFooter({ record, advisorName }: BriefingPdfProps) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        Briefing version {record.f12.briefing_version} · Evidence {" "}
        {record.f12.overall_evidence_tier}
        {advisorName ? ` · Advisor: ${advisorName}` : ""}
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

function layerRows(f12: StudentBriefingRecord["f12"]) {
  const layers = f12.layer_summary;
  return [
    {
      layer: "Eligibility",
      status: layers.eligibility.band,
      statusColor: bandColor(layers.eligibility.band),
      flag: layers.eligibility.flag ?? "—",
    },
    {
      layer: "GPA",
      status: layers.gpa.band,
      statusColor: bandColor(layers.gpa.band),
      flag: layers.gpa.flag ?? "—",
    },
    {
      layer: "Trajectory",
      status: layers.trajectory.direction ?? "—",
      statusColor: undefined,
      flag: layers.trajectory.regression ? "regression" : "—",
    },
    {
      layer: "AIMS",
      status: layers.aims.risk_band,
      statusColor: undefined,
      flag: layers.aims.flags.length ? layers.aims.flags.join(", ") : "—",
    },
    {
      layer: "Engagement",
      status: layers.engagement.trend,
      statusColor: undefined,
      flag: [
        layers.engagement.withdrawal ? "withdrawal" : null,
        layers.engagement.low ? "low" : null,
      ]
        .filter(Boolean)
        .join(", ") || "—",
    },
    {
      layer: "Composite",
      status: layers.composite.band,
      statusColor: bandColor(layers.composite.band),
      flag: layers.composite.escalation ? "escalation required" : "—",
    },
  ];
}
