// src/utils/PdfGenerator.jsx  — BRAND REDESIGN v5
import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { capitalizeEachWord } from "./CaptalZeWord";

// ─────────────────────────────────────────────────────────────────────────────
//  BRAND COLOR PALETTE  (matches your COLORS export)
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  // Brand
  navy:      "#1B4F8A",   // bgcolor / primary
  navyDark:  "#163f70",   // darker navy for hover/depth
  navyDeep:  "#0f2d52",   // deepest navy (header bg)
  navyMid:   "#2A6DB5",   // secondary / lighter navy
  orange:    "#f9c571",   // accent orange
  orangeDk:  "#e8a93a",   // darker orange for borders/text
  orangeLt:  "#fdf3dc",   // very light orange tint
  white:     "#ffffff",
  // Light blues (for programs)
  skyBrand:  "#e8f1fb",   // light blue bg for programs
  skyBorder: "#b8d0f0",   // border for light blue cards
  skyText:   "#1B4F8A",   // text on light blue
  // Grays
  gray50:    "#f8fafc",
  gray100:   "#f0f4f8",
  gray150:   "#e5ecf3",
  gray200:   "#d4dfec",
  gray300:   "#b0c1d4",
  gray400:   "#7a94b0",
  gray500:   "#5a7592",
  gray600:   "#3d5a75",
  gray700:   "#2a3f55",
  gray800:   "#1a2a3a",
  // Semantic
  red50:     "#fef2f2",
  red100:    "#fee2e2",
  red500:    "#ef4444",
  red600:    "#dc2626",
  red700:    "#b91c1c",
  amber50:   "#fffbeb",
  amber100:  "#fef3c7",
  amber600:  "#d97706",
  amber700:  "#b45309",
  em50:      "#ecfdf5",
  em100:     "#d1fae5",
  em200:     "#a7f3d0",
  em400:     "#34d399",
  em500:     "#10b981",
  em600:     "#059669",
  em700:     "#047857",
  em800:     "#065f46",
  purple50:  "#faf5ff",
  purple100: "#ede9fe",
  purple600: "#7c3aed",
  purple700: "#6d28d9",
  blue50:    "#eff6ff",
  blue100:   "#dbeafe",
  blue600:   "#2563eb",
  blue700:   "#1d4ed8",
  teal:      "#16a085",
};

const L = {
  pageP: 32,
  sectionGap: 14,
  cardR: 4,
};

