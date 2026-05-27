/**
 * Sprint 5 — Cohort Summary PDF
 *
 * Page 1: Advisor cover sheet (district, advisor name, export date,
 * cohort band distribution, totals).
 *
 * Pages 2..N: One condensed StudentBriefingPdf body per student.
 */

import * as React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { PDF_COLORS, bandColor } from "./colors";
import type { StudentBriefingRecord } from "@/lib/eligibility/build-student-briefing";
import { BriefingBody, BriefingFooter } from "./StudentBriefingPdf";

export interface CohortSummaryPdfProps {
  records: StudentBriefingRecord[];
  advisorName: string;
  districtName: string;
  generatedAt: Date;
}

const styles = StyleSheet.create({
  page: {
    padding: 54,
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
  coverEyebrow: { fontSize: 10, color: PDF_COLORS.MUTED, marginBottom: 4 },
  coverTitle: { fontSize: 28, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  coverMeta: { fontSize: 12, marginBottom: 2 },
  metaMuted: { fontSize: 11, color: PDF_COLORS.MUTED, marginBottom: 1 },
  sectionHeader: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 24, marginBottom: 8 },
  bandTableHeader: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.ROW_ALT,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.BORDER,
  },
  bandTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.BORDER,
  },
  bandCell: { paddingVertical: 6, paddingHorizontal: 8, flex: 1, fontSize: 11 },
  bandSwatch: { width: 10, height: 10, borderRadius: 2, marginRight: 6 },
  bandRowFlex: { flexDirection: "row", alignItems: "center", flex: 1 },
  totalsRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 10,
  },
  totalCard: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: PDF_COLORS.BORDER,
    borderRadius: 4,
  },
  totalLabel: { fontSize: 10, color: PDF_COLORS.MUTED, marginBottom: 2 },
  totalValue: { fontSize: 22, fontFamily: "Helvetica-Bold" },
});

function summarizeBands(records: StudentBriefingRecord[]) {
  const counts = { GREEN: 0, YELLOW: 0, RED: 0, ESCALATED: 0 };
  let immediate = 0;
  for (const r of records) {
    counts[r.f12.composite_band] += 1;
    if (r.f12.weeks_to_critical_action === 0) immediate += 1;
  }
  return { counts, immediate };
}

export function CohortSummaryPdf({
  records,
  advisorName,
  districtName,
  generatedAt,
}: CohortSummaryPdfProps) {
  const { counts, immediate } = summarizeBands(records);
  const total = records.length;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.coverEyebrow}>OPERATION TTG · COHORT SUMMARY</Text>
        <Text style={styles.coverTitle}>{districtName}</Text>
        <Text style={styles.coverMeta}>Advisor: {advisorName}</Text>
        <Text style={styles.metaMuted}>Generated {generatedAt.toLocaleString()}</Text>
        <Text style={styles.metaMuted}>
          Briefing version v0.1 · Deterministic evidence tier where possible
        </Text>

        <Text style={styles.sectionHeader}>Cohort band distribution</Text>
        <View>
          <View style={styles.bandTableHeader}>
            <Text style={[styles.bandCell, { fontFamily: "Helvetica-Bold" }]}>Band</Text>
            <Text style={[styles.bandCell, { fontFamily: "Helvetica-Bold", textAlign: "right" }]}>
              Students
            </Text>
          </View>
          {(["GREEN", "YELLOW", "RED", "ESCALATED"] as const).map((band) => (
            <View key={band} style={styles.bandTableRow}>
              <View style={styles.bandRowFlex}>
                <View style={[styles.bandSwatch, { backgroundColor: bandColor(band) }]} />
                <Text style={styles.bandCell}>{band}</Text>
              </View>
              <Text style={[styles.bandCell, { textAlign: "right" }]}>{counts[band]}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsRow}>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total students</Text>
            <Text style={styles.totalValue}>{total}</Text>
          </View>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Immediate action</Text>
            <Text style={[styles.totalValue, { color: PDF_COLORS.RED }]}>{immediate}</Text>
          </View>
        </View>

        <Text style={[styles.metaMuted, { marginTop: 28 }]}>
          One briefing follows for each student in the cohort.
        </Text>
      </Page>

      {records.map((record) => (
        <Page key={record.header.studentId} size="LETTER" style={styles.pageCondensed}>
          <BriefingBody record={record} generatedAt={generatedAt} condensed advisorName={advisorName} />
          <BriefingFooter record={record} generatedAt={generatedAt} advisorName={advisorName} />
        </Page>
      ))}
    </Document>
  );
}
