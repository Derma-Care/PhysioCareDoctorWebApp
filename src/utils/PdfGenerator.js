// src/utils/PdfGenerator.jsx
import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { capitalizeEachWord } from "./CaptalZeWord";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  slate900:    "#0f172a",
  slate800:    "#1e293b",
  slate700:    "#334155",
  slate600:    "#475569",
  slate400:    "#94a3b8",
  slate200:    "#e2e8f0",
  slate100:    "#f1f5f9",
  slate50:     "#f8fafc",
  teal600:     "#0d9488",
  teal500:     "#14b8a6",
  teal200:     "#99f6e4",
  teal100:     "#ccfbf1",
  teal50:      "#f0fdfa",
  sky500:      "#0ea5e9",
  sky200:      "#bae6fd",
  sky50:       "#f0f9ff",
  green600:    "#16a34a",
  green100:    "#dcfce7",
  amber600:    "#d97706",
  amber100:    "#fef3c7",
  rose600:     "#dc2626",
  rose100:     "#fee2e2",
  purple600:   "#7c3aed",
  purple100:   "#ede9fe",
  white:       "#ffffff",
};

// ── Styles ────────────────────────────────────────────────────────────────────
// KEY FIX: @react-pdf/renderer v4 forbids mixing borderWidth shorthand with
// individual side properties. Every border must use explicit 4-side declarations:
//   borderTopWidth / borderRightWidth / borderBottomWidth / borderLeftWidth
//   borderTopColor / borderRightColor / borderBottomColor / borderLeftColor
const S = StyleSheet.create({
  page: {
    fontSize: 9,
    fontFamily: "Helvetica",
    backgroundColor: C.slate50,
    padding: 0,
  },

  // ─ HEADER ─
  header: {
    backgroundColor: C.slate800,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 18,
    paddingBottom: 14,
    paddingLeft: 20,
    paddingRight: 20,
  },
  headerAccent: { height: 3, backgroundColor: C.teal600 },
  hLeft: { flex: 1 },
  hClinicName: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  hMeta: { fontSize: 7.5, color: C.slate400, lineHeight: 1.5 },
  hRight: { alignItems: "flex-end", flexShrink: 0, marginLeft: 20 },
  hBadge: {
    backgroundColor: C.teal600,
    borderRadius: 3,
    paddingTop: 4, paddingBottom: 4, paddingLeft: 12, paddingRight: 12,
    marginBottom: 7,
  },
  hBadgeTx: { color: C.white, fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1.5 },
  hDateTx:    { fontSize: 7.5, color: C.slate400, textAlign: "right", marginBottom: 2 },
  hBookingTx: { fontSize: 7.5, color: C.slate400, textAlign: "right" },

  // ─ PATIENT BANNER ─
  patientBanner: {
    backgroundColor: C.slate700,
    paddingTop: 10, paddingBottom: 10, paddingLeft: 20, paddingRight: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  pbLeft: { flexDirection: "row", alignItems: "center" },
  pbAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.teal600,
    alignItems: "center", justifyContent: "center",
    marginRight: 10, flexShrink: 0,
  },
  pbAvatarTx: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.white },
  pbName:     { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: 0.1 },
  pbMeta:     { fontSize: 8,  color: C.teal200, marginTop: 2 },
  pbRight:    { alignItems: "flex-end" },
  pbIdLbl: {
    fontSize: 6.5, color: C.teal200, textTransform: "uppercase",
    letterSpacing: 0.5, marginBottom: 2,
  },
  pbIdVal: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.white },

  // ─ STATUS PILL ─
  statusPill: {
    borderRadius: 20,
    paddingTop: 3, paddingBottom: 3, paddingLeft: 10, paddingRight: 10,
    marginTop: 4,
  },
  statusTx: { fontSize: 7.5, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },

  // ─ BODY LAYOUT ─
  bodyRow: { flexDirection: "row", flex: 1, minHeight: 600 },

  // ─ SIDEBAR ─
  sidebar: {
    width: 68, backgroundColor: C.slate900,
    paddingTop: 16, paddingBottom: 16, paddingLeft: 0, paddingRight: 0,
    flexShrink: 0,
  },
  sidebarItem: { alignItems: "center", marginBottom: 14, paddingLeft: 6, paddingRight: 6 },
  sidebarNum: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.teal600, alignItems: "center", justifyContent: "center", marginBottom: 3,
  },
  sidebarNumTx: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.white },
  sidebarTx:    { fontSize: 6,   color: C.slate400, textAlign: "center", lineHeight: 1.4 },
  sidebarDivider: {
    height: 1, backgroundColor: C.slate700,
    marginTop: 6, marginBottom: 6, marginLeft: 12, marginRight: 12,
  },

  // ─ MAIN CONTENT ─
  content: {
    flex: 1,
    paddingTop: 16, paddingBottom: 24, paddingLeft: 16, paddingRight: 16,
    backgroundColor: C.white,
  },

  // ─ SECTION ─
  sec: { marginBottom: 14 },
  secHeader: {
    flexDirection: "row", alignItems: "center",
    marginBottom: 8, paddingBottom: 5,
    borderBottomWidth: 1, borderBottomColor: C.teal600,
  },
  secBar: { width: 3, height: 13, borderRadius: 2, backgroundColor: C.teal600, marginRight: 7 },
  secTitle: {
    fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.slate800,
    textTransform: "uppercase", letterSpacing: 1, flex: 1,
  },
  secBadge: {
    backgroundColor: C.teal100, borderRadius: 10,
    paddingTop: 2, paddingBottom: 2, paddingLeft: 8, paddingRight: 8,
  },
  secBadgeTx: { fontSize: 7, color: C.teal600, fontFamily: "Helvetica-Bold" },
  subSecTitle: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: C.teal600,
    textTransform: "uppercase", letterSpacing: 0.5,
    marginBottom: 7, marginTop: 2, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: C.slate200,
  },

  // ─ CARDS ─
  // FIX: use explicit 4-side borders everywhere
  card: {
    backgroundColor: C.slate50,
    borderRadius: 5,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.slate200, borderRightColor: C.slate200,
    borderBottomColor: C.slate200, borderLeftColor: C.slate200,
    padding: 12, marginBottom: 7,
  },
  cardAccent: {
    backgroundColor: C.slate50,
    borderRadius: 5,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 3,
    borderTopColor: C.slate200, borderRightColor: C.slate200,
    borderBottomColor: C.slate200, borderLeftColor: C.slate200,
    padding: 12, marginBottom: 7,
  },
  cTeal:   { borderLeftColor: C.teal600 },
  cSky:    { borderLeftColor: C.sky500 },
  cGreen:  { borderLeftColor: C.green600 },
  cRose:   { borderLeftColor: C.rose600 },
  cAmber:  { borderLeftColor: C.amber600 },
  cPurple: { borderLeftColor: C.purple600 },
  cSlate:  { borderLeftColor: C.slate600 },

  // ─ INFO GRID ─
  grid: { flexDirection: "row", flexWrap: "wrap" },
  c2: { width: "50%",    marginBottom: 9, paddingRight: 12 },
  c3: { width: "33.33%", marginBottom: 9, paddingRight: 10 },

  // ─ FIELD ─
  fieldBox: {
    backgroundColor: C.white, borderRadius: 4,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.slate200, borderRightColor: C.slate200,
    borderBottomColor: C.slate200, borderLeftColor: C.slate200,
    paddingTop: 5, paddingBottom: 5, paddingLeft: 8, paddingRight: 8,
    marginBottom: 5,
  },
  lbl: {
    fontSize: 6.5, color: C.slate400, textTransform: "uppercase",
    letterSpacing: 0.5, marginBottom: 2, fontFamily: "Helvetica-Bold",
  },
  val:   { fontSize: 8.5, color: C.slate800, lineHeight: 1.5 },
  valB:  { fontSize: 8.5, color: C.slate900, fontFamily: "Helvetica-Bold", lineHeight: 1.5 },
  valXL: { fontSize: 10,  color: C.slate900, fontFamily: "Helvetica-Bold" },

  // ─ CHIPS ─
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  chip: {
    borderRadius: 10,
    paddingTop: 2, paddingBottom: 2, paddingLeft: 8, paddingRight: 8,
    marginRight: 4, marginBottom: 4,
  },
  // FIX: use explicit 4-side borders on all chip variants
  cBlu: {
    backgroundColor: C.sky50,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.sky200, borderRightColor: C.sky200, borderBottomColor: C.sky200, borderLeftColor: C.sky200,
  },
  cBluTx: { fontSize: 7, color: C.sky500, fontFamily: "Helvetica-Bold" },
  cTel: {
    backgroundColor: C.teal50,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.teal200, borderRightColor: C.teal200, borderBottomColor: C.teal200, borderLeftColor: C.teal200,
  },
  cTelTx: { fontSize: 7, color: C.teal600, fontFamily: "Helvetica-Bold" },
  cGrn: {
    backgroundColor: C.green100,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: "#86efac", borderRightColor: "#86efac", borderBottomColor: "#86efac", borderLeftColor: "#86efac",
  },
  cGrnTx: { fontSize: 7, color: C.green600, fontFamily: "Helvetica-Bold" },
  cRos: {
    backgroundColor: C.rose100,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: "#fca5a5", borderRightColor: "#fca5a5", borderBottomColor: "#fca5a5", borderLeftColor: "#fca5a5",
  },
  cRosTx: { fontSize: 7, color: C.rose600, fontFamily: "Helvetica-Bold" },
  cAmb: {
    backgroundColor: C.amber100,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: "#fcd34d", borderRightColor: "#fcd34d", borderBottomColor: "#fcd34d", borderLeftColor: "#fcd34d",
  },
  cAmbTx: { fontSize: 7, color: C.amber600, fontFamily: "Helvetica-Bold" },
  cPur: {
    backgroundColor: C.purple100,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: "#c4b5fd", borderRightColor: "#c4b5fd", borderBottomColor: "#c4b5fd", borderLeftColor: "#c4b5fd",
  },
  cPurTx: { fontSize: 7, color: C.purple600, fontFamily: "Helvetica-Bold" },
  cGry: {
    backgroundColor: C.slate100,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.slate200, borderRightColor: C.slate200, borderBottomColor: C.slate200, borderLeftColor: C.slate200,
  },
  cGryTx: { fontSize: 7, color: C.slate600, fontFamily: "Helvetica-Bold" },
  cNvy: {
    backgroundColor: C.slate100,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.slate200, borderRightColor: C.slate200, borderBottomColor: C.slate200, borderLeftColor: C.slate200,
  },
  cNvyTx: { fontSize: 7, color: C.slate800, fontFamily: "Helvetica-Bold" },

  // ─ DIVIDER ─
  divider: { borderBottomWidth: 1, borderBottomColor: C.slate200, marginTop: 6, marginBottom: 8 },

  // ─ COMPLAINT BOX ─
  complaintBox: {
    backgroundColor: C.slate50, borderRadius: 5,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 3,
    borderTopColor: C.slate200, borderRightColor: C.slate200,
    borderBottomColor: C.slate200, borderLeftColor: C.rose600,
    padding: 10, marginBottom: 8,
  },

  // ─ PAIN BAR ─
  pbTrack: { height: 7, backgroundColor: C.slate200, borderRadius: 4, marginTop: 4, marginBottom: 2 },
  pbFill:  { height: 7, borderRadius: 4 },
  pbLabels:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  pbLabelTx: { fontSize: 6, color: C.slate400 },

  // ─ CHECK ROW ─
  checkRow: {
    flexDirection: "row", alignItems: "flex-start",
    marginBottom: 6, flexWrap: "wrap", paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: C.slate100,
  },
  checkLabel: {
    fontSize: 7.5, color: C.slate700, fontFamily: "Helvetica-Bold",
    width: 120, marginTop: 2, flexShrink: 0,
  },
  checkPills: { flexDirection: "row", flexWrap: "wrap", flex: 1 },
  checkOn: {
    backgroundColor: C.teal50, borderRadius: 10,
    paddingTop: 2, paddingBottom: 2, paddingLeft: 7, paddingRight: 7,
    marginRight: 4, marginBottom: 3,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.teal200, borderRightColor: C.teal200,
    borderBottomColor: C.teal200, borderLeftColor: C.teal200,
  },
  checkOff: {
    backgroundColor: C.slate100, borderRadius: 10,
    paddingTop: 2, paddingBottom: 2, paddingLeft: 7, paddingRight: 7,
    marginRight: 4, marginBottom: 3,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.slate200, borderRightColor: C.slate200,
    borderBottomColor: C.slate200, borderLeftColor: C.slate200,
  },
  checkOnTx:  { fontSize: 7, color: C.teal600, fontFamily: "Helvetica-Bold" },
  checkOffTx: { fontSize: 7, color: C.slate400 },
  checkNote:  { fontSize: 6.5, color: C.slate600, fontStyle: "italic", marginTop: 3, flex: 1 },

  // ─ QA ─
  // FIX: was borderWidth:1 shorthand
  qaWrap: {
    marginBottom: 7,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.slate200, borderRightColor: C.slate200,
    borderBottomColor: C.slate200, borderLeftColor: C.slate200,
    borderRadius: 5, overflow: "hidden",
  },
  qaHead: {
    backgroundColor: C.slate800,
    paddingTop: 6, paddingBottom: 6, paddingLeft: 10, paddingRight: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  qaHeadTx:    { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white, textTransform: "capitalize" },
  qaHeadCount: { fontSize: 7, color: C.teal200 },
  qaRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 6, paddingBottom: 6, paddingLeft: 10, paddingRight: 10,
    borderTopWidth: 1, borderTopColor: C.slate200,
  },
  qaRowAlt: { backgroundColor: C.slate50 },
  qaNum: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.teal100, alignItems: "center", justifyContent: "center",
    marginRight: 7, flexShrink: 0,
  },
  qaNumTx: { fontSize: 6.5, color: C.teal600, fontFamily: "Helvetica-Bold" },
  qaQ:     { fontSize: 7.5, color: C.slate800, flex: 1, paddingRight: 10, lineHeight: 1.5 },

  // ─ TABLES ─
  // FIX: was borderWidth:1 shorthand
  tbl: {
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.slate200, borderRightColor: C.slate200,
    borderBottomColor: C.slate200, borderLeftColor: C.slate200,
    borderRadius: 5, overflow: "hidden", marginBottom: 7,
  },
  tHead: {
    flexDirection: "row", backgroundColor: C.slate800,
    paddingTop: 6, paddingBottom: 6, paddingLeft: 10, paddingRight: 10,
  },
  tHCell: { fontSize: 7, color: C.white, fontFamily: "Helvetica-Bold", paddingRight: 6, letterSpacing: 0.3 },
  tRow: {
    flexDirection: "row",
    borderTopWidth: 1, borderTopColor: C.slate200,
    paddingTop: 5, paddingBottom: 5, paddingLeft: 10, paddingRight: 10,
  },
  tRowAlt: { backgroundColor: C.slate50 },
  tCell:  { fontSize: 7.5, color: C.slate700, paddingRight: 6, lineHeight: 1.4 },
  tCellB: { fontSize: 7.5, color: C.slate900, fontFamily: "Helvetica-Bold", paddingRight: 6 },
  tCellA: { fontSize: 7.5, color: C.teal600,  fontFamily: "Helvetica-Bold", paddingRight: 6 },

  // ─ SEVERITY / STAGE ─
  sevMild:     { backgroundColor: C.green100,  borderRadius: 10, paddingTop: 2, paddingBottom: 2, paddingLeft: 7, paddingRight: 7 },
  sevModerate: { backgroundColor: C.amber100,  borderRadius: 10, paddingTop: 2, paddingBottom: 2, paddingLeft: 7, paddingRight: 7 },
  sevSevere:   { backgroundColor: C.rose100,   borderRadius: 10, paddingTop: 2, paddingBottom: 2, paddingLeft: 7, paddingRight: 7 },
  sevMildTx:     { fontSize: 7, color: C.green600,  fontFamily: "Helvetica-Bold" },
  sevModerateTx: { fontSize: 7, color: C.amber600,  fontFamily: "Helvetica-Bold" },
  sevSevereTx:   { fontSize: 7, color: C.rose600,   fontFamily: "Helvetica-Bold" },
  stageAcute:   { backgroundColor: C.rose100,   borderRadius: 10, paddingTop: 2, paddingBottom: 2, paddingLeft: 7, paddingRight: 7 },
  stageSub:     { backgroundColor: C.amber100,  borderRadius: 10, paddingTop: 2, paddingBottom: 2, paddingLeft: 7, paddingRight: 7 },
  stageChronic: { backgroundColor: C.purple100, borderRadius: 10, paddingTop: 2, paddingBottom: 2, paddingLeft: 7, paddingRight: 7 },
  stageAcuteTx:   { fontSize: 7, color: C.rose600,   fontFamily: "Helvetica-Bold" },
  stageSubTx:     { fontSize: 7, color: C.amber600,  fontFamily: "Helvetica-Bold" },
  stageChronicTx: { fontSize: 7, color: C.purple600, fontFamily: "Helvetica-Bold" },

  // ─ THERAPY NESTING ─
  pkgWrap: { marginBottom: 10 },
  pkgHeader: {
    backgroundColor: C.slate800,
    paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 12,
    borderTopLeftRadius: 5, borderTopRightRadius: 5,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  pkgTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.white },
  pkgPrice: { fontSize: 7.5, color: C.teal200 },
  // FIX: was borderWidth:1 + borderTopWidth:0 mix
  pkgBody: {
    borderTopWidth: 0,
    borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.slate200, borderRightColor: C.slate200,
    borderBottomColor: C.slate200, borderLeftColor: C.slate200,
    borderBottomLeftRadius: 5, borderBottomRightRadius: 5,
    padding: 10, backgroundColor: C.slate50,
  },
  progHeader: {
    backgroundColor: C.teal600,
    paddingTop: 6, paddingBottom: 6, paddingLeft: 10, paddingRight: 10,
    borderTopLeftRadius: 4, borderTopRightRadius: 4,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  progTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white },
  // FIX: was borderWidth:1 + borderTopWidth:0 mix
  progBody: {
    borderTopWidth: 0,
    borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.teal200, borderRightColor: C.teal200,
    borderBottomColor: C.teal200, borderLeftColor: C.teal200,
    borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
    padding: 8, marginBottom: 7, backgroundColor: C.white,
  },
  // FIX: was borderWidth:1 + borderBottomWidth:0 mix
  therapyHeader: {
    backgroundColor: C.teal50,
    paddingTop: 5, paddingBottom: 5, paddingLeft: 9, paddingRight: 9,
    borderTopLeftRadius: 3, borderTopRightRadius: 3,
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 0, borderLeftWidth: 1,
    borderTopColor: C.teal200, borderRightColor: C.teal200,
    borderBottomColor: C.teal200, borderLeftColor: C.teal200,
  },
  therapyTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.teal600 },
  // FIX: was borderWidth:1 + borderTopWidth:0 mix
  therapyBody: {
    borderTopWidth: 0,
    borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.teal200, borderRightColor: C.teal200,
    borderBottomColor: C.teal200, borderLeftColor: C.teal200,
    borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
    overflow: "hidden", marginBottom: 5,
  },

  // ─ META BAR ─
  // FIX: was borderWidth:1 shorthand
  metaBar: {
    flexDirection: "row", flexWrap: "wrap", marginBottom: 7,
    paddingTop: 5, paddingBottom: 5, paddingLeft: 8, paddingRight: 8,
    backgroundColor: C.slate50, borderRadius: 4,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.slate200, borderRightColor: C.slate200,
    borderBottomColor: C.slate200, borderLeftColor: C.slate200,
  },

  // ─ IMAGES ─
  imgContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 5 },
  img: { width: 72, height: 72, borderRadius: 4, marginRight: 7, marginBottom: 5 },

  // ─ SIGNATURE ─
  sigSection: { marginTop: 20, flexDirection: "row", justifyContent: "flex-end" },
  sigBox: { alignItems: "center", width: 140, marginLeft: 32 },
  // FIX: C.slate300 did not exist — replaced with C.slate400
  sigLine: {
    borderTopWidth: 1, borderTopColor: C.slate400,
    width: "100%", marginBottom: 5, marginTop: 26,
  },
  sigRole: { fontSize: 7, color: C.slate400, textAlign: "center" },
  sigName: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.slate800, textAlign: "center", marginTop: 2 },
  sigSub:  { fontSize: 7, color: C.slate600, textAlign: "center", marginTop: 1 },

  // ─ FOOTER ─
  footer: {
    backgroundColor: C.slate900,
    paddingTop: 7, paddingBottom: 7, paddingLeft: 20, paddingRight: 20,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  ftLeft:  { fontSize: 7,   color: C.teal200 },
  ftMid:   { fontSize: 6.5, color: C.slate600, textAlign: "center" },
  ftRight: { fontSize: 7,   color: C.slate400 },
});

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { num: "1", label: "Patient\nInfo" },
  { num: "2", label: "Complaint" },
  { num: "3", label: "History" },
  { num: "4", label: "Assessment" },
  { num: "5", label: "Diagnosis" },
  { num: "6", label: "Treatment" },
  { num: "7", label: "Therapy" },
  { num: "8", label: "Exercises" },
  { num: "9", label: "Follow Up" },
];