const S = StyleSheet.create({
  page: {
    fontSize: 8,
    fontFamily: "Helvetica",
    backgroundColor: C.white,
    padding: 0,
  },

  // ── HEADER ──
  header: {
    backgroundColor: C.navyDeep,
    flexDirection: "column",
  },
  headerAccentBar: {
    height: 4,
    flexDirection: "row",
  },
  headerAccentSeg1: { flex: 3, backgroundColor: C.orange },
  headerAccentSeg2: { flex: 1, backgroundColor: C.orangeDk },
  headerAccentSeg3: { flex: 5, backgroundColor: C.navyMid },
  headerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: L.pageP,
    paddingRight: L.pageP,
  },
  hLeft: { flex: 1, paddingRight: 16 },
  hClinicName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  // address rendered as multiple Text lines so it wraps naturally
  hAddress: {
    fontSize: 7,
    color: C.gray300,
    lineHeight: 1.8,
    flexWrap: "wrap",
  },
  hMeta: { fontSize: 7, color: C.gray400, lineHeight: 1.7 },
  hRight: { alignItems: "flex-end", flexShrink: 0 },
  hDocType: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.orange,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  hDate:       { fontSize: 7.5, color: C.gray300, textAlign: "right", marginBottom: 2 },
  hRef:        { fontSize: 7,   color: C.gray500, textAlign: "right", marginBottom: 2 },
  hStatusWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 3 },
  hStatusPill: {
    borderRadius: 2,
    paddingTop: 2, paddingBottom: 2,
    paddingLeft: 8, paddingRight: 8,
  },
  hStatusTx: { fontSize: 6.5, fontFamily: "Helvetica-Bold", letterSpacing: 1.2 },

  // ── PATIENT BANNER ──
  patientBanner: {
    backgroundColor: C.navy,
    paddingTop: 10,
    paddingBottom: 12,
    paddingLeft: L.pageP,
    paddingRight: L.pageP,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 3,
    borderBottomColor: C.orange,
  },
  pbLeft: { flexDirection: "row", alignItems: "center" },
  pbAvatar: {
    width: 38, height: 38,
    borderRadius: 4,
    backgroundColor: C.navyDark,
    alignItems: "center", justifyContent: "center",
    marginRight: 12, flexShrink: 0,
    borderTopWidth: 2, borderRightWidth: 2,
    borderBottomWidth: 2, borderLeftWidth: 2,
    borderTopColor: C.orange, borderRightColor: C.orange,
    borderBottomColor: C.orange, borderLeftColor: C.orange,
  },
  pbAvatarTx: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.orange },
  pbName:     { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: -0.1 },
  pbMeta:     { fontSize: 7.5, color: C.gray300, marginTop: 3, letterSpacing: 0.2 },
  pbRight:    { alignItems: "flex-end" },
  pbIdWrap: {
    backgroundColor: C.navyDark,
    borderRadius: 3,
    paddingTop: 5, paddingBottom: 5,
    paddingLeft: 10, paddingRight: 10,
    borderTopWidth: 1, borderRightWidth: 1,
    borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.orange, borderRightColor: C.orange,
    borderBottomColor: C.orange, borderLeftColor: C.orange,
  },
  pbIdLbl: { fontSize: 6, color: C.gray400, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2, fontFamily: "Helvetica-Bold" },
  pbIdVal: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.orange, letterSpacing: 0.5 },

  // ── BODY ──
  bodyWrap: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 28,
    paddingLeft: L.pageP,
    paddingRight: L.pageP,
    backgroundColor: C.white,
  },

  sec: { marginBottom: L.sectionGap },

  // ── SECTION HEADER — with background highlight ──
  secHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: C.navy,
    borderRadius: 3,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 10,
    paddingRight: 10,
  },
  secNumBox: {
    width: 18, height: 18,
    backgroundColor: C.orange,
    borderRadius: 2,
    alignItems: "center", justifyContent: "center",
    marginRight: 8,
    flexShrink: 0,
  },
  secNum: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.navyDeep },
  secTitleWrap: { flex: 1, flexDirection: "row", alignItems: "center" },
  secTitle: {
    fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.white,
    textTransform: "uppercase", letterSpacing: 1.5,
  },
  secRule: {
    flex: 1, height: 1,
    backgroundColor: C.navyMid,
    marginLeft: 10,
  },
  secBadge: {
    backgroundColor: C.orange,
    borderRadius: 12,
    paddingTop: 2, paddingBottom: 2,
    paddingLeft: 8, paddingRight: 8,
    marginLeft: 8,
  },
  secBadgeTx: { fontSize: 6, color: C.navyDeep, fontFamily: "Helvetica-Bold", letterSpacing: 0.3 },

  subSecTitle: {
    fontSize: 7, fontFamily: "Helvetica-Bold", color: C.navy,
    textTransform: "uppercase", letterSpacing: 1,
    marginBottom: 8, marginTop: 2,
    paddingBottom: 5,
    borderBottomWidth: 1, borderBottomColor: C.gray150,
  },

  // ── CARDS ──
  card: {
    backgroundColor: C.gray50,
    borderRadius: L.cardR,
    borderTopWidth: 1, borderRightWidth: 1,
    borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.gray200, borderRightColor: C.gray200,
    borderBottomColor: C.gray200, borderLeftColor: C.gray200,
    padding: 14,
    marginBottom: 6,
  },
  cardAccent: {
    backgroundColor: C.white,
    borderRadius: L.cardR,
    borderTopWidth: 1, borderRightWidth: 1,
    borderBottomWidth: 1, borderLeftWidth: 2,
    borderTopColor: C.gray150, borderRightColor: C.gray150,
    borderBottomColor: C.gray150, borderLeftColor: C.gray200,
    padding: 12,
    marginBottom: 6,
  },
  cEm:     { borderLeftColor: C.em500,     borderLeftWidth: 3 },
  cGold:   { borderLeftColor: C.orange,    borderLeftWidth: 3 },
  cRed:    { borderLeftColor: C.red500,    borderLeftWidth: 3 },
  cAmber:  { borderLeftColor: C.amber600,  borderLeftWidth: 3 },
  cBlue:   { borderLeftColor: C.navyMid,   borderLeftWidth: 3 },
  cPurple: { borderLeftColor: C.purple600, borderLeftWidth: 3 },
  cSky:    { borderLeftColor: C.teal,      borderLeftWidth: 3 },
  cSlate:  { borderLeftColor: C.gray400,   borderLeftWidth: 3 },
  cNavy:   { borderLeftColor: C.navy,      borderLeftWidth: 3 },

  complaintBox: {
    backgroundColor: C.red50,
    borderRadius: L.cardR,
    borderTopWidth: 1, borderRightWidth: 1,
    borderBottomWidth: 1, borderLeftWidth: 3,
    borderTopColor: C.red100, borderRightColor: C.red100,
    borderBottomColor: C.red100, borderLeftColor: C.red600,
    padding: 12, marginBottom: 6,
  },

  // ── GRID ──
  grid: { flexDirection: "row", flexWrap: "wrap" },
  c2:  { width: "50%",    marginBottom: 10, paddingRight: 14 },
  c3:  { width: "33.33%", marginBottom: 10, paddingRight: 10 },
  c4:  { width: "25%",    marginBottom: 10, paddingRight: 8  },

  // ── FIELD: label clearly visible ──
  fieldBox: { marginBottom: 4 },
  lbl: {
    fontSize: 6.5,
    color: C.navyMid,                 // brand navy — clearly visible
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: 3,
    fontFamily: "Helvetica-Bold",
    backgroundColor: C.gray100,       // subtle bg so it stands out
    paddingTop: 2, paddingBottom: 2,
    paddingLeft: 4, paddingRight: 4,
    borderRadius: 2,
  },
  val:   { fontSize: 8, color: C.gray700, lineHeight: 1.5 },
  valB:  { fontSize: 8, color: C.navyDeep, fontFamily: "Helvetica-Bold", lineHeight: 1.5 },
  valXL: { fontSize: 12, color: C.navy, fontFamily: "Helvetica-Bold" },

  chipRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 3 },
  chip: {
    borderRadius: 3,
    paddingTop: 2, paddingBottom: 2,
    paddingLeft: 7, paddingRight: 7,
    marginRight: 4, marginBottom: 4,
    borderTopWidth: 1, borderRightWidth: 1,
    borderBottomWidth: 1, borderLeftWidth: 1,
  },
  chipTx: { fontSize: 6.5, fontFamily: "Helvetica-Bold" },
  // Brand chips
  chipNavy:    { backgroundColor: C.navy,    borderTopColor: C.navyDark, borderRightColor: C.navyDark, borderBottomColor: C.navyDark, borderLeftColor: C.navyDark },
  chipNavyTx:  { color: C.white },
  chipOrange:  { backgroundColor: C.orangeLt,borderTopColor: C.orangeDk, borderRightColor: C.orangeDk, borderBottomColor: C.orangeDk, borderLeftColor: C.orangeDk },
  chipOrangeTx:{ color: C.orangeDk },
  // Semantic chips
  chipEm:      { backgroundColor: C.em50,     borderTopColor: C.em200,    borderRightColor: C.em200,    borderBottomColor: C.em200,    borderLeftColor: C.em200    },
  chipEmTx:    { color: C.em700 },
  chipRed:     { backgroundColor: C.red50,    borderTopColor: C.red100,   borderRightColor: C.red100,   borderBottomColor: C.red100,   borderLeftColor: C.red100   },
  chipRedTx:   { color: C.red700 },
  chipAmb:     { backgroundColor: C.amber50,  borderTopColor: C.amber100, borderRightColor: C.amber100, borderBottomColor: C.amber100, borderLeftColor: C.amber100 },
  chipAmbTx:   { color: C.amber700 },
  chipBlue:    { backgroundColor: C.blue50,   borderTopColor: C.blue100,  borderRightColor: C.blue100,  borderBottomColor: C.blue100,  borderLeftColor: C.blue100  },
  chipBlueTx:  { color: C.blue700 },
  chipPur:     { backgroundColor: C.purple50, borderTopColor: C.purple100,borderRightColor: C.purple100,borderBottomColor: C.purple100,borderLeftColor: C.purple100},
  chipPurTx:   { color: C.purple700 },
  chipSky:     { backgroundColor: C.skyBrand, borderTopColor: C.skyBorder,borderRightColor: C.skyBorder,borderBottomColor: C.skyBorder,borderLeftColor: C.skyBorder},
  chipSkyTx:   { color: C.skyText },
  chipSlate:   { backgroundColor: C.gray100,  borderTopColor: C.gray200,  borderRightColor: C.gray200,  borderBottomColor: C.gray200,  borderLeftColor: C.gray200  },
  chipSlateTx: { color: C.gray600 },

  divider: { borderBottomWidth: 1, borderBottomColor: C.gray100, marginTop: 8, marginBottom: 8 },

  pbTrack:  { height: 7, backgroundColor: C.gray100, borderRadius: 3.5, marginTop: 4, marginBottom: 3, overflow: "hidden" },
  pbFill:   { height: 7, borderRadius: 3.5 },
  pbLabels: { flexDirection: "row", justifyContent: "space-between" },
  pbLblTx:  { fontSize: 6, color: C.gray400 },

  checkRow: {
    flexDirection: "row", alignItems: "flex-start",
    marginBottom: 6, paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: C.gray50,
  },
  checkLabel: { fontSize: 7.5, color: C.navy, fontFamily: "Helvetica-Bold", width: 120, marginTop: 2, flexShrink: 0 },
  checkPills: { flexDirection: "row", flexWrap: "wrap", flex: 1 },
  checkOn: {
    backgroundColor: C.navy, borderRadius: 3,
    paddingTop: 2, paddingBottom: 2, paddingLeft: 7, paddingRight: 7,
    marginRight: 4, marginBottom: 3,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.navyDark, borderRightColor: C.navyDark, borderBottomColor: C.navyDark, borderLeftColor: C.navyDark,
  },
  checkOff: {
    backgroundColor: C.gray50, borderRadius: 3,
    paddingTop: 2, paddingBottom: 2, paddingLeft: 7, paddingRight: 7,
    marginRight: 4, marginBottom: 3,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.gray150, borderRightColor: C.gray150, borderBottomColor: C.gray150, borderLeftColor: C.gray150,
  },
  checkOnTx:  { fontSize: 7, color: C.white, fontFamily: "Helvetica-Bold" },
  checkOffTx: { fontSize: 7, color: C.gray400 },
  checkNote:  { fontSize: 6, color: C.gray500, fontStyle: "italic", marginTop: 3, flex: 1 },

  qaWrap: {
    borderRadius: L.cardR, overflow: "hidden", marginBottom: 6,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.gray200, borderRightColor: C.gray200, borderBottomColor: C.gray200, borderLeftColor: C.gray200,
  },
  qaHead: {
    backgroundColor: C.navy,
    paddingTop: 7, paddingBottom: 7, paddingLeft: 12, paddingRight: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  qaHeadTx:    { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white },
  qaHeadCount: { fontSize: 6.5, color: C.orange },
  qaRow: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 12,
    borderTopWidth: 1, borderTopColor: C.gray100,
  },
  qaRowAlt: { backgroundColor: C.gray50 },
  qaNum: {
    width: 15, height: 15, borderRadius: 2,
    backgroundColor: C.orangeLt, alignItems: "center", justifyContent: "center",
    marginRight: 8, flexShrink: 0,
  },
  qaNumTx: { fontSize: 6, color: C.navyDeep, fontFamily: "Helvetica-Bold" },
  qaQ:    { fontSize: 7.5, color: C.gray600, flex: 1, paddingRight: 12, lineHeight: 1.5 },

  tbl: {
    borderRadius: L.cardR, overflow: "hidden", marginBottom: 6,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.gray200, borderRightColor: C.gray200, borderBottomColor: C.gray200, borderLeftColor: C.gray200,
  },
  tHead: {
    flexDirection: "row",
    backgroundColor: C.navy,
    paddingTop: 7, paddingBottom: 7, paddingLeft: 12, paddingRight: 12,
  },
  tHCell:  { fontSize: 6.5, color: C.orange, fontFamily: "Helvetica-Bold", paddingRight: 6, letterSpacing: 0.5, textTransform: "uppercase" },
  tRow: {
    flexDirection: "row",
    borderTopWidth: 1, borderTopColor: C.gray100,
    paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 12,
  },
  tRowAlt: { backgroundColor: C.gray50 },
  tCell:   { fontSize: 7.5, color: C.gray500, paddingRight: 6, lineHeight: 1.4 },
  tCellB:  { fontSize: 7.5, color: C.navyDeep, fontFamily: "Helvetica-Bold", paddingRight: 6 },
  tCellEm: { fontSize: 7.5, color: C.em600,    fontFamily: "Helvetica-Bold", paddingRight: 6 },
  tCellNum:{ fontSize: 7,   color: C.gray400,  paddingRight: 6 },

  sevMild:        { backgroundColor: C.em50,    borderRadius: 2, paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6 },
  sevModerate:    { backgroundColor: C.amber50, borderRadius: 2, paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6 },
  sevSevere:      { backgroundColor: C.red50,   borderRadius: 2, paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6 },
  sevMildTx:      { fontSize: 6.5, color: C.em700,    fontFamily: "Helvetica-Bold" },
  sevModerateTx:  { fontSize: 6.5, color: C.amber700, fontFamily: "Helvetica-Bold" },
  sevSevereTx:    { fontSize: 6.5, color: C.red700,   fontFamily: "Helvetica-Bold" },

  stageAcute:     { backgroundColor: C.red50,    borderRadius: 2, paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6 },
  stageSub:       { backgroundColor: C.amber50,  borderRadius: 2, paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6 },
  stageChronic:   { backgroundColor: C.purple50, borderRadius: 2, paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6 },
  stageAcuteTx:   { fontSize: 6.5, color: C.red700,    fontFamily: "Helvetica-Bold" },
  stageSubTx:     { fontSize: 6.5, color: C.amber700,  fontFamily: "Helvetica-Bold" },
  stageChronicTx: { fontSize: 6.5, color: C.purple700, fontFamily: "Helvetica-Bold" },

  // ── PACKAGE — navy themed ──
  pkgWrap:   { marginBottom: 8 },
  pkgHeader: {
    backgroundColor: C.navyDeep,
    paddingTop: 9, paddingBottom: 9, paddingLeft: 14, paddingRight: 14,
    borderTopLeftRadius: L.cardR, borderTopRightRadius: L.cardR,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  pkgTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.white },
  pkgPrice: { fontSize: 7.5, color: C.orange },
  pkgBody: {
    borderTopWidth: 0,
    borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderRightColor: C.gray200, borderBottomColor: C.gray200, borderLeftColor: C.gray200,
    borderBottomLeftRadius: L.cardR, borderBottomRightRadius: L.cardR,
    padding: 12, backgroundColor: C.gray50,
  },

  // ── PROGRAM — LIGHT BLUE ──
  progHeader: {
    backgroundColor: C.navyMid,          // medium navy header
    paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 12,
    borderTopLeftRadius: 3, borderTopRightRadius: 3,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  progTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white },
  progBody: {
    borderTopWidth: 0,
    borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderRightColor: C.skyBorder, borderBottomColor: C.skyBorder, borderLeftColor: C.skyBorder,
    borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
    padding: 9, marginBottom: 8,
    backgroundColor: C.skyBrand,         // ← LIGHT BLUE background
  },

  // ── THERAPY — orange-accented ──
  therapyHeader: {
    backgroundColor: C.orangeLt,
    paddingTop: 6, paddingBottom: 6, paddingLeft: 10, paddingRight: 10,
    borderTopLeftRadius: 3, borderTopRightRadius: 3,
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 0, borderLeftWidth: 1,
    borderTopColor: C.orangeDk, borderRightColor: C.orangeDk, borderLeftColor: C.orangeDk,
  },
  therapyTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.navyDeep },
  therapyBody: {
    borderTopWidth: 0,
    borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderRightColor: C.orangeDk, borderBottomColor: C.orangeDk, borderLeftColor: C.orangeDk,
    borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
    overflow: "hidden", marginBottom: 6,
  },

  metaBar: {
    flexDirection: "row", flexWrap: "wrap", marginBottom: 8,
    paddingTop: 5, paddingBottom: 5, paddingLeft: 8, paddingRight: 8,
    backgroundColor: C.white, borderRadius: 3,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 1,
    borderTopColor: C.gray150, borderRightColor: C.gray150,
    borderBottomColor: C.gray150, borderLeftColor: C.gray150,
  },
  imgContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  img: { width: 75, height: 75, borderRadius: 4, marginRight: 8, marginBottom: 6 },

  sigSection: { marginTop: 20, flexDirection: "row", justifyContent: "flex-end" },
  sigBox:     { alignItems: "center", width: 140, marginLeft: 32 },
  sigLine: {
    borderTopWidth: 2, borderTopColor: C.orange,
    width: "100%", marginBottom: 6, marginTop: 28,
  },
  sigRole: { fontSize: 6, color: C.gray400, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.8 },
  sigName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.navy, textAlign: "center", marginTop: 2 },
  sigSub:  { fontSize: 6.5, color: C.gray500, textAlign: "center", marginTop: 1 },

  footer: {
    backgroundColor: C.navyDeep,
    paddingTop: 7, paddingBottom: 7,
    paddingLeft: L.pageP, paddingRight: L.pageP,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderTopWidth: 1, borderTopColor: C.navy,
  },
  footerAccentLine: { height: 2, backgroundColor: C.orange },
  ftLeft:  { fontSize: 7,   color: C.orange },
  ftMid:   { fontSize: 6,   color: C.gray500, textAlign: "center", letterSpacing: 0.3 },
  ftRight: { fontSize: 6.5, color: C.gray400 },
});

// ─────────────────────────────────────────────────────────────────────────────
//  DATA RESOLVER  (unchanged logic)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const dv = (v) =>
  v != null && String(v).trim() !== "" && String(v) !== "NA" ? String(v) : "—";
const hv = (v) =>
  v != null && v !== "" && v !== "NA" &&
  String(v).trim() !== "" && String(v).toLowerCase() !== "undefined";

const PAIN_LABEL = {
  chronicPain:      "Chronic Pain",
  sportsRehab:      "Sports Rehab",
  neuroRehab:       "Neuro Rehab",
  acutePain:        "Acute Pain",
  neuropathicPain:  "Neuropathic Pain",
  referredPain:     "Referred Pain",
  inflammatoryPain: "Inflammatory Pain",
};

const getInitials = (name) => {
  if (!name) return "PT";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─────────────────────────────────────────────────────────────────────────────
//  ADDRESS HELPER — splits long address into max 4 lines
// ─────────────────────────────────────────────────────────────────────────────
function splitAddress(address) {
  if (!address) return [];
  // Split on commas, then group into ~4 segments
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 4) return parts;
  // Merge groups so we get max 4 lines
  const result = [];
  const groupSize = Math.ceil(parts.length / 4);
  for (let i = 0; i < parts.length; i += groupSize) {
    result.push(parts.slice(i, i + groupSize).join(", "));
  }
  return result.slice(0, 4);
}

// ─────────────────────────────────────────────────────────────────────────────
//  PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
const SectionBlock = ({ num, title, badge, children }) => (
  <View style={S.sec} wrap={false}>
    <View style={S.secHeader}>
      {num && (
        <View style={S.secNumBox}>
          <Text style={S.secNum}>{num}</Text>
        </View>
      )}
      <View style={S.secTitleWrap}>
        <Text style={S.secTitle}>{title}</Text>
        <View style={S.secRule} />
        {badge && (
          <View style={S.secBadge}>
            <Text style={S.secBadgeTx}>{badge}</Text>
          </View>
        )}
      </View>
    </View>
    {children}
  </View>
);