// ── Data resolver ─────────────────────────────────────────────────────────────
function resolve(props) {
  const { bookingData, formData, patientData } = props;
  const isFull = (o) =>
    o != null && typeof o === "object" &&
    (o.patientInfo != null || o.assessment != null || o.followUp != null ||
      o.treatmentPlan != null || o.therapySessions != null || o.exercisePlan != null);
  const root = bookingData ?? (isFull(formData) ? formData : null);
  const pick = (key, explicitProp, fb = {}) =>
    root?.[key] != null ? root[key]
    : explicitProp != null ? explicitProp
    : formData?.[key] != null ? formData[key]
    : fb;

  const patient         = pick("patientInfo",     patientData,             {});
  const complaintsRaw   = pick("complaints",      props.complaintsData,    {});
  const assessment      = pick("assessment",      props.assessmentData,    {});
  const diagnosisRaw    = pick("diagnosis",       props.diagnosisData,     {});
  const treatmentPlan   = pick("treatmentPlan",   props.treatmentData,     {});
  const therapySessions = pick("therapySessions", props.sessionsData,      []);
  const exercisePlan    = pick("exercisePlan",    props.exerciseData,      {});
  const followUp        = pick("followUp",        props.followUpData,      {});
  const investigationRaw= pick("investigation",   props.investigationData, {});

  const investigation = {
    tests: (() => {
      const t = investigationRaw.selectedTests ?? investigationRaw.tests ?? [];
      return Array.isArray(t) ? t : t ? [t] : [];
    })(),
    reason: investigationRaw.notes ?? investigationRaw.reason ?? "",
  };

  const background = {
    previousInjuries:   root?.previousInjuries   ?? formData?.previousInjuries   ?? patientData?.previousInjuries   ?? "",
    currentMedications: root?.currentMedications ?? formData?.currentMedications ?? patientData?.currentMedications ?? "",
    allergies:          root?.allergies           ?? formData?.allergies           ?? patientData?.allergies           ?? "",
    occupation:         root?.occupation          ?? formData?.occupation          ?? patientData?.occupation          ?? "",
    insuranceProvider:  root?.insuranceProvider   ?? formData?.insuranceProvider   ?? patientData?.insuranceProvider   ?? "",
    activityLevels: (() => {
      const v = root?.activityLevels ?? formData?.activityLevels ?? patientData?.activityLevels ?? [];
      return Array.isArray(v) ? v : [];
    })(),
    patientPain: root?.patientPain ?? formData?.patientPain ?? formData?.assessment?.patientPain ?? patientData?.patientPain ?? "",
  };

  let therapyAnswersObj = {};
  const rawAnswers = complaintsRaw?.therapyAnswers ?? complaintsRaw?.theraphyAnswers ?? {};
  if (Array.isArray(rawAnswers)) therapyAnswersObj = { General: rawAnswers };
  else if (typeof rawAnswers === "object") therapyAnswersObj = rawAnswers;

  const complaints = {
    complaintDetails:    complaintsRaw?.complaintDetails ?? "",
    duration:            complaintsRaw?.duration ?? "",
    selectedTherapy:     complaintsRaw?.selectedTherapy ?? "",
    painAssessmentImage: complaintsRaw?.painAssessmentImage ?? "",
    reportImages: Array.isArray(complaintsRaw?.reportImages) ? complaintsRaw.reportImages : [],
    therapyAnswersObj,
  };

  const diagnosisRows = Array.isArray(diagnosisRaw?.diagnosisRows)
    ? diagnosisRaw.diagnosisRows
    : diagnosisRaw?.physioDiagnosis ? [diagnosisRaw] : [];

  let sessionsList = [];
  if (Array.isArray(therapySessions)) sessionsList = therapySessions;
  else if (Array.isArray(therapySessions?.sessions)) sessionsList = therapySessions.sessions;
  if (sessionsList.length === 1 && Array.isArray(sessionsList[0])) sessionsList = sessionsList[0];

  const overallStatus    = (!Array.isArray(therapySessions) && therapySessions?.overallStatus) ? therapySessions.overallStatus : "";
  const topTherapistId   = therapySessions?.therapistId   ?? "";
  const topTherapistName = therapySessions?.therapistName ?? "";

  const homeExercises = Array.isArray(exercisePlan?.homeExercises)
    ? exercisePlan.homeExercises
    : Array.isArray(exercisePlan?.exercises) ? exercisePlan.exercises : [];
  const homeAdvice = exercisePlan?.homeAdvice ?? "";

  const followUpEntry =
    Array.isArray(followUp) ? (followUp[0] ?? {}) : typeof followUp === "object" ? followUp : {};

  const parts = formData?.parts ?? root?.symptoms?.parts ?? patientData?.parts ?? [];
  const treatmentTemplates = Array.isArray(root?.treatmentTemplates) ? root.treatmentTemplates : [];
  const bookingId = root?.bookingId ?? formData?.bookingId ?? null;
  const clinicId  = root?.clinicId  ?? formData?.clinicId  ?? null;
  const branchId  = root?.branchId  ?? formData?.branchId  ?? null;

  return {
    patient, complaints, investigation, background,
    assessment, diagnosisRows, treatmentPlan,
    sessionsList, overallStatus, topTherapistId, topTherapistName,
    homeExercises, homeAdvice, followUpEntry, parts, treatmentTemplates,
    bookingId, clinicId, branchId,
    doctorData: props.doctorData ?? {},
    clicniData: props.clicniData ?? {},
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const dv = (v) =>
  v != null && String(v).trim() !== "" && String(v) !== "NA" ? String(v) : "\u2014";
const hv = (v) =>
  v != null && v !== "" && v !== "NA" &&
  String(v).trim() !== "" && String(v).toLowerCase() !== "undefined";

const PAIN_LABEL = {
  chronicPain:     "Chronic Pain",
  sportsRehab:     "Sports Rehab",
  neuroRehab:      "Neuro Rehab",
  acutePain:       "Acute Pain",
  neuropathicPain: "Neuropathic Pain",
  referredPain:    "Referred Pain",
  inflammatoryPain:"Inflammatory Pain",
};

// ── Primitives ────────────────────────────────────────────────────────────────
const SH = ({ title, badge }) => (
  <View style={S.secHeader}>
    <View style={S.secBar} />
    <Text style={S.secTitle}>{title}</Text>
    {badge && <View style={S.secBadge}><Text style={S.secBadgeTx}>{badge}</Text></View>}
  </View>
);

const LV = ({ label, value, bold = false, xl = false }) => {
  if (!hv(value)) return null;
  return (
    <View>
      <Text style={S.lbl}>{label}</Text>
      <Text style={xl ? S.valXL : bold ? S.valB : S.val}>{dv(value)}</Text>
    </View>
  );
};

const FV = ({ label, value, bold = false }) => {
  if (!hv(value)) return null;
  return (
    <View style={S.fieldBox}>
      <Text style={S.lbl}>{label}</Text>
      <Text style={bold ? S.valB : S.val}>{dv(value)}</Text>
    </View>
  );
};

const Chip = ({ text, variant = "blue" }) => {
  const map = {
    blue:   [S.cBlu, S.cBluTx],
    teal:   [S.cTel, S.cTelTx],
    green:  [S.cGrn, S.cGrnTx],
    rose:   [S.cRos, S.cRosTx],
    amber:  [S.cAmb, S.cAmbTx],
    purple: [S.cPur, S.cPurTx],
    gray:   [S.cGry, S.cGryTx],
    navy:   [S.cNvy, S.cNvyTx],
  };
  const [bg, tx] = map[variant] || map.blue;
  return <View style={[S.chip, bg]}><Text style={tx}>{text}</Text></View>;
};

const AnswerBadge = ({ answer }) => {
  const display = String(answer ?? "").trim();
  if (!display || display.toLowerCase() === "undefined" || display.toLowerCase() === "na")
    return (
      <View style={[S.chip, S.cGry]}>
        <Text style={[S.cGryTx, { fontStyle: "italic" }]}>Not answered</Text>
      </View>
    );
  const up = display.toUpperCase();
  if (up === "YES") return <View style={[S.chip, S.cGrn]}><Text style={S.cGrnTx}>YES</Text></View>;
  if (up === "NO")  return <View style={[S.chip, S.cRos]}><Text style={S.cRosTx}>NO</Text></View>;
  return <View style={[S.chip, S.cTel]}><Text style={S.cTelTx}>{display}</Text></View>;
};

const PainBar = ({ scaleText }) => {
  const m   = String(scaleText ?? "").match(/(\d+)\s*\/\s*(\d+)/);
  const num = m ? parseInt(m[1]) : parseInt(String(scaleText ?? "0")) || 0;
  const max = m ? parseInt(m[2]) : 10;
  const pct = Math.min((num / max) * 100, 100);
  const color = pct >= 70 ? C.rose600 : pct >= 40 ? C.amber600 : C.teal600;
  const label = pct >= 70 ? "SEVERE" : pct >= 40 ? "MODERATE" : "MILD";
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <Text style={S.lbl}>Pain Scale</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={[S.valB, { color, fontSize: 12 }]}>{num}</Text>
          <Text style={[S.val,  { color: C.slate400 }]}> / {max}  </Text>
          <View style={[S.chip, { backgroundColor: color + "22", paddingTop: 1, paddingBottom: 1 }]}>
            <Text style={{ fontSize: 6.5, color, fontFamily: "Helvetica-Bold" }}>{label}</Text>
          </View>
        </View>
      </View>
      <View style={S.pbTrack}>
        <View style={[S.pbFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <View style={S.pbLabels}>
        <Text style={S.pbLabelTx}>0 — No Pain</Text>
        <Text style={S.pbLabelTx}>5 — Moderate</Text>
        <Text style={S.pbLabelTx}>10 — Worst</Text>
      </View>
    </View>
  );
};

const CheckRow = ({ label, options, selected, note, last = false }) => (
  <View style={[S.checkRow, last ? { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 } : {}]}>
    <Text style={S.checkLabel}>{label}</Text>
    <View style={S.checkPills}>
      {options.map((opt) => {
        const on = Array.isArray(selected) && selected.includes(opt);
        return (
          <View key={opt} style={on ? S.checkOn : S.checkOff}>
            <Text style={on ? S.checkOnTx : S.checkOffTx}>{opt}</Text>
          </View>
        );
      })}
      {hv(note) && <Text style={S.checkNote}>Note: {note}</Text>}
    </View>
  </View>
);

const SevBadge = ({ sev }) => {
  if (!hv(sev)) return <Text style={S.tCell}>—</Text>;
  const map = { Mild: [S.sevMild, S.sevMildTx], Moderate: [S.sevModerate, S.sevModerateTx], Severe: [S.sevSevere, S.sevSevereTx] };
  const [bg, tx] = map[sev] || map.Mild;
  return <View style={bg}><Text style={tx}>{sev}</Text></View>;
};

const StageBadge = ({ stage }) => {
  if (!hv(stage)) return <Text style={S.tCell}>—</Text>;
  const map = { Acute: [S.stageAcute, S.stageAcuteTx], "Sub-acute": [S.stageSub, S.stageSubTx], Chronic: [S.stageChronic, S.stageChronicTx] };
  const [bg, tx] = map[stage] || map["Sub-acute"];
  return <View style={bg}><Text style={tx}>{stage}</Text></View>;
};

const getInitials = (name) => {
  if (!name) return "PT";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ── Exercise Table ────────────────────────────────────────────────────────────
const ExerciseTable = ({ exercises }) => {
  if (!exercises || exercises.length === 0)
    return <Text style={{ fontSize: 7, color: C.slate400, fontStyle: "italic", padding: 8 }}>No exercises recorded.</Text>;
  return (
    <View style={S.tbl}>
      <View style={S.tHead}>
        <Text style={[S.tHCell, { flex: 0.3 }]}>#</Text>
        <Text style={[S.tHCell, { flex: 2.2 }]}>Exercise</Text>
        <Text style={[S.tHCell, { flex: 0.7 }]}>Sessions</Text>
        <Text style={[S.tHCell, { flex: 0.6 }]}>Sets</Text>
        <Text style={[S.tHCell, { flex: 0.6 }]}>Reps</Text>
        <Text style={[S.tHCell, { flex: 1.3 }]}>Frequency</Text>
        <Text style={[S.tHCell, { flex: 2   }]}>Notes</Text>
      </View>
      {exercises.map((ex, i) => (
        <View key={i} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]}>
          <Text style={[S.tCellA, { flex: 0.3 }]}>{i + 1}</Text>
          <Text style={[S.tCellB, { flex: 2.2 }]}>{dv(ex.name || ex.exerciseName)}</Text>
          <Text style={[S.tCell,  { flex: 0.7 }]}>{dv(ex.noOfSessions ?? ex.session ?? ex.sessions)}</Text>
          <Text style={[S.tCell,  { flex: 0.6 }]}>{dv(ex.sets)}</Text>
          <Text style={[S.tCell,  { flex: 0.6 }]}>{dv(ex.repetitions ?? ex.reps)}</Text>
          <Text style={[S.tCell,  { flex: 1.3 }]}>{dv(ex.frequency)}</Text>
          <Text style={[S.tCell,  { flex: 2   }]}>{dv(ex.notes)}</Text>
        </View>
      ))}
    </View>
  );
};

// ── Therapy Block ─────────────────────────────────────────────────────────────
const TherapyBlock = ({ therapy }) => (
  <View style={{ marginBottom: 7 }}>
    <View style={S.therapyHeader}>
      <Text style={S.therapyTitle}>{therapy.therapyName || "Therapy"}</Text>
      {therapy.totalPrice > 0 && <Text style={{ fontSize: 7, color: C.teal600 }}>Rs. {therapy.totalPrice}</Text>}
    </View>
    <View style={S.therapyBody}>
      <ExerciseTable exercises={therapy.exercises || []} />
    </View>
  </View>
);

// ── Meta Bar ──────────────────────────────────────────────────────────────────
const MetaBar = ({ sess, therapistId, therapistName }) => {
  const tName = sess.therapistName || therapistName || "";
  const tId   = sess.therapistId   || therapistId   || "";
  if (!tName && !tId && !sess.serviceType) return null;
  return (
    <View style={S.metaBar}>
      {sess.serviceType && <Chip text={`Type: ${sess.serviceType}`} variant="navy" />}
      {tName && <Chip text={`Therapist: ${tName}`} variant="teal" />}
      {tId   && <Chip text={`ID: ${tId}`}           variant="gray" />}
    </View>
  );
};

// ── Session Block ─────────────────────────────────────────────────────────────
const SessionBlock = ({ sess, isLast, therapistId, therapistName }) => {
  const sType = (sess.serviceType || "").toLowerCase();

  if (sType === "package") {
    return (
      <View style={[S.pkgWrap, { marginBottom: isLast ? 0 : 14 }]}>
        <View style={S.pkgHeader}>
          <Text style={S.pkgTitle}>{sess.packageName || "Package"}</Text>
          {sess.totalPrice > 0 && <Text style={S.pkgPrice}>Rs. {sess.totalPrice}</Text>}
        </View>
        <View style={S.pkgBody}>
          <MetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
          {Array.isArray(sess.programs) && sess.programs.length > 0
            ? sess.programs.map((prog, pi) => (
                <View key={pi} style={{ marginBottom: pi < sess.programs.length - 1 ? 10 : 0 }}>
                  <View style={S.progHeader}>
                    <Text style={S.progTitle}>{prog.programName || `Program ${pi + 1}`}</Text>
                    {prog.totalPrice > 0 && <Text style={{ fontSize: 7, color: "rgba(255,255,255,0.8)" }}>Rs. {prog.totalPrice}</Text>}
                  </View>
                  <View style={S.progBody}>
                    {Array.isArray(prog.therapyData ?? prog.therophyData)
                      ? (prog.therapyData ?? prog.therophyData).map((t, ti) => <TherapyBlock key={ti} therapy={t} />)
                      : <Text style={{ fontSize: 7, color: C.slate400, fontStyle: "italic" }}>No therapy data.</Text>}
                  </View>
                </View>
              ))
            : Array.isArray(sess.therapyData ?? sess.therophyData)
            ? (sess.therapyData ?? sess.therophyData).map((t, ti) => <TherapyBlock key={ti} therapy={t} />)
            : <Text style={{ fontSize: 7, color: C.slate400, fontStyle: "italic" }}>No data.</Text>}
        </View>
      </View>
    );
  }

  if (sType === "program") {
    const therapies = sess.therapyData ?? sess.therophyData ?? [];
    return (
      <View style={{ marginBottom: isLast ? 0 : 14 }}>
        <View style={S.progHeader}>
          <Text style={S.progTitle}>{sess.programName || "Program"}</Text>
          {(sess.totalPrice || sess.totalTherapyPrice) > 0 && (
            <Text style={{ fontSize: 7, color: "rgba(255,255,255,0.8)" }}>Rs. {sess.totalPrice || sess.totalTherapyPrice}</Text>
          )}
        </View>
        <View style={S.progBody}>
          <MetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
          {Array.isArray(therapies) && therapies.length > 0
            ? therapies.map((t, ti) => <TherapyBlock key={ti} therapy={t} />)
            : <Text style={{ fontSize: 7, color: C.slate400, fontStyle: "italic" }}>No therapies.</Text>}
        </View>
      </View>
    );
  }

  if (sType === "therapy") {
    return (
      <View style={{ marginBottom: isLast ? 0 : 14 }}>
        <View style={[S.progHeader, { backgroundColor: C.purple600 }]}>
          <Text style={S.progTitle}>{sess.therapyName || "Therapy Session"}</Text>
          {sess.totalPrice > 0 && <Text style={{ fontSize: 7, color: "rgba(255,255,255,0.8)" }}>Rs. {sess.totalPrice}</Text>}
        </View>
        {/* Override progBody border colors inline — all 4 sides explicitly */}
        <View style={[S.progBody, {
          borderTopColor: "#c4b5fd", borderRightColor: "#c4b5fd",
          borderBottomColor: "#c4b5fd", borderLeftColor: "#c4b5fd",
        }]}>
          <MetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
          {Array.isArray(sess.exercises) && sess.exercises.length > 0
            ? <ExerciseTable exercises={sess.exercises} />
            : <Text style={{ fontSize: 7, color: C.slate400, fontStyle: "italic" }}>No exercises.</Text>}
        </View>
      </View>
    );
  }

  if (sType === "exercise") {
    return (
      <View style={{ marginBottom: isLast ? 0 : 14 }}>
        <View style={[S.progHeader, { backgroundColor: C.green600 }]}>
          <Text style={S.progTitle}>Exercise Session</Text>
          {sess.totalPrice > 0 && <Text style={{ fontSize: 7, color: "rgba(255,255,255,0.8)" }}>Rs. {sess.totalPrice}</Text>}
        </View>
        <View style={[S.progBody, {
          borderTopColor: "#86efac", borderRightColor: "#86efac",
          borderBottomColor: "#86efac", borderLeftColor: "#86efac",
        }]}>
          <MetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
          <ExerciseTable exercises={sess.exercises || []} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: isLast ? 0 : 14 }}>
      <MetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
      {Array.isArray(sess.therapyData) && sess.therapyData.map((t, ti) => <TherapyBlock key={ti} therapy={t} />)}
      {Array.isArray(sess.exercises) && sess.exercises.length > 0 && <ExerciseTable exercises={sess.exercises} />}
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN PDF COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const PrescriptionPDF = (props) => {
  const {
    patient, complaints, investigation, background,
    assessment, diagnosisRows, treatmentPlan,
    sessionsList, overallStatus, topTherapistId, topTherapistName,
    homeExercises, homeAdvice, followUpEntry, parts, treatmentTemplates,
    bookingId, clinicId, branchId, doctorData, clicniData,
  } = resolve(props);

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  const subj  = assessment.subjectiveAssessment ?? assessment ?? {};
  const func_ = assessment.functionalAssessment ?? {};
  const phys  = assessment.physicalExamination  ?? {};
  const chron = assessment.chronicPainPatients  ?? {};
  const sport = assessment.sportsRehabPatients  ?? {};
  const neuro = assessment.neuroRehabPatients   ?? {};

  const painScale          = subj.painScale         ?? assessment.painScale          ?? "";
  const chiefComplaint     = subj.chiefComplaint     ?? assessment.chiefComplaint     ?? "";
  const painType           = subj.painType           ?? assessment.painType           ?? "";
  const dur                = subj.duration           ?? assessment.duration           ?? "";
  const onset              = subj.onset              ?? assessment.onset              ?? "";
  const aggravatingFactors = subj.aggravatingFactors ?? assessment.aggravatingFactors ?? "";
  const relievingFactors   = subj.relievingFactors   ?? assessment.relievingFactors   ?? "";
  const observations       = subj.observations       ?? assessment.observations       ?? "";

  const difficultiesIn      = Array.isArray(func_.difficultiesIn)  ? func_.difficultiesIn  : Array.isArray(assessment.difficultiesIn)  ? assessment.difficultiesIn  : [];
  const otherDifficulty     = func_.otherDifficulty     ?? assessment.otherDifficulty     ?? "";
  const dailyLivingAffected = func_.dailyLivingAffected ?? assessment.dailyLivingAffected ?? "";

  const postureAssessment = Array.isArray(phys.postureAssessment) ? phys.postureAssessment : Array.isArray(assessment.postureAssessment) ? assessment.postureAssessment : [];
  const postureDeviations = phys.postureDeviations ?? assessment.postureDeviations ?? "";
  const romStatus         = Array.isArray(phys.rangeOfMotion)  ? phys.rangeOfMotion  : Array.isArray(assessment.romStatus)  ? assessment.romStatus  : [];
  const romRestricted     = phys.romRestricted ?? assessment.romRestricted ?? "";
  const romJoints         = phys.romJoints     ?? assessment.romJoints     ?? "";
  const muscleStrength    = Array.isArray(phys.muscleStrength)  ? phys.muscleStrength  : Array.isArray(assessment.muscleStrength)  ? assessment.muscleStrength  : [];
  const muscleWeakness    = phys.muscleWeakness    ?? assessment.muscleWeakness    ?? "";
  const neurologicalSigns = Array.isArray(phys.neurologicalSigns) ? phys.neurologicalSigns : Array.isArray(assessment.neurologicalSigns) ? assessment.neurologicalSigns : [];

  const patientPain        = background.patientPain;
  const painTriggers       = chron.painTriggers       ?? assessment.painTriggers       ?? "";
  const chronicRelieving   = chron.relievingFactors   ?? assessment.chronicRelieving   ?? "";
  const typeOfSport        = sport.typeOfSport        ?? assessment.typeOfSport        ?? "";
  const recurringInjuries  = sport.recurringInjuries  ?? assessment.recurringInjuries  ?? "";
  const returnToSportGoals = sport.returnToSportGoals ?? assessment.returnToSportGoals ?? "";
  const neuroDiagnosis     = neuro.neuroDiagnosis     ?? assessment.neuroDiagnosis     ?? "";
  const neuroOnset         = neuro.neuroOnset         ?? assessment.neuroOnset         ?? "";
  const mobilityStatus     = neuro.mobilityStatus     ?? assessment.mobilityStatus     ?? "";
  const cognitiveStatus    = neuro.cognitiveStatus    ?? assessment.cognitiveStatus    ?? "";

  const hasAssessment =
    chiefComplaint || painScale || painType ||
    difficultiesIn.length > 0 || postureAssessment.length > 0 ||
    romStatus.length > 0 || muscleStrength.length > 0;

  const hasBackground =
    background.previousInjuries || background.currentMedications ||
    background.allergies || background.occupation ||
    background.insuranceProvider || background.patientPain ||
    background.activityLevels.length > 0;

  const hasQuestionnaire =
    Object.keys(complaints.therapyAnswersObj).length > 0 &&
    Object.values(complaints.therapyAnswersObj).some(
      (qs) => Array.isArray(qs) && qs.some((q) => hv(q.question))
    );

  const patientName   = patient?.patientName || patient?.name || patient?.fullName || "";
  const doctorName    = doctorData?.name || doctorData?.fullName || doctorData?.doctorName || treatmentPlan?.doctorName || "";
  const therapistName = treatmentPlan?.therapistName || topTherapistName || "";
  const initials      = getInitials(patientName);

  const statusColor =
    overallStatus === "Completed"   ? C.green600 :
    overallStatus === "Cancelled"   ? C.rose600  :
    overallStatus === "In Progress" ? C.teal600  : C.amber600;

  return (
    <Document>
      <Page size="A4" style={S.page} wrap>

        {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
        <View style={S.header} fixed>
          <View style={S.hLeft}>
            <Text style={S.hClinicName}>{clicniData?.name || "PhysioCare Clinic"}</Text>
            {hv(clicniData?.address) && <Text style={S.hMeta}>{clicniData.address}</Text>}
            <View style={{ flexDirection: "row", marginTop: 2 }}>
              {hv(clicniData?.phone) && <Text style={[S.hMeta, { marginRight: 14 }]}>Tel: {clicniData.phone}</Text>}
              {hv(clicniData?.email) && <Text style={S.hMeta}>Email: {clicniData.email}</Text>}
            </View>
          </View>
          <View style={S.hRight}>
            <View style={S.hBadge}><Text style={S.hBadgeTx}>PHYSIOTHERAPY REPORT</Text></View>
            <Text style={S.hDateTx}>Date: {today}</Text>
            {bookingId && <Text style={S.hBookingTx}>Ref: #{String(bookingId).slice(-8).toUpperCase()}</Text>}
            {hv(overallStatus) && (
              <View style={[S.statusPill, { backgroundColor: statusColor + "33", marginTop: 4 }]}>
                <Text style={[S.statusTx, { color: statusColor }]}>{overallStatus.toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={S.headerAccent} fixed />

        {/* ═══ PATIENT BANNER ═══════════════════════════════════════════════ */}
        {hv(patientName) && (
          <View style={S.patientBanner}>
            <View style={S.pbLeft}>
              <View style={S.pbAvatar}><Text style={S.pbAvatarTx}>{initials}</Text></View>
              <View>
                <Text style={S.pbName}>{capitalizeEachWord(patientName)}</Text>
                <Text style={S.pbMeta}>
                  {[patient?.age ? `${patient.age} yrs` : null, patient?.sex || patient?.gender, patient?.mobileNumber]
                    .filter(Boolean).join("   ·   ")}
                </Text>
              </View>
            </View>
            {hv(patient?.patientId) && (
              <View style={S.pbRight}>
                <Text style={S.pbIdLbl}>Patient ID</Text>
                <Text style={S.pbIdVal}>{patient.patientId}</Text>
              </View>
            )}
          </View>
        )}

        {/* ═══ BODY ═════════════════════════════════════════════════════════ */}
        <View style={S.bodyRow}>

          {/* ─ SIDEBAR ─ */}
          <View style={S.sidebar} fixed>
            {NAV_ITEMS.map((item, i) => (
              <View key={i}>
                {i === 4 && <View style={S.sidebarDivider} />}
                <View style={S.sidebarItem}>
                  <View style={S.sidebarNum}><Text style={S.sidebarNumTx}>{item.num}</Text></View>
                  <Text style={S.sidebarTx}>{item.label}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ─ CONTENT ─ */}
          <View style={S.content}>

            {/* 1. PATIENT INFO */}
            <View style={S.sec}>
              <SH title="Patient & Booking Information" />
              <View style={S.card}>
                <View style={S.grid}>
                  {hv(patientName)                     && <View style={S.c3}><FV label="Full Name"  value={capitalizeEachWord(patientName)} bold /></View>}
                  {hv(patient?.age)                    && <View style={S.c3}><FV label="Age"        value={`${patient.age} years`} /></View>}
                  {hv(patient?.sex || patient?.gender) && <View style={S.c3}><FV label="Gender"     value={patient?.sex || patient?.gender} /></View>}
                  {hv(patient?.mobileNumber)           && <View style={S.c3}><FV label="Mobile"     value={patient.mobileNumber} /></View>}
                  {hv(bookingId)                       && <View style={S.c3}><FV label="Booking ID" value={bookingId} /></View>}
                  {hv(clinicId)                        && <View style={S.c3}><FV label="Clinic ID"  value={clinicId} /></View>}
                  {hv(branchId)                        && <View style={S.c3}><FV label="Branch ID"  value={branchId} /></View>}
                  {hv(clicniData?.name)                && <View style={S.c3}><FV label="Clinic"     value={clicniData.name} /></View>}
                  {hv(doctorName)                      && <View style={S.c3}><FV label="Doctor"     value={doctorName} bold /></View>}
                  {hv(doctorData?.doctorId)            && <View style={S.c3}><FV label="Doctor ID"  value={doctorData.doctorId} /></View>}
                  {hv(overallStatus)                   && <View style={S.c3}><FV label="Status"     value={overallStatus} bold /></View>}
                </View>
              </View>
            </View>

            {/* 2. COMPLAINTS */}
            {(hv(complaints.complaintDetails) || parts.length > 0 || complaints.reportImages.length > 0) && (
              <View style={S.sec}>
                <SH title="Chief Complaint & Symptoms" />
                {hv(complaints.complaintDetails) && (
                  <View style={S.complaintBox}>
                    <Text style={S.lbl}>Chief Complaint</Text>
                    <Text style={[S.val, { fontSize: 9, lineHeight: 1.7, marginTop: 3 }]}>{complaints.complaintDetails}</Text>
                  </View>
                )}
                <View style={S.card}>
                  <View style={S.grid}>
                    {hv(complaints.duration)        && <View style={S.c3}><LV label="Duration"         value={complaints.duration} bold /></View>}
                    {hv(complaints.selectedTherapy) && <View style={S.c3}><LV label="Selected Therapy" value={complaints.selectedTherapy} /></View>}
                    {complaints.reportImages.length > 0 && <View style={S.c3}><LV label="Attached Reports" value={`${complaints.reportImages.length} image(s)`} /></View>}
                  </View>
                  {parts.length > 0 && (
                    <View style={{ marginTop: 5 }}>
                      <Text style={S.lbl}>Affected Body Parts</Text>
                      <View style={S.chipRow}>{parts.map((p, i) => <Chip key={i} text={p} variant="rose" />)}</View>
                    </View>
                  )}
                  {hv(complaints.painAssessmentImage) && (
                    <View style={{ marginTop: 7 }}>
                      <Text style={S.lbl}>Body Diagram</Text>
                      <Image
                        src={String(complaints.painAssessmentImage).startsWith("data:")
                          ? complaints.painAssessmentImage
                          : `data:image/jpeg;base64,${complaints.painAssessmentImage}`}
                        style={S.img}
                      />
                    </View>
                  )}
                  {complaints.reportImages.length > 0 && (
                    <View style={{ marginTop: 7 }}>
                      <Text style={S.lbl}>Report Images</Text>
                      <View style={S.imgContainer}>
                        {complaints.reportImages.slice(0, 4).map((img, i) => <Image key={i} src={img} style={S.img} />)}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* 3. BACKGROUND */}
            {hasBackground && (
              <View style={S.sec}>
                <SH title="Patient Background & History" />
                <View style={S.card}>
                  <View style={S.grid}>
                    {hv(background.previousInjuries)   && <View style={S.c2}><LV label="Previous Injuries"   value={background.previousInjuries} /></View>}
                    {hv(background.currentMedications) && <View style={S.c2}><LV label="Current Medications" value={background.currentMedications} /></View>}
                    {hv(background.allergies)           && <View style={S.c2}><LV label="Allergies"           value={background.allergies} /></View>}
                    {hv(background.occupation)          && <View style={S.c2}><LV label="Occupation"          value={background.occupation} /></View>}
                    {hv(background.insuranceProvider)   && <View style={S.c2}><LV label="Insurance Provider"  value={background.insuranceProvider} /></View>}
                    {hv(background.patientPain) && (
                      <View style={S.c2}>
                        <LV label="Pain Category" value={PAIN_LABEL[background.patientPain] || background.patientPain} bold />
                      </View>
                    )}
                  </View>
                  {background.activityLevels.length > 0 && (
                    <View style={{ marginTop: 4 }}>
                      <Text style={S.lbl}>Activity Level</Text>
                      <View style={S.chipRow}>{background.activityLevels.map((lvl, i) => <Chip key={i} text={lvl} variant="teal" />)}</View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* 4. QUESTIONNAIRE */}
            {hasQuestionnaire && (
              <View style={S.sec}>
                <SH title="Therapy Questionnaire" badge={`${Object.keys(complaints.therapyAnswersObj).length} categories`} />
                {Object.entries(complaints.therapyAnswersObj).map(([cat, qs], ci) => {
                  const validQs = Array.isArray(qs) ? qs.filter((q) => hv(q.question)) : [];
                  if (validQs.length === 0) return null;
                  const answered = validQs.filter((q) => hv(q.answer) && q.answer.toLowerCase() !== "undefined").length;
                  return (
                    <View key={ci} style={[S.qaWrap, { marginBottom: ci < Object.keys(complaints.therapyAnswersObj).length - 1 ? 7 : 0 }]}>
                      <View style={S.qaHead}>
                        <Text style={S.qaHeadTx}>{capitalizeEachWord(cat)}</Text>
                        <Text style={S.qaHeadCount}>{answered} / {validQs.length} answered</Text>
                      </View>
                      {validQs.map((q, qi) => (
                        <View key={qi} style={[S.qaRow, qi % 2 === 1 ? S.qaRowAlt : {}]}>
                          <View style={S.qaNum}><Text style={S.qaNumTx}>{qi + 1}</Text></View>
                          <Text style={S.qaQ}>{q.question || `Question ${q.questionId}`}</Text>
                          <AnswerBadge answer={q.answer} />
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}

            {/* 5. INVESTIGATION */}
            {(investigation.tests.length > 0 || hv(investigation.reason)) && (
              <View style={S.sec}>
                <SH title="Investigation & Tests" />
                <View style={[S.cardAccent, S.cTeal]}>
                  {investigation.tests.length > 0 && (
                    <View style={{ marginBottom: hv(investigation.reason) ? 8 : 0 }}>
                      <Text style={S.lbl}>Recommended Tests</Text>
                      <View style={S.chipRow}>{investigation.tests.map((t, i) => <Chip key={i} text={t} variant="teal" />)}</View>
                    </View>
                  )}
                  {hv(investigation.reason) && <LV label="Clinical Notes / Reason" value={investigation.reason} />}
                </View>
              </View>
            )}

            {/* 6. ASSESSMENT */}
            {hasAssessment && (
              <View style={S.sec}>
                <SH title="Clinical Assessment" />
                <View style={[S.cardAccent, S.cAmber]}>
                  <Text style={S.subSecTitle}>Subjective Assessment</Text>
                  {hv(painScale) && <PainBar scaleText={painScale} />}
                  <View style={S.grid}>
                    {hv(chiefComplaint)     && <View style={S.c2}><LV label="Chief Complaint"    value={chiefComplaint} bold /></View>}
                    {hv(painType)           && <View style={S.c2}><LV label="Pain Type"           value={painType} /></View>}
                    {hv(dur)               && <View style={S.c2}><LV label="Duration"             value={dur} /></View>}
                    {hv(onset)             && <View style={S.c2}><LV label="Onset"                value={onset} /></View>}
                    {hv(aggravatingFactors)&& <View style={S.c2}><LV label="Aggravating Factors"  value={aggravatingFactors} /></View>}
                    {hv(relievingFactors)  && <View style={S.c2}><LV label="Relieving Factors"    value={relievingFactors} /></View>}
                  </View>
                  {hv(observations) && <LV label="Clinical Observations" value={observations} />}
                </View>

                {(difficultiesIn.length > 0 || hv(dailyLivingAffected)) && (
                  <View style={[S.cardAccent, S.cTeal]}>
                    <Text style={S.subSecTitle}>Functional Assessment</Text>
                    {difficultiesIn.length > 0 && (
                      <View style={{ marginBottom: 7 }}>
                        <Text style={S.lbl}>Difficulties In</Text>
                        <View style={S.chipRow}>
                          {difficultiesIn.map((item, i) => <Chip key={i} text={item} variant="blue" />)}
                          {hv(otherDifficulty) && <Chip text={`Other: ${otherDifficulty}`} variant="gray" />}
                        </View>
                      </View>
                    )}
                    {hv(dailyLivingAffected) && <LV label="Impact on Daily Living" value={dailyLivingAffected} />}
                  </View>
                )}

                {(postureAssessment.length > 0 || romStatus.length > 0 || muscleStrength.length > 0 || neurologicalSigns.length > 0) && (
                  <View style={[S.cardAccent, S.cSlate]}>
                    <Text style={S.subSecTitle}>Physical Examination</Text>
                    {postureAssessment.length > 0 && <CheckRow label="Posture Assessment" options={["Normal", "Deviations"]}      selected={postureAssessment} note={postureDeviations} />}
                    {romStatus.length > 0         && <CheckRow label="Range of Motion"    options={["Normal", "Restricted"]}      selected={romStatus}         note={romRestricted ? `${romRestricted}${romJoints ? " - " + romJoints : ""}` : romJoints} />}
                    {muscleStrength.length > 0    && <CheckRow label="Muscle Strength"    options={["Normal", "Weakness in"]}     selected={muscleStrength}    note={muscleWeakness} />}
                    {neurologicalSigns.length > 0 && <CheckRow label="Neurological Signs" options={["Normal", "Balance", "Coordination", "Sensation issues"]} selected={neurologicalSigns} last />}
                  </View>
                )}

                {patientPain === "chronicPain" && (hv(painTriggers) || hv(chronicRelieving)) && (
                  <View style={[S.cardAccent, S.cRose]}>
                    <Text style={S.subSecTitle}>Chronic Pain Assessment</Text>
                    <View style={S.grid}>
                      {hv(painTriggers)     && <View style={S.c2}><LV label="Pain Triggers"     value={painTriggers} /></View>}
                      {hv(chronicRelieving) && <View style={S.c2}><LV label="Relieving Factors" value={chronicRelieving} /></View>}
                    </View>
                  </View>
                )}
                {patientPain === "sportsRehab" && (hv(typeOfSport) || hv(recurringInjuries) || hv(returnToSportGoals)) && (
                  <View style={[S.cardAccent, S.cGreen]}>
                    <Text style={S.subSecTitle}>Sports Rehabilitation Assessment</Text>
                    <View style={S.grid}>
                      {hv(typeOfSport)        && <View style={S.c2}><LV label="Type of Sport"       value={typeOfSport} /></View>}
                      {hv(recurringInjuries)  && <View style={S.c2}><LV label="Recurring Injuries"  value={recurringInjuries} /></View>}
                      {hv(returnToSportGoals) && <View style={{ width: "100%" }}><LV label="Return-to-Sport Goals" value={returnToSportGoals} /></View>}
                    </View>
                  </View>
                )}
                {patientPain === "neuroRehab" && (hv(neuroDiagnosis) || hv(neuroOnset) || hv(mobilityStatus) || hv(cognitiveStatus)) && (
                  <View style={[S.cardAccent, S.cPurple]}>
                    <Text style={S.subSecTitle}>Neuro Rehabilitation Assessment</Text>
                    <View style={S.grid}>
                      {hv(neuroDiagnosis) && <View style={S.c2}><LV label="Diagnosis"       value={neuroDiagnosis} bold /></View>}
                      {hv(neuroOnset)     && <View style={S.c2}><LV label="Onset"            value={neuroOnset} /></View>}
                      {hv(mobilityStatus) && <View style={S.c2}><LV label="Mobility Status"  value={mobilityStatus} /></View>}
                      {hv(cognitiveStatus)&& <View style={S.c2}><LV label="Cognitive Status" value={cognitiveStatus} /></View>}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* 7. DIAGNOSIS */}
            {diagnosisRows.length > 0 && (
              <View style={S.sec}>
                <SH title="Diagnosis" badge={`${diagnosisRows.length} entr${diagnosisRows.length > 1 ? "ies" : "y"}`} />
                <View style={S.tbl}>
                  <View style={S.tHead}>
                    <Text style={[S.tHCell, { flex: 0.3 }]}>#</Text>
                    <Text style={[S.tHCell, { flex: 2.2 }]}>Physiotherapy Diagnosis</Text>
                    <Text style={[S.tHCell, { flex: 1.5 }]}>Affected Area</Text>
                    <Text style={[S.tHCell, { flex: 0.9 }]}>Severity</Text>
                    <Text style={[S.tHCell, { flex: 1   }]}>Stage</Text>
                    <Text style={[S.tHCell, { flex: 2.2 }]}>Clinical Notes</Text>
                  </View>
                  {diagnosisRows.map((diag, i) => (
                    <View key={i} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]}>
                      <Text style={[S.tCellA, { flex: 0.3 }]}>{i + 1}</Text>
                      <Text style={[S.tCellB, { flex: 2.2 }]}>{diag.physioDiagnosis || "—"}</Text>
                      <Text style={[S.tCell,  { flex: 1.5 }]}>{diag.affectedArea || "—"}</Text>
                      <View style={{ flex: 0.9, justifyContent: "center" }}><SevBadge sev={diag.severity} /></View>
                      <View style={{ flex: 1,   justifyContent: "center" }}><StageBadge stage={diag.stage} /></View>
                      <Text style={[S.tCell, { flex: 2.2, lineHeight: 1.5 }]}>{diag.notes || "—"}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 8. TREATMENT PLAN */}
            {(hv(therapistName) || hv(treatmentPlan?.manualTherapy) || hv(treatmentPlan?.precautions)) && (
              <View style={S.sec}>
                <SH title="Treatment Plan" />
                <View style={[S.cardAccent, S.cTeal]}>
                  <View style={S.grid}>
                    {hv(doctorName)               && <View style={S.c2}><LV label="Assigned Doctor"    value={doctorName} bold /></View>}
                    {hv(doctorData?.doctorId)     && <View style={S.c2}><LV label="Doctor ID"           value={doctorData.doctorId} /></View>}
                    {hv(therapistName)            && <View style={S.c2}><LV label="Assigned Therapist" value={therapistName} bold /></View>}
                    {hv(topTherapistId)           && <View style={S.c2}><LV label="Therapist ID"        value={topTherapistId} /></View>}
                    {hv(treatmentPlan?.frequency) && <View style={S.c2}><LV label="Session Frequency"  value={treatmentPlan.frequency} /></View>}
                  </View>
                  {hv(treatmentPlan?.manualTherapy) && <View style={{ marginTop: 4 }}><LV label="Manual Therapy Techniques" value={treatmentPlan.manualTherapy} /></View>}
                  {hv(treatmentPlan?.precautions) && (
                    <View style={{ marginTop: 6 }}>
                      <LV label="Precautions" value={Array.isArray(treatmentPlan.precautions) ? treatmentPlan.precautions.join(", ") : treatmentPlan.precautions} />
                    </View>
                  )}
                  {Array.isArray(treatmentPlan?.modalities) && treatmentPlan.modalities.length > 0 && (
                    <View style={{ marginTop: 6 }}>
                      <Text style={S.lbl}>Modalities Used</Text>
                      <View style={S.chipRow}>{treatmentPlan.modalities.map((m, i) => <Chip key={i} text={m} variant="blue" />)}</View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* 9. THERAPY SESSIONS */}
            {sessionsList.length > 0 && (
              <View style={S.sec}>
                <SH title="Therapy Sessions" badge={`${sessionsList.length} session(s)`} />
                {hv(overallStatus) && (
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <Text style={[S.lbl, { marginBottom: 0, marginRight: 7 }]}>Overall Status:</Text>
                    <View style={[S.statusPill, { backgroundColor: statusColor + "22" }]}>
                      <Text style={[S.statusTx, { color: statusColor }]}>{overallStatus}</Text>
                    </View>
                  </View>
                )}
                {sessionsList.map((sess, i) => (
                  <SessionBlock key={i} sess={sess} isLast={i === sessionsList.length - 1}
                    therapistId={topTherapistId} therapistName={topTherapistName} />
                ))}
              </View>
            )}

            {/* 10. HOME EXERCISE PLAN */}
            {(homeExercises.length > 0 || hv(homeAdvice)) && (
              <View style={S.sec}>
                <SH title="Home Exercise Plan" badge={homeExercises.length > 0 ? `${homeExercises.length} exercise(s)` : null} />
                {homeExercises.length > 0 && (
                  <View style={S.tbl}>
                    <View style={S.tHead}>
                      <Text style={[S.tHCell, { flex: 0.3 }]}>#</Text>
                      <Text style={[S.tHCell, { flex: 2   }]}>Exercise</Text>
                      <Text style={[S.tHCell, { flex: 0.6 }]}>Sets</Text>
                      <Text style={[S.tHCell, { flex: 0.6 }]}>Reps</Text>
                      <Text style={[S.tHCell, { flex: 1   }]}>Duration</Text>
                      <Text style={[S.tHCell, { flex: 1   }]}>Frequency</Text>
                      <Text style={[S.tHCell, { flex: 2.5 }]}>Instructions</Text>
                    </View>
                    {homeExercises.map((ex, i) => (
                      <View key={i} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]}>
                        <Text style={[S.tCellA, { flex: 0.3 }]}>{i + 1}</Text>
                        <Text style={[S.tCellB, { flex: 2   }]}>{ex.name || "—"}</Text>
                        <Text style={[S.tCell,  { flex: 0.6 }]}>{dv(ex.sets)}</Text>
                        <Text style={[S.tCell,  { flex: 0.6 }]}>{dv(ex.reps)}</Text>
                        <Text style={[S.tCell,  { flex: 1   }]}>{dv(ex.duration)}</Text>
                        <Text style={[S.tCell,  { flex: 1   }]}>{dv(ex.frequency)}</Text>
                        <Text style={[S.tCell,  { flex: 2.5, lineHeight: 1.5 }]}>{dv(ex.instructions)}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {hv(homeAdvice) && (
                  <View style={[S.cardAccent, S.cGreen, { marginTop: homeExercises.length > 0 ? 7 : 0 }]}>
                    <Text style={S.lbl}>Home Advice & Instructions</Text>
                    <Text style={[S.val, { lineHeight: 1.7, marginTop: 3 }]}>{homeAdvice}</Text>
                  </View>
                )}
              </View>
            )}

            {/* 11. FOLLOW UP */}
            {(hv(followUpEntry.nextVisitDate) || hv(followUpEntry.reviewNotes)) && (
              <View style={S.sec}>
                <SH title="Follow-Up Plan" />
                <View style={[S.cardAccent, S.cPurple]}>
                  <View style={S.grid}>
                    {hv(followUpEntry.nextVisitDate) && (
                      <View style={S.c2}>
                        <Text style={S.lbl}>Next Visit Date</Text>
                        <Text style={[S.valB, { color: C.purple600, fontSize: 10 }]}>{followUpEntry.nextVisitDate}</Text>
                      </View>
                    )}
                    {hv(followUpEntry.treatmentStatus) && (
                      <View style={S.c2}>
                        <Text style={S.lbl}>Treatment Status</Text>
                        <Chip
                          text={followUpEntry.treatmentStatus}
                          variant={["Active","Completed"].includes(followUpEntry.treatmentStatus) ? "green"
                            : followUpEntry.treatmentStatus === "Discharged" ? "rose" : "amber"}
                        />
                      </View>
                    )}
                  </View>
                  {hv(followUpEntry.reviewNotes)   && <View style={{ marginTop: 5 }}><LV label="Review Notes"            value={followUpEntry.reviewNotes} /></View>}
                  {hv(followUpEntry.modifications) && <View style={{ marginTop: 5 }}><LV label="Treatment Modifications" value={followUpEntry.modifications} /></View>}
                </View>
              </View>
            )}

            {/* 12. TREATMENT TEMPLATES */}
            {treatmentTemplates.length > 0 && (
              <View style={S.sec}>
                <SH title="Treatment Templates" badge={`${treatmentTemplates.length}`} />
                <View style={S.tbl}>
                  <View style={S.tHead}>
                    <Text style={[S.tHCell, { flex: 0.3 }]}>#</Text>
                    <Text style={[S.tHCell, { flex: 1.8 }]}>Condition</Text>
                    <Text style={[S.tHCell, { flex: 1.8 }]}>Manual Therapy</Text>
                    <Text style={[S.tHCell, { flex: 1   }]}>Duration</Text>
                    <Text style={[S.tHCell, { flex: 1   }]}>Frequency</Text>
                  </View>
                  {treatmentTemplates.map((t, i) => (
                    <View key={i} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]}>
                      <Text style={[S.tCellA, { flex: 0.3 }]}>{i + 1}</Text>
                      <Text style={[S.tCellB, { flex: 1.8 }]}>{t.condition    || "—"}</Text>
                      <Text style={[S.tCell,  { flex: 1.8 }]}>{t.manualTherapy|| "—"}</Text>
                      <Text style={[S.tCell,  { flex: 1   }]}>{t.duration     || "—"}</Text>
                      <Text style={[S.tCell,  { flex: 1   }]}>{t.frequency    || "—"}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 13. SIGNATURES */}
            {(hv(doctorName) || hv(therapistName)) && (
              <View style={S.sigSection}>
                {hv(doctorName) && (
                  <View style={S.sigBox}>
                    <View style={S.sigLine} />
                    <Text style={S.sigRole}>Authorized by</Text>
                    <Text style={S.sigName}>{doctorName}</Text>
                    {hv(doctorData?.qualification) && <Text style={S.sigSub}>{doctorData.qualification}</Text>}
                    {hv(doctorData?.regNumber)     && <Text style={S.sigSub}>Reg. No: {doctorData.regNumber}</Text>}
                  </View>
                )}
                {hv(therapistName) && (
                  <View style={S.sigBox}>
                    <View style={S.sigLine} />
                    <Text style={S.sigRole}>Physiotherapist</Text>
                    <Text style={S.sigName}>{therapistName}</Text>
                    {hv(topTherapistId) && <Text style={S.sigSub}>ID: {topTherapistId}</Text>}
                  </View>
                )}
              </View>
            )}

          </View>{/* end content */}
        </View>{/* end bodyRow */}

        {/* ═══ FOOTER ═══════════════════════════════════════════════════════ */}
        <View style={S.footer} fixed>
          <Text style={S.ftLeft}>{clicniData?.name || "PhysioCare Clinic"}</Text>
          <Text style={S.ftMid}>CONFIDENTIAL  —  For authorized medical personnel only</Text>
          <Text style={S.ftRight} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
};

export default PrescriptionPDF;