const SectionBlockWrap = ({ num, title, badge, children }) => (
  <View style={S.sec}>
    <View style={S.secHeader} minPresenceAhead={40}>
      {num && (
        <View style={S.secNumBox}>
          <Text style={S.secNum}>{num}</Text>
        </View>
      )}
      <View style={S.secTitleWrap}>
        <Text style={S.secTitle}>{title}</Text>
        <View style={S.secRule} />
        {badge && (
          <View style={S.secBadge}>
            <Text style={S.secBadgeTx}>{badge}</Text>
          </View>
        )}
      </View>
    </View>
    {children}
  </View>
);

const FV = ({ label, value, bold = false }) => {
  if (!hv(value)) return null;
  return (
    <View style={S.fieldBox}>
      <Text style={S.lbl}>{label}</Text>
      <Text style={bold ? S.valB : S.val}>{dv(value)}</Text>
    </View>
  );
};

const Chip = ({ text, variant = "em" }) => {
  const map = {
    navy:   [S.chipNavy,   S.chipNavyTx],
    orange: [S.chipOrange, S.chipOrangeTx],
    em:     [S.chipEm,     S.chipEmTx],
    red:    [S.chipRed,    S.chipRedTx],
    amber:  [S.chipAmb,    S.chipAmbTx],
    blue:   [S.chipBlue,   S.chipBlueTx],
    purple: [S.chipPur,    S.chipPurTx],
    sky:    [S.chipSky,    S.chipSkyTx],
    slate:  [S.chipSlate,  S.chipSlateTx],
    gold:   [S.chipOrange, S.chipOrangeTx],
  };
  const [bg, tx] = map[variant] || map.em;
  return <View style={[S.chip, bg]}><Text style={[S.chipTx, tx]}>{text}</Text></View>;
};

const AnswerBadge = ({ answer }) => {
  const display = String(answer ?? "").trim();
  if (!display || display.toLowerCase() === "undefined" || display.toLowerCase() === "na")
    return <Chip text="Not answered" variant="slate" />;
  const up = display.toUpperCase();
  if (up === "YES") return <Chip text="YES" variant="em" />;
  if (up === "NO")  return <Chip text="NO"  variant="red" />;
  return <Chip text={display} variant="sky" />;
};

const PainBar = ({ scaleText }) => {
  const m   = String(scaleText ?? "").match(/(\d+)\s*\/\s*(\d+)/);
  const num = m ? parseInt(m[1]) : parseInt(String(scaleText ?? "0")) || 0;
  const max = m ? parseInt(m[2]) : 10;
  const pct = Math.min((num / max) * 100, 100);
  const color = pct >= 70 ? C.red600 : pct >= 40 ? C.amber600 : C.em500;
  const bgColor = pct >= 70 ? C.red50 : pct >= 40 ? C.amber50 : C.em50;
  const labelText = pct >= 70 ? "SEVERE" : pct >= 40 ? "MODERATE" : "MILD";
  const labelColor = pct >= 70 ? C.red700 : pct >= 40 ? C.amber700 : C.em700;
  return (
    <View style={{ marginBottom: 10 }} wrap={false}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <Text style={S.lbl}>Pain Scale</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color }}>{num}</Text>
          <Text style={{ fontSize: 8, color: C.gray400 }}> / {max}  </Text>
          <View style={{ backgroundColor: bgColor, borderRadius: 2, paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6 }}>
            <Text style={{ fontSize: 6.5, color: labelColor, fontFamily: "Helvetica-Bold", letterSpacing: 0.8 }}>{labelText}</Text>
          </View>
        </View>
      </View>
      <View style={S.pbTrack}>
        <View style={[S.pbFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <View style={S.pbLabels}>
        <Text style={S.pbLblTx}>0 · No Pain</Text>
        <Text style={S.pbLblTx}>5 · Moderate</Text>
        <Text style={S.pbLblTx}>10 · Worst</Text>
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
      {hv(note) && <Text style={S.checkNote}>· {note}</Text>}
    </View>
  </View>
);

const SevBadge = ({ sev }) => {
  if (!hv(sev)) return <Text style={S.tCell}>—</Text>;
  const map = {
    Mild:     [S.sevMild,     S.sevMildTx],
    Moderate: [S.sevModerate, S.sevModerateTx],
    Severe:   [S.sevSevere,   S.sevSevereTx],
  };
  const [bg, tx] = map[sev] || map.Mild;
  return <View style={bg}><Text style={tx}>{sev}</Text></View>;
};

const StageBadge = ({ stage }) => {
  if (!hv(stage)) return <Text style={S.tCell}>—</Text>;
  const map = {
    Acute:       [S.stageAcute,   S.stageAcuteTx],
    "Sub-acute": [S.stageSub,     S.stageSubTx],
    Chronic:     [S.stageChronic, S.stageChronicTx],
  };
  const [bg, tx] = map[stage] || map["Sub-acute"];
  return <View style={bg}><Text style={tx}>{stage}</Text></View>;
};

// ─────────────────────────────────────────────────────────────────────────────
//  EXERCISE TABLE
// ─────────────────────────────────────────────────────────────────────────────
const ExerciseTable = ({ exercises }) => {
  if (!exercises || exercises.length === 0)
    return (
      <View style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 12 }}>
        <Text style={{ fontSize: 7, color: C.gray400, fontStyle: "italic" }}>No exercises recorded.</Text>
      </View>
    );
  return (
    <View style={S.tbl}>
      <View style={S.tHead}>
        <Text style={[S.tHCell, { flex: 0.25 }]}>#</Text>
        <Text style={[S.tHCell, { flex: 2.2  }]}>Exercise</Text>
        <Text style={[S.tHCell, { flex: 0.65 }]}>Sessions</Text>
        <Text style={[S.tHCell, { flex: 0.55 }]}>Sets</Text>
        <Text style={[S.tHCell, { flex: 0.55 }]}>Reps</Text>
        <Text style={[S.tHCell, { flex: 1.2  }]}>Frequency</Text>
        <Text style={[S.tHCell, { flex: 2    }]}>Notes</Text>
      </View>
      {exercises.map((ex, i) => (
        <View key={i} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]}>
          <Text style={[S.tCellNum, { flex: 0.25 }]}>{i + 1}</Text>
          <Text style={[S.tCellB,   { flex: 2.2  }]}>{dv(ex.name || ex.exerciseName)}</Text>
          <Text style={[S.tCell,    { flex: 0.65 }]}>{dv(ex.noOfSessions ?? ex.session ?? ex.sessions)}</Text>
          <Text style={[S.tCell,    { flex: 0.55 }]}>{dv(ex.sets)}</Text>
          <Text style={[S.tCell,    { flex: 0.55 }]}>{dv(ex.repetitions ?? ex.reps)}</Text>
          <Text style={[S.tCell,    { flex: 1.2  }]}>{dv(ex.frequency)}</Text>
          <Text style={[S.tCell,    { flex: 2, lineHeight: 1.4 }]}>{dv(ex.notes)}</Text>
        </View>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  THERAPY / SESSION BLOCKS
// ─────────────────────────────────────────────────────────────────────────────
const TherapyBlock = ({ therapy }) => (
  <View style={{ marginBottom: 8 }} wrap={false}>
    <View style={S.therapyHeader}>
      <Text style={S.therapyTitle}>{therapy.therapyName || "Therapy"}</Text>
      {therapy.totalPrice > 0 && (
        <Text style={{ fontSize: 7, color: C.navyDeep, fontFamily: "Helvetica-Bold" }}>Rs. {therapy.totalPrice}</Text>
      )}
    </View>
    <View style={S.therapyBody}>
      <ExerciseTable exercises={therapy.exercises || []} />
    </View>
  </View>
);

const MetaBar = ({ sess, therapistId, therapistName }) => {
  const tName = sess.therapistName || therapistName || "";
  const tId   = sess.therapistId   || therapistId   || "";
  if (!tName && !tId && !sess.serviceType) return null;
  return (
    <View style={S.metaBar}>
      {sess.serviceType && <Chip text={`Type: ${sess.serviceType}`} variant="slate" />}
      {tName && <Chip text={`Therapist: ${tName}`} variant="navy" />}
      {tId   && <Chip text={`ID: ${tId}`}           variant="sky" />}
    </View>
  );
};

const SessionBlock = ({ sess, isLast, therapistId, therapistName }) => {
  const sType = (sess.serviceType || "").toLowerCase();

  if (sType === "package") {
    return (
      <View style={[S.pkgWrap, { marginBottom: isLast ? 0 : 12 }]}>
        <View style={S.pkgHeader} wrap={false}>
          <Text style={S.pkgTitle}>{sess.packageName || "Package"}</Text>
          {sess.totalPrice > 0 && <Text style={S.pkgPrice}>Rs. {sess.totalPrice}</Text>}
        </View>
        <View style={S.pkgBody}>
          <MetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
          {Array.isArray(sess.programs) && sess.programs.length > 0
            ? sess.programs.map((prog, pi) => (
                <View key={pi} style={{ marginBottom: pi < sess.programs.length - 1 ? 10 : 0 }}>
                  <View style={S.progHeader} wrap={false}>
                    <Text style={S.progTitle}>{prog.programName || `Program ${pi + 1}`}</Text>
                    {prog.totalPrice > 0 && <Text style={{ fontSize: 7, color: C.orange }}>Rs. {prog.totalPrice}</Text>}
                  </View>
                  <View style={S.progBody}>
                    {Array.isArray(prog.therapyData ?? prog.therophyData)
                      ? (prog.therapyData ?? prog.therophyData).map((t, ti) => <TherapyBlock key={ti} therapy={t} />)
                      : <Text style={{ fontSize: 7, color: C.gray400, fontStyle: "italic" }}>No therapy data.</Text>}
                  </View>
                </View>
              ))
            : Array.isArray(sess.therapyData ?? sess.therophyData)
            ? (sess.therapyData ?? sess.therophyData).map((t, ti) => <TherapyBlock key={ti} therapy={t} />)
            : <Text style={{ fontSize: 7, color: C.gray400, fontStyle: "italic" }}>No data.</Text>}
        </View>
      </View>
    );
  }

  if (sType === "program") {
    const therapies = sess.therapyData ?? sess.therophyData ?? [];
    return (
      <View style={{ marginBottom: isLast ? 0 : 12 }}>
        <View style={S.progHeader} wrap={false}>
          <Text style={S.progTitle}>{sess.programName || "Program"}</Text>
          {(sess.totalPrice || sess.totalTherapyPrice) > 0 && (
            <Text style={{ fontSize: 7, color: C.orange }}>
              Rs. {sess.totalPrice || sess.totalTherapyPrice}
            </Text>
          )}
        </View>
        <View style={S.progBody}>
          <MetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
          {Array.isArray(therapies) && therapies.length > 0
            ? therapies.map((t, ti) => <TherapyBlock key={ti} therapy={t} />)
            : <Text style={{ fontSize: 7, color: C.gray400, fontStyle: "italic" }}>No therapies.</Text>}
        </View>
      </View>
    );
  }

  if (sType === "therapy") {
    return (
      <View style={{ marginBottom: isLast ? 0 : 12 }}>
        <View style={[S.progHeader, { backgroundColor: C.purple600 }]} wrap={false}>
          <Text style={S.progTitle}>{sess.therapyName || "Therapy Session"}</Text>
          {sess.totalPrice > 0 && <Text style={{ fontSize: 7, color: C.orange }}>Rs. {sess.totalPrice}</Text>}
        </View>
        <View style={[S.progBody, { borderRightColor: C.purple100, borderBottomColor: C.purple100, borderLeftColor: C.purple100 }]}>
          <MetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
          {Array.isArray(sess.exercises) && sess.exercises.length > 0
            ? <ExerciseTable exercises={sess.exercises} />
            : <Text style={{ fontSize: 7, color: C.gray400, fontStyle: "italic" }}>No exercises.</Text>}
        </View>
      </View>
    );
  }

  if (sType === "exercise") {
    return (
      <View style={{ marginBottom: isLast ? 0 : 12 }}>
        <View style={[S.progHeader, { backgroundColor: C.em600 }]} wrap={false}>
          <Text style={S.progTitle}>Exercise Session</Text>
          {sess.totalPrice > 0 && <Text style={{ fontSize: 7, color: C.orange }}>Rs. {sess.totalPrice}</Text>}
        </View>
        <View style={[S.progBody, { borderRightColor: C.em200, borderBottomColor: C.em200, borderLeftColor: C.em200 }]}>
          <MetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
          <ExerciseTable exercises={sess.exercises || []} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: isLast ? 0 : 12 }}>
      <MetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
      {Array.isArray(sess.therapyData) && sess.therapyData.map((t, ti) => <TherapyBlock key={ti} therapy={t} />)}
      {Array.isArray(sess.exercises) && sess.exercises.length > 0 && <ExerciseTable exercises={sess.exercises} />}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN PDF COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const PrescriptionPDF = (props) => {
  const {
    patient, complaints, investigation, background,
    assessment, diagnosisRows, treatmentPlan,
    sessionsList, overallStatus, topTherapistId, topTherapistName,
    homeExercises, homeAdvice, followUpEntry, parts, treatmentTemplates,
    bookingId, clinicId, branchId, doctorData, clicniData,
  } = resolve(props);

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });

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

  const difficultiesIn      = Array.isArray(func_.difficultiesIn) ? func_.difficultiesIn : Array.isArray(assessment.difficultiesIn) ? assessment.difficultiesIn : [];
  const otherDifficulty     = func_.otherDifficulty     ?? assessment.otherDifficulty     ?? "";
  const dailyLivingAffected = func_.dailyLivingAffected ?? assessment.dailyLivingAffected ?? "";

  const postureAssessment = Array.isArray(phys.postureAssessment) ? phys.postureAssessment : Array.isArray(assessment.postureAssessment) ? assessment.postureAssessment : [];
  const postureDeviations = phys.postureDeviations ?? assessment.postureDeviations ?? "";
  const romStatus         = Array.isArray(phys.rangeOfMotion) ? phys.rangeOfMotion : Array.isArray(assessment.romStatus) ? assessment.romStatus : [];
  const romRestricted     = phys.romRestricted ?? assessment.romRestricted ?? "";
  const romJoints         = phys.romJoints     ?? assessment.romJoints     ?? "";
  const muscleStrength    = Array.isArray(phys.muscleStrength) ? phys.muscleStrength : Array.isArray(assessment.muscleStrength) ? assessment.muscleStrength : [];
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

  // Address split into lines
  const addressLines = splitAddress(clicniData?.address);

  const statusColor =
    overallStatus === "Completed"   ? C.em600    :
    overallStatus === "Cancelled"   ? C.red600   :
    overallStatus === "In Progress" ? C.navyMid  : C.amber600;
  const statusBg =
    overallStatus === "Completed"   ? C.em50     :
    overallStatus === "Cancelled"   ? C.red50    :
    overallStatus === "In Progress" ? C.skyBrand : C.amber50;

  return (
    <Document>
      <Page size="A4" style={S.page} wrap>

        {/* ══ HEADER (fixed) ══ */}
        <View style={S.header} fixed>
          <View style={S.headerAccentBar}>
            <View style={S.headerAccentSeg1} />
            <View style={S.headerAccentSeg2} />
            <View style={S.headerAccentSeg3} />
          </View>
          <View style={S.headerInner}>
            <View style={S.hLeft}>
              <Text style={S.hClinicName}>{clicniData?.name || "PhysioCare Clinic"}</Text>
              {/* Address rendered line by line so it wraps in 3-4 lines */}
              {addressLines.length > 0
                ? addressLines.map((line, i) => (
                    <Text key={i} style={S.hAddress}>{line}</Text>
                  ))
                : hv(clicniData?.address) && (
                    <Text style={S.hAddress}>{clicniData.address}</Text>
                  )
              }
              <View style={{ flexDirection: "row", marginTop: 3 }}>
                {hv(clicniData?.phone) && <Text style={[S.hMeta, { marginRight: 14 }]}>T: {clicniData.phone}</Text>}
                {hv(clicniData?.email) && <Text style={S.hMeta}>E: {clicniData.email}</Text>}
              </View>
            </View>
            <View style={S.hRight}>
              <Text style={S.hDocType}>Physiotherapy Report</Text>
              <Text style={S.hDate}>{today}</Text>
              {bookingId && <Text style={S.hRef}>REF #{String(bookingId).slice(-8).toUpperCase()}</Text>}
              {hv(overallStatus) && (
                <View style={S.hStatusWrap}>
                  <View style={[S.hStatusPill, { backgroundColor: statusColor + "30" }]}>
                    <Text style={[S.hStatusTx, { color: statusColor }]}>{overallStatus.toUpperCase()}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ══ PATIENT BANNER ══ */}
        {hv(patientName) && (
          <View style={S.patientBanner} wrap={false}>
            <View style={S.pbLeft}>
              <View style={S.pbAvatar}>
                <Text style={S.pbAvatarTx}>{initials}</Text>
              </View>
              <View>
                <Text style={S.pbName}>{capitalizeEachWord(patientName)}</Text>
                <Text style={S.pbMeta}>
                  {[
                    patient?.age ? `${patient.age} yrs` : null,
                    patient?.sex || patient?.gender,
                    patient?.mobileNumber,
                  ].filter(Boolean).join("   ·   ")}
                </Text>
              </View>
            </View>
            {hv(patient?.patientId) && (
              <View style={S.pbRight}>
                <View style={S.pbIdWrap}>
                  <Text style={S.pbIdLbl}>Patient ID</Text>
                  <Text style={S.pbIdVal}>{patient.patientId}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ══ BODY ══ */}
        <View style={S.bodyWrap}>

          {/* ── 01 · PATIENT INFO ── */}
          <SectionBlock num="01" title="Patient & Booking Information">
            <View style={S.card} wrap={false}>
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
          </SectionBlock>

          {/* ── 02 · COMPLAINTS ── */}
          {(hv(complaints.complaintDetails) || parts.length > 0 || complaints.reportImages.length > 0) && (
            <SectionBlock num="02" title="Chief Complaint & Symptoms">
              {hv(complaints.complaintDetails) && (
                <View style={S.complaintBox} wrap={false}>
                  <Text style={S.lbl}>Chief Complaint</Text>
                  <Text style={[S.val, { fontSize: 9, lineHeight: 1.7, marginTop: 3, color: C.gray700 }]}>
                    {complaints.complaintDetails}
                  </Text>
                </View>
              )}
              <View style={S.card} wrap={false}>
                <View style={S.grid}>
                  {hv(complaints.duration)        && <View style={S.c3}><FV label="Duration"         value={complaints.duration} bold /></View>}
                  {hv(complaints.selectedTherapy) && <View style={S.c3}><FV label="Selected Therapy" value={complaints.selectedTherapy} /></View>}
                  {complaints.reportImages.length > 0 && <View style={S.c3}><FV label="Attached Reports" value={`${complaints.reportImages.length} image(s)`} /></View>}
                </View>
                {parts.length > 0 && (
                  <View style={{ marginTop: 4 }}>
                    <Text style={S.lbl}>Affected Body Parts</Text>
                    <View style={S.chipRow}>{parts.map((p, i) => <Chip key={i} text={p} variant="red" />)}</View>
                  </View>
                )}
                {hv(complaints.painAssessmentImage) && (
                  <View style={{ marginTop: 8 }}>
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
                  <View style={{ marginTop: 8 }}>
                    <Text style={S.lbl}>Report Images</Text>
                    <View style={S.imgContainer}>
                      {complaints.reportImages.slice(0, 4).map((img, i) => (
                        <Image key={i} src={img} style={S.img} />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </SectionBlock>
          )}

          {/* ── 03 · BACKGROUND ── */}
          {hasBackground && (
            <SectionBlock num="03" title="Patient Background & History">
              <View style={S.card} wrap={false}>
                <View style={S.grid}>
                  {hv(background.previousInjuries)   && <View style={S.c2}><FV label="Previous Injuries"   value={background.previousInjuries} /></View>}
                  {hv(background.currentMedications) && <View style={S.c2}><FV label="Current Medications" value={background.currentMedications} /></View>}
                  {hv(background.allergies)           && <View style={S.c2}><FV label="Allergies"           value={background.allergies} /></View>}
                  {hv(background.occupation)          && <View style={S.c2}><FV label="Occupation"          value={background.occupation} /></View>}
                  {hv(background.insuranceProvider)   && <View style={S.c2}><FV label="Insurance Provider"  value={background.insuranceProvider} /></View>}
                  {hv(background.patientPain) && (
                    <View style={S.c2}>
                      <FV label="Pain Category" value={PAIN_LABEL[background.patientPain] || background.patientPain} bold />
                    </View>
                  )}
                </View>
                {background.activityLevels.length > 0 && (
                  <View style={{ marginTop: 4 }}>
                    <Text style={S.lbl}>Activity Level</Text>
                    <View style={S.chipRow}>{background.activityLevels.map((lvl, i) => <Chip key={i} text={lvl} variant="navy" />)}</View>
                  </View>
                )}
              </View>
            </SectionBlock>
          )}

          {/* ── 04 · QUESTIONNAIRE ── */}
          {hasQuestionnaire && (
            <SectionBlockWrap num="04" title="Therapy Questionnaire" badge={`${Object.keys(complaints.therapyAnswersObj).length} categories`}>
              {Object.entries(complaints.therapyAnswersObj).map(([cat, qs], ci) => {
                const validQs = Array.isArray(qs) ? qs.filter((q) => hv(q.question)) : [];
                if (validQs.length === 0) return null;
                const answered = validQs.filter((q) => hv(q.answer) && q.answer.toLowerCase() !== "undefined").length;
                return (
                  <View key={ci} style={[S.qaWrap, { marginBottom: ci < Object.keys(complaints.therapyAnswersObj).length - 1 ? 6 : 0 }]} wrap={false}>
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
            </SectionBlockWrap>
          )}

          {/* ── 05 · INVESTIGATION ── */}
          {(investigation.tests.length > 0 || hv(investigation.reason)) && (
            <SectionBlock num="05" title="Investigation & Tests">
              <View style={[S.cardAccent, S.cNavy]} wrap={false}>
                {investigation.tests.length > 0 && (
                  <View style={{ marginBottom: hv(investigation.reason) ? 9 : 0 }}>
                    <Text style={S.lbl}>Recommended Tests</Text>
                    <View style={S.chipRow}>{investigation.tests.map((t, i) => <Chip key={i} text={t} variant="navy" />)}</View>
                  </View>
                )}
                {hv(investigation.reason) && (
                  <View style={S.fieldBox}>
                    <Text style={S.lbl}>Clinical Notes / Reason</Text>
                    <Text style={S.val}>{dv(investigation.reason)}</Text>
                  </View>
                )}
              </View>
            </SectionBlock>
          )}

          {/* ── 06 · ASSESSMENT ── */}
          {hasAssessment && (
            <SectionBlockWrap num="06" title="Clinical Assessment">
              {/* Subjective */}
              <View style={[S.cardAccent, S.cGold]} wrap={false}>
                <Text style={S.subSecTitle}>Subjective Assessment</Text>
                {hv(painScale) && <PainBar scaleText={painScale} />}
                <View style={S.grid}>
                  {hv(chiefComplaint)     && <View style={S.c2}><FV label="Chief Complaint"    value={chiefComplaint} bold /></View>}
                  {hv(painType)           && <View style={S.c2}><FV label="Pain Type"           value={painType} /></View>}
                  {hv(dur)               && <View style={S.c2}><FV label="Duration"            value={dur} /></View>}
                  {hv(onset)             && <View style={S.c2}><FV label="Onset"               value={onset} /></View>}
                  {hv(aggravatingFactors)&& <View style={S.c2}><FV label="Aggravating Factors" value={aggravatingFactors} /></View>}
                  {hv(relievingFactors)  && <View style={S.c2}><FV label="Relieving Factors"   value={relievingFactors} /></View>}
                </View>
                {hv(observations) && <FV label="Clinical Observations" value={observations} />}
              </View>

              {/* Functional */}
              {(difficultiesIn.length > 0 || hv(dailyLivingAffected)) && (
                <View style={[S.cardAccent, S.cSky]} wrap={false}>
                  <Text style={S.subSecTitle}>Functional Assessment</Text>
                  {difficultiesIn.length > 0 && (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={S.lbl}>Difficulties In</Text>
                      <View style={S.chipRow}>
                        {difficultiesIn.map((item, i) => <Chip key={i} text={item} variant="blue" />)}
                        {hv(otherDifficulty) && <Chip text={`Other: ${otherDifficulty}`} variant="slate" />}
                      </View>
                    </View>
                  )}
                  {hv(dailyLivingAffected) && <FV label="Impact on Daily Living" value={dailyLivingAffected} />}
                </View>
              )}

              {/* Physical */}
              {(postureAssessment.length > 0 || romStatus.length > 0 || muscleStrength.length > 0 || neurologicalSigns.length > 0) && (
                <View style={[S.cardAccent, S.cSlate]} wrap={false}>
                  <Text style={S.subSecTitle}>Physical Examination</Text>
                  {postureAssessment.length > 0 && <CheckRow label="Posture Assessment" options={["Normal", "Deviations"]}      selected={postureAssessment} note={postureDeviations} />}
                  {romStatus.length > 0         && <CheckRow label="Range of Motion"    options={["Normal", "Restricted"]}      selected={romStatus}         note={romRestricted ? `${romRestricted}${romJoints ? " · " + romJoints : ""}` : romJoints} />}
                  {muscleStrength.length > 0    && <CheckRow label="Muscle Strength"    options={["Normal", "Weakness in"]}     selected={muscleStrength}    note={muscleWeakness} />}
                  {neurologicalSigns.length > 0 && <CheckRow label="Neurological Signs" options={["Normal", "Balance", "Coordination", "Sensation issues"]} selected={neurologicalSigns} last />}
                </View>
              )}

              {/* Chronic */}
              {patientPain === "chronicPain" && (hv(painTriggers) || hv(chronicRelieving)) && (
                <View style={[S.cardAccent, S.cRed]} wrap={false}>
                  <Text style={S.subSecTitle}>Chronic Pain Assessment</Text>
                  <View style={S.grid}>
                    {hv(painTriggers)     && <View style={S.c2}><FV label="Pain Triggers"     value={painTriggers} /></View>}
                    {hv(chronicRelieving) && <View style={S.c2}><FV label="Relieving Factors" value={chronicRelieving} /></View>}
                  </View>
                </View>
              )}

              {/* Sports */}
              {patientPain === "sportsRehab" && (hv(typeOfSport) || hv(recurringInjuries) || hv(returnToSportGoals)) && (
                <View style={[S.cardAccent, S.cNavy]} wrap={false}>
                  <Text style={S.subSecTitle}>Sports Rehabilitation Assessment</Text>
                  <View style={S.grid}>
                    {hv(typeOfSport)        && <View style={S.c2}><FV label="Type of Sport"       value={typeOfSport} /></View>}
                    {hv(recurringInjuries)  && <View style={S.c2}><FV label="Recurring Injuries"  value={recurringInjuries} /></View>}
                    {hv(returnToSportGoals) && <View style={{ width: "100%" }}><FV label="Return-to-Sport Goals" value={returnToSportGoals} /></View>}
                  </View>
                </View>
              )}

              {/* Neuro */}
              {patientPain === "neuroRehab" && (hv(neuroDiagnosis) || hv(neuroOnset) || hv(mobilityStatus) || hv(cognitiveStatus)) && (
                <View style={[S.cardAccent, S.cPurple]} wrap={false}>
                  <Text style={S.subSecTitle}>Neuro Rehabilitation Assessment</Text>
                  <View style={S.grid}>
                    {hv(neuroDiagnosis)  && <View style={S.c2}><FV label="Diagnosis"       value={neuroDiagnosis} bold /></View>}
                    {hv(neuroOnset)      && <View style={S.c2}><FV label="Onset"            value={neuroOnset} /></View>}
                    {hv(mobilityStatus)  && <View style={S.c2}><FV label="Mobility Status"  value={mobilityStatus} /></View>}
                    {hv(cognitiveStatus) && <View style={S.c2}><FV label="Cognitive Status" value={cognitiveStatus} /></View>}
                  </View>
                </View>
              )}
            </SectionBlockWrap>
          )}

          {/* ── 07 · DIAGNOSIS ── */}
          {diagnosisRows.length > 0 && (
            <SectionBlockWrap num="07" title="Diagnosis" badge={`${diagnosisRows.length} entr${diagnosisRows.length > 1 ? "ies" : "y"}`}>
              <View style={S.tbl}>
                <View style={S.tHead}>
                  <Text style={[S.tHCell, { flex: 0.25 }]}>#</Text>
                  <Text style={[S.tHCell, { flex: 2.2  }]}>Diagnosis</Text>
                  <Text style={[S.tHCell, { flex: 1.5  }]}>Affected Area</Text>
                  <Text style={[S.tHCell, { flex: 0.9  }]}>Severity</Text>
                  <Text style={[S.tHCell, { flex: 1    }]}>Stage</Text>
                  <Text style={[S.tHCell, { flex: 2.2  }]}>Clinical Notes</Text>
                </View>
                {diagnosisRows.map((diag, i) => (
                  <View key={i} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]} wrap={false}>
                    <Text style={[S.tCellNum, { flex: 0.25 }]}>{i + 1}</Text>
                    <Text style={[S.tCellB,   { flex: 2.2  }]}>{diag.physioDiagnosis || "—"}</Text>
                    <Text style={[S.tCell,    { flex: 1.5  }]}>{diag.affectedArea    || "—"}</Text>
                    <View style={{ flex: 0.9, justifyContent: "center" }}><SevBadge sev={diag.severity} /></View>
                    <View style={{ flex: 1,   justifyContent: "center" }}><StageBadge stage={diag.stage} /></View>
                    <Text style={[S.tCell,    { flex: 2.2, lineHeight: 1.5 }]}>{diag.notes || "—"}</Text>
                  </View>
                ))}
              </View>
            </SectionBlockWrap>
          )}

          {/* ── 08 · TREATMENT PLAN ── */}
          {(hv(therapistName) || hv(treatmentPlan?.manualTherapy) || hv(treatmentPlan?.precautions)) && (
            <SectionBlock num="08" title="Treatment Plan">
              <View style={[S.cardAccent, S.cNavy]} wrap={false}>
                <View style={S.grid}>
                  {hv(doctorName)               && <View style={S.c2}><FV label="Assigned Doctor"   value={doctorName} bold /></View>}
                  {hv(doctorData?.doctorId)     && <View style={S.c2}><FV label="Doctor ID"          value={doctorData.doctorId} /></View>}
                  {hv(therapistName)            && <View style={S.c2}><FV label="Assigned Therapist" value={therapistName} bold /></View>}
                  {hv(topTherapistId)           && <View style={S.c2}><FV label="Therapist ID"       value={topTherapistId} /></View>}
                  {hv(treatmentPlan?.frequency) && <View style={S.c2}><FV label="Session Frequency"  value={treatmentPlan.frequency} /></View>}
                </View>
                {hv(treatmentPlan?.manualTherapy) && (
                  <View style={{ marginTop: 4 }}><FV label="Manual Therapy Techniques" value={treatmentPlan.manualTherapy} /></View>
                )}
                {hv(treatmentPlan?.precautions) && (
                  <View style={{ marginTop: 4 }}>
                    <FV label="Precautions" value={
                      Array.isArray(treatmentPlan.precautions)
                        ? treatmentPlan.precautions.join(", ")
                        : treatmentPlan.precautions
                    } />
                  </View>
                )}
                {Array.isArray(treatmentPlan?.modalities) && treatmentPlan.modalities.length > 0 && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={S.lbl}>Modalities Used</Text>
                    <View style={S.chipRow}>{treatmentPlan.modalities.map((m, i) => <Chip key={i} text={m} variant="blue" />)}</View>
                  </View>
                )}
              </View>
            </SectionBlock>
          )}

          {/* ── 09 · THERAPY SESSIONS ── */}
          {sessionsList.length > 0 && (
            <SectionBlockWrap num="09" title="Therapy Sessions" badge={`${sessionsList.length} session(s)`}>
              {hv(overallStatus) && (
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }} wrap={false}>
                  <Text style={[S.lbl, { marginBottom: 0, marginRight: 8 }]}>Overall Status</Text>
                  <View style={[S.hStatusPill, { backgroundColor: statusBg }]}>
                    <Text style={[S.hStatusTx, { color: statusColor }]}>{overallStatus}</Text>
                  </View>
                </View>
              )}
              {sessionsList.map((sess, i) => (
                <SessionBlock key={i} sess={sess} isLast={i === sessionsList.length - 1}
                  therapistId={topTherapistId} therapistName={topTherapistName} />
              ))}
            </SectionBlockWrap>
          )}

          {/* ── 10 · HOME EXERCISE PLAN ── */}
          {(homeExercises.length > 0 || hv(homeAdvice)) && (
            <SectionBlockWrap num="10" title="Home Exercise Plan"
              badge={homeExercises.length > 0 ? `${homeExercises.length} exercise(s)` : null}
            >
              {homeExercises.length > 0 && (
                <View style={S.tbl}>
                  <View style={S.tHead}>
                    <Text style={[S.tHCell, { flex: 0.25 }]}>#</Text>
                    <Text style={[S.tHCell, { flex: 2    }]}>Exercise</Text>
                    <Text style={[S.tHCell, { flex: 0.55 }]}>Sets</Text>
                    <Text style={[S.tHCell, { flex: 0.55 }]}>Reps</Text>
                    <Text style={[S.tHCell, { flex: 0.9  }]}>Duration</Text>
                    <Text style={[S.tHCell, { flex: 0.9  }]}>Frequency</Text>
                    <Text style={[S.tHCell, { flex: 2.5  }]}>Instructions</Text>
                  </View>
                  {homeExercises.map((ex, i) => (
                    <View key={i} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]} wrap={false}>
                      <Text style={[S.tCellNum, { flex: 0.25 }]}>{i + 1}</Text>
                      <Text style={[S.tCellB,   { flex: 2    }]}>{ex.name || "—"}</Text>
                      <Text style={[S.tCell,    { flex: 0.55 }]}>{dv(ex.sets)}</Text>
                      <Text style={[S.tCell,    { flex: 0.55 }]}>{dv(ex.reps)}</Text>
                      <Text style={[S.tCell,    { flex: 0.9  }]}>{dv(ex.duration)}</Text>
                      <Text style={[S.tCell,    { flex: 0.9  }]}>{dv(ex.frequency)}</Text>
                      <Text style={[S.tCell,    { flex: 2.5, lineHeight: 1.5 }]}>{dv(ex.instructions)}</Text>
                    </View>
                  ))}
                </View>
              )}
              {hv(homeAdvice) && (
                <View style={[S.cardAccent, S.cNavy, { marginTop: homeExercises.length > 0 ? 6 : 0 }]} wrap={false}>
                  <Text style={S.lbl}>Home Advice & Instructions</Text>
                  <Text style={[S.val, { lineHeight: 1.7, marginTop: 3 }]}>{homeAdvice}</Text>
                </View>
              )}
            </SectionBlockWrap>
          )}

          {/* ── 11 · FOLLOW UP ── */}
          {(hv(followUpEntry.nextVisitDate) || hv(followUpEntry.reviewNotes)) && (
            <SectionBlock num="11" title="Follow-Up Plan">
              <View style={[S.cardAccent, S.cPurple]} wrap={false}>
                <View style={S.grid}>
                  {hv(followUpEntry.nextVisitDate) && (
                    <View style={S.c2}>
                      <Text style={S.lbl}>Next Visit Date</Text>
                      <Text style={[S.valXL, { color: C.navy }]}>{followUpEntry.nextVisitDate}</Text>
                    </View>
                  )}
                  {hv(followUpEntry.treatmentStatus) && (
                    <View style={S.c2}>
                      <Text style={S.lbl}>Treatment Status</Text>
                      <View style={{ marginTop: 2 }}>
                        <Chip
                          text={followUpEntry.treatmentStatus}
                          variant={
                            ["Active", "Completed"].includes(followUpEntry.treatmentStatus) ? "em"
                            : followUpEntry.treatmentStatus === "Discharged" ? "red"
                            : "amber"
                          }
                        />
                      </View>
                    </View>
                  )}
                </View>
                {hv(followUpEntry.reviewNotes)   && <View style={{ marginTop: 6 }}><FV label="Review Notes"            value={followUpEntry.reviewNotes} /></View>}
                {hv(followUpEntry.modifications) && <View style={{ marginTop: 6 }}><FV label="Treatment Modifications" value={followUpEntry.modifications} /></View>}
              </View>
            </SectionBlock>
          )}

          {/* ── 12 · TREATMENT TEMPLATES ── */}
          {treatmentTemplates.length > 0 && (
            <SectionBlockWrap num="12" title="Treatment Templates" badge={`${treatmentTemplates.length}`}>
              <View style={S.tbl}>
                <View style={S.tHead}>
                  <Text style={[S.tHCell, { flex: 0.25 }]}>#</Text>
                  <Text style={[S.tHCell, { flex: 1.8  }]}>Condition</Text>
                  <Text style={[S.tHCell, { flex: 1.8  }]}>Manual Therapy</Text>
                  <Text style={[S.tHCell, { flex: 1    }]}>Duration</Text>
                  <Text style={[S.tHCell, { flex: 1    }]}>Frequency</Text>
                </View>
                {treatmentTemplates.map((t, i) => (
                  <View key={i} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]} wrap={false}>
                    <Text style={[S.tCellNum, { flex: 0.25 }]}>{i + 1}</Text>
                    <Text style={[S.tCellB,   { flex: 1.8  }]}>{t.condition     || "—"}</Text>
                    <Text style={[S.tCell,    { flex: 1.8  }]}>{t.manualTherapy || "—"}</Text>
                    <Text style={[S.tCell,    { flex: 1    }]}>{t.duration      || "—"}</Text>
                    <Text style={[S.tCell,    { flex: 1    }]}>{t.frequency     || "—"}</Text>
                  </View>
                ))}
              </View>
            </SectionBlockWrap>
          )}

          {/* ── 13 · SIGNATURES ── */}
          {(hv(doctorName) || hv(therapistName)) && (
            <View style={S.sigSection} wrap={false}>
              {hv(doctorName) && (
                <View style={S.sigBox}>
                  <View style={S.sigLine} />
                  <Text style={S.sigRole}>Authorized by</Text>
                  <Text style={S.sigName}>{doctorName}</Text>
                  {hv(doctorData?.qualification) && <Text style={S.sigSub}>{doctorData.qualification}</Text>}
                  {hv(doctorData?.regNumber)     && <Text style={S.sigSub}>Reg. {doctorData.regNumber}</Text>}
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

        </View>{/* end bodyWrap */}

        {/* ══ FOOTER (fixed) ══ */}
        <View style={{ flexDirection: "column" }} fixed>
          <View style={S.footerAccentLine} />
          <View style={S.footer}>
            <Text style={S.ftLeft}>{clicniData?.name || "PhysioCare Clinic"}</Text>
            <Text style={S.ftMid}>CONFIDENTIAL  ·  FOR AUTHORIZED MEDICAL PERSONNEL ONLY</Text>
            <Text style={S.ftRight} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </View>

      </Page>
    </Document>
  );
};

export default PrescriptionPDF;