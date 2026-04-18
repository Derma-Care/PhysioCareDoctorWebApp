// src/utils/PdfGenerator.jsx
import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { capitalizeEachWord } from "./CaptalZeWord";

// ─────────────────────────────────────────────────────────────────────────────
//  Supports all call signatures:
//  A) <PrescriptionPDF bookingData={fullJson} clicniData={c} doctorData={d} />
//  B) <PrescriptionPDF formData={fullJson}    clicniData={c} doctorData={d} />
//  C) <PrescriptionPDF formData={{...}} patientData={p} clicniData={c} doctorData={d} />
// ─────────────────────────────────────────────────────────────────────────────

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  primary: "#1a56db",
  primaryLight: "#e8f0fe",
  accent: "#0e9f6e",
  accentLight: "#e8f5f0",
  warning: "#e3a008",
  warningLight: "#fef3c7",
  danger: "#e02424",
  dangerLight: "#fde8e8",
  purple: "#7c3aed",
  purpleLight: "#f5f3ff",
  dark: "#111827",
  mid: "#374151",
  muted: "#6b7280",
  border: "#e5e7eb",
  bgLight: "#f9fafb",
  white: "#ffffff",
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: "Helvetica", backgroundColor: C.white },
  header: { backgroundColor: C.primary, padding: "20 32 16 32", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  hLeft: { flexDirection: "column" },
  hClinic: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.white, marginBottom: 3 },
  hMeta: { fontSize: 9, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  hRight: { alignItems: "flex-end" },
  hBadge: { backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 4, padding: "4 10", marginBottom: 4 },
  hBadgeTx: { color: C.white, fontSize: 9, fontFamily: "Helvetica-Bold" },
  hMeta2: { fontSize: 8, color: "rgba(255,255,255,0.6)" },

  body: { padding: "16 32 24 32" },

  sec: { marginBottom: 14 },
  secHead: { flexDirection: "row", alignItems: "center", marginBottom: 8, borderBottomWidth: 1.5, borderBottomColor: C.primary, paddingBottom: 4 },
  secDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginRight: 6 },
  secTx: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.primary, textTransform: "uppercase", letterSpacing: 0.5 },

  subHead: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.primary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6, marginTop: 4 },

  row2: { flexDirection: "row" },
  col2: { flex: 1, marginBottom: 6, paddingRight: 8 },
  col3: { flex: 1, marginBottom: 6, paddingRight: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell2: { width: "50%", marginBottom: 6, paddingRight: 8 },
  cell3: { width: "33.33%", marginBottom: 6, paddingRight: 8 },

  lbl: { fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 },
  val: { fontSize: 9, color: C.dark },
  valB: { fontSize: 9, color: C.dark, fontFamily: "Helvetica-Bold" },

  card: { backgroundColor: C.bgLight, borderRadius: 6, padding: "10 12", marginBottom: 8, borderLeftWidth: 3, borderLeftColor: C.primary },
  cAcc: { borderLeftColor: C.accent },
  cWarn: { borderLeftColor: C.warning },
  cDang: { borderLeftColor: C.danger },
  cPurp: { borderLeftColor: C.purple },

  divider: { borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 8, marginTop: 4 },

  bRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  badge: { backgroundColor: C.primaryLight, borderRadius: 10, padding: "2 8", marginRight: 4, marginBottom: 4 },
  bTx: { fontSize: 8, color: C.primary, fontFamily: "Helvetica-Bold" },
  bGreen: { backgroundColor: C.accentLight }, bGreenTx: { color: C.accent },
  bYell: { backgroundColor: C.warningLight }, bYellTx: { color: C.warning },
  bRed: { backgroundColor: C.dangerLight }, bRedTx: { color: C.danger },
  bPurp: { backgroundColor: C.purpleLight }, bPurpTx: { color: C.purple },
  bGray: { backgroundColor: "#f3f4f6" }, bGrayTx: { color: "#6b7280" },

  // Tables
  tbl: { borderWidth: 1, borderColor: C.border, borderRadius: 6, overflow: "hidden", marginBottom: 8 },
  tHead: { flexDirection: "row", backgroundColor: C.primary, padding: "6 8" },
  tHCell: { fontSize: 8, color: C.white, fontFamily: "Helvetica-Bold", paddingRight: 4 },
  tRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.border, padding: "5 8" },
  tRowAlt: { backgroundColor: C.bgLight },
  tCell: { fontSize: 8, color: C.mid, paddingRight: 4 },

  // Therapy nesting
  pkgHeader: { backgroundColor: C.purple, padding: "8 12", borderRadius: "6", flexDirection: "row", justifyContent: "space-between" },
  pkgTx: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.white },
  pkgPriceTx: { fontSize: 9, color: "rgba(255,255,255,0.8)" },
  pkgBody: { borderWidth: 1, borderTopWidth: 0, borderColor: "#c4b5fd", borderRadius: "0", padding: "10 12", marginBottom: 10 },

  progHeader: { backgroundColor: C.primary, padding: "7 10", borderRadius: "5", flexDirection: "row", justifyContent: "space-between" },
  progTx: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.white },
  progBody: { borderWidth: 1, borderTopWidth: 0, borderColor: "#c8ddf0", borderRadius: "0", padding: "8 10", marginBottom: 8 },

  therapyHeader: { backgroundColor: "#ede9fe", padding: "6 10", borderRadius: "4", flexDirection: "row", justifyContent: "space-between", borderWidth: 1, borderBottomWidth: 0, borderColor: "#c4b5fd" },
  therapyTx: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.purple },
  therapyBody: { borderWidth: 1, borderTopWidth: 0, borderColor: "#c4b5fd", borderRadius: "0", overflow: "hidden", marginBottom: 6 },

  // Exercise cards
  exCard: { borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: "8 10", marginBottom: 6, flexDirection: "row" },
  exThumb: { width: 55, height: 42, borderRadius: 4, marginRight: 10 },
  exDet: { flex: 1 },
  exName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 3 },
  exMeta: { flexDirection: "row", flexWrap: "wrap", marginBottom: 3 },
  exMetaI: { backgroundColor: C.accentLight, borderRadius: 4, padding: "1 5", marginRight: 5, marginBottom: 2 },
  exMetaTx: { fontSize: 7, color: C.accent },
  exInstr: { fontSize: 7, color: C.muted, lineHeight: 1.4 },

  // Pain bar
  pbBg: { height: 7, backgroundColor: C.border, borderRadius: 4, marginTop: 4, width: "100%" },
  pbFill: { height: 7, borderRadius: 4 },

  // Images
  img: { width: 80, height: 80, borderRadius: 6, marginRight: 8, marginTop: 4 },
  imgRow: { flexDirection: "row", flexWrap: "wrap" },

  // Check row
  checkRow: { flexDirection: "row", alignItems: "center", marginBottom: 4, flexWrap: "wrap" },
  checkLabel: { fontSize: 8, color: C.muted, fontFamily: "Helvetica-Bold", width: 120 },
  checkChip: { borderRadius: 10, padding: "1 7", marginRight: 4 },
  checkOn: { backgroundColor: C.primaryLight },
  checkOff: { backgroundColor: "#f3f4f6" },
  checkOnTx: { fontSize: 7, color: C.primary, fontFamily: "Helvetica-Bold" },
  checkOffTx: { fontSize: 7, color: "#9ca3af" },

  // Footer
  footer: { backgroundColor: C.bgLight, borderTopWidth: 1, borderTopColor: C.border, padding: "10 32", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ftTx: { fontSize: 7, color: C.muted },
  note: { fontSize: 8, color: C.mid, lineHeight: 1.5 },
});

// ── Data resolver ────────────────────────────────────────────────────────────
function resolve(props) {
  const { bookingData, formData, patientData } = props;

  const isFull = (o) =>
    o != null && typeof o === "object" &&
    (o.patientInfo != null || o.assessment != null ||
      o.followUp != null || o.treatmentPlan != null ||
      o.therapySessions != null || o.exercisePlan != null);

  const root = bookingData ?? (isFull(formData) ? formData : null);

  const pick = (key, explicitProp, fb = {}) =>
    root?.[key] != null ? root[key] :
      explicitProp != null ? explicitProp :
        formData?.[key] != null ? formData[key] :
          fb;

  const patient = pick("patientInfo", patientData, {});
  const complaintsRaw = pick("complaints", props.complaintsData, {});
  const assessment = pick("assessment", props.assessmentData, {});
  const diagnosisRaw = pick("diagnosis", props.diagnosisData, {});
  const treatmentPlan = pick("treatmentPlan", props.treatmentData, {});
  const therapySessions = pick("therapySessions", props.sessionsData, []);
  const exercisePlan = pick("exercisePlan", props.exerciseData, {});
  const followUp = pick("followUp", props.followUpData, {});

  // ── Investigation: support both shapes ──────────────────────────────────
  // Shape A (from Investigation component): { selectedTests: [...], notes: "..." }
  // Shape B (from API/payload):             { tests: [...], reason: "..." }
  const investigationRaw = pick("investigation", props.investigationData, {});
  const investigation = {
    tests: (() => {
      const t = investigationRaw.selectedTests ?? investigationRaw.tests ?? [];
      return Array.isArray(t) ? t : t ? [t] : [];
    })(),
    reason: investigationRaw.notes ?? investigationRaw.reason ?? "",
  };

  // ── Patient background fields ────────────────────────────────────────────
  const background = {
    previousInjuries: root?.previousInjuries ?? formData?.previousInjuries ?? patientData?.previousInjuries ?? "",
    currentMedications: root?.currentMedications ?? formData?.currentMedications ?? patientData?.currentMedications ?? "",
    allergies: root?.allergies ?? formData?.allergies ?? patientData?.allergies ?? "",
    occupation: root?.occupation ?? formData?.occupation ?? patientData?.occupation ?? "",
    insuranceProvider: root?.insuranceProvider ?? formData?.insuranceProvider ?? patientData?.insuranceProvider ?? "",
    activityLevels: (() => {
      const v = root?.activityLevels ?? formData?.activityLevels ?? patientData?.activityLevels ?? [];
      return Array.isArray(v) ? v : [];
    })(),
    patientPain: root?.patientPain ?? formData?.patientPain ?? formData?.assessment?.patientPain ?? patientData?.patientPain ?? "",
  };

  // ── Complaints normalization ─────────────────────────────────────────────
  // therapyAnswers may come as flat array OR nested object { cat: [q,...] }
  let therapyAnswersObj = {};
  const rawAnswers = complaintsRaw?.therapyAnswers ?? complaintsRaw?.theraphyAnswers ?? {};
  if (Array.isArray(rawAnswers)) {
    // flat array — group by questionKey or just put under "General"
    therapyAnswersObj = { General: rawAnswers };
  } else if (typeof rawAnswers === "object") {
    therapyAnswersObj = rawAnswers;
  }

  const complaints = {
    complaintDetails: complaintsRaw?.complaintDetails ?? "",
    duration: complaintsRaw?.duration ?? "",
    selectedTherapy: complaintsRaw?.selectedTherapy ?? "",
    painAssessmentImage: complaintsRaw?.painAssessmentImage ?? "",
    reportImages: Array.isArray(complaintsRaw?.reportImages) ? complaintsRaw.reportImages : [],
    therapyAnswersObj,
  };

  // ── Diagnosis rows ───────────────────────────────────────────────────────
  const diagnosisRows = Array.isArray(diagnosisRaw?.diagnosisRows)
    ? diagnosisRaw.diagnosisRows
    : diagnosisRaw?.physioDiagnosis
      ? [diagnosisRaw]
      : [];

  // ── Therapy sessions resolution ──────────────────────────────────────────
  let sessionsList = [];
  if (Array.isArray(therapySessions)) {
    sessionsList = therapySessions;
  } else if (Array.isArray(therapySessions?.sessions)) {
    sessionsList = therapySessions.sessions;
  }
  if (sessionsList.length === 1 && Array.isArray(sessionsList[0])) {
    sessionsList = sessionsList[0];
  }
  const overallStatus = (!Array.isArray(therapySessions) && therapySessions?.overallStatus) ? therapySessions.overallStatus : "";

  // ── Exercise plan ─────────────────────────────────────────────────────────
  // homeExercises is saved under exercisePlan.homeExercises (not .exercises)
  const homeExercises = Array.isArray(exercisePlan?.homeExercises)
    ? exercisePlan.homeExercises
    : Array.isArray(exercisePlan?.exercises)
      ? exercisePlan.exercises
      : [];
  const homeAdvice = exercisePlan?.homeAdvice ?? "";

  // ── Follow-up normalization ───────────────────────────────────────────────
  const followUpEntry = Array.isArray(followUp)
    ? (followUp[0] ?? {})
    : (typeof followUp === "object" ? followUp : {});

  // ── Parts / affected areas ────────────────────────────────────────────────
  const parts = formData?.parts ?? root?.symptoms?.parts ?? patientData?.parts ?? [];

  const bookingId = root?.bookingId ?? formData?.bookingId ?? null;
  const clinicId = root?.clinicId ?? formData?.clinicId ?? null;
  const branchId = root?.branchId ?? formData?.branchId ?? null;

  return {
    patient, complaints, investigation, background,
    assessment, diagnosisRows,
    treatmentPlan, sessionsList, overallStatus,
    homeExercises, homeAdvice,
    followUpEntry, parts,
    bookingId, clinicId, branchId,
    doctorData: props.doctorData ?? {},
    clicniData: props.clicniData ?? {},
  };
}

// ── Utility helpers ───────────────────────────────────────────────────────────
const hasAny = (obj) =>
  obj != null && typeof obj === "object" &&
  Object.values(obj).some((v) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0));

const dash = (v) => (v && String(v).trim() !== "" ? String(v) : "—");

const PAIN_LABEL_MAP = {
  chronicPain: "Chronic Pain",
  sportsRehab: "Sports Rehab",
  neuroRehab: "Neuro Rehab",
  acutePain: "Acute Pain",
  neuropathicPain: "Neuropathic Pain",
  referredPain: "Referred Pain",
  inflammatoryPain: "Inflammatory Pain",
};

// ── Primitive components ─────────────────────────────────────────────────────
const SH = ({ title, color }) => (
  <View style={S.secHead}>
    <View style={[S.secDot, color ? { backgroundColor: color } : {}]} />
    <Text style={[S.secTx, color ? { color } : {}]}>{title}</Text>
  </View>
);

const SubH = ({ title, color }) => (
  <Text style={[S.subHead, color ? { color } : {}]}>{title}</Text>
);

const LV = ({ label, value }) => (
  <View>
    <Text style={S.lbl}>{label}</Text>
    <Text style={S.val}>{dash(value)}</Text>
  </View>
);

const LVB = ({ label, value }) => (
  <View>
    <Text style={S.lbl}>{label}</Text>
    <Text style={S.valB}>{dash(value)}</Text>
  </View>
);

const Bdg = ({ text, variant }) => {
  const bg = variant === "green" ? S.bGreen
    : variant === "yellow" ? S.bYell
      : variant === "red" ? S.bRed
        : variant === "purple" ? S.bPurp
          : variant === "gray" ? S.bGray
            : S.badge;
  const tx = variant === "green" ? S.bGreenTx
    : variant === "yellow" ? S.bYellTx
      : variant === "red" ? S.bRedTx
        : variant === "purple" ? S.bPurpTx
          : variant === "gray" ? S.bGrayTx
            : S.bTx;
  return (
    <View style={[S.badge, bg]}>
      <Text style={[S.bTx, tx]}>{text}</Text>
    </View>
  );
};

const CheckRow = ({ label, options, selected, note }) => (
  <View style={S.checkRow}>
    <Text style={S.checkLabel}>{label}:</Text>
    {options.map(opt => {
      const on = Array.isArray(selected) && selected.includes(opt);
      return (
        <View key={opt} style={[S.checkChip, on ? S.checkOn : S.checkOff]}>
          <Text style={on ? S.checkOnTx : S.checkOffTx}>{on ? "✓ " : "○ "}{opt}</Text>
        </View>
      );
    })}
    {note ? <Text style={{ fontSize: 7, color: C.muted, marginLeft: 4, fontStyle: "italic" }}>— {note}</Text> : null}
  </View>
);

const PainBar = ({ scaleText }) => {
  const m = String(scaleText ?? "").match(/(\d+)\s*\/\s*(\d+)/);
  const pct = m ? (parseInt(m[1]) / parseInt(m[2])) * 100 : 0;
  const color = pct >= 70 ? C.danger : pct >= 40 ? C.warning : C.accent;
  return (
    <View>
      <View style={S.pbBg}>
        <View style={[S.pbFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={{ fontSize: 7, color: C.muted, marginTop: 2 }}>{scaleText} pain scale</Text>
    </View>
  );
};

const sevV = (s) => {
  const sl = (s || "").toLowerCase();
  return sl === "mild" ? "green" : sl === "moderate" ? "yellow" : sl === "severe" ? "red" : "gray";
};

const stageV = (s) => {
  const sl = (s || "").toLowerCase();
  return sl === "acute" ? "red" : sl.includes("sub") ? "yellow" : sl === "chronic" ? "purple" : "gray";
};

// ── Therapy session rendering ─────────────────────────────────────────────────
const ExerciseTable = ({ exercises }) => {
  if (!exercises || exercises.length === 0) return (
    <Text style={{ fontSize: 7, color: C.muted, fontStyle: "italic", padding: 6 }}>No exercises</Text>
  );
  return (
    <View style={S.tbl}>
      <View style={S.tHead}>
        <Text style={[S.tHCell, { flex: 2 }]}>Exercise</Text>
        <Text style={[S.tHCell, { flex: 0.8 }]}>Session</Text>
        <Text style={[S.tHCell, { flex: 0.8 }]}>Sets</Text>
        <Text style={[S.tHCell, { flex: 0.8 }]}>Reps</Text>
        <Text style={[S.tHCell, { flex: 1.2 }]}>Frequency</Text>
        <Text style={[S.tHCell, { flex: 2 }]}>Notes</Text>
      </View>
      {exercises.map((ex, i) => (
        <View key={i} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]}>
          <Text style={[S.tCell, { flex: 2, fontFamily: "Helvetica-Bold" }]}>{ex.name || ex.exerciseName || "—"}</Text>
          <Text style={[S.tCell, { flex: 0.8 }]}>{dash(ex.session)}</Text>
          <Text style={[S.tCell, { flex: 0.8 }]}>{dash(ex.sets)}</Text>
          <Text style={[S.tCell, { flex: 0.8 }]}>{dash(ex.repetitions ?? ex.reps)}</Text>
          <Text style={[S.tCell, { flex: 1.2 }]}>{dash(ex.frequency)}</Text>
          <Text style={[S.tCell, { flex: 2 }]}>{dash(ex.notes)}</Text>
        </View>
      ))}
    </View>
  );
};

const TherapyBlock = ({ therapy, accent = false }) => (
  <View style={{ marginBottom: 6 }}>
    <View style={[S.therapyHeader, accent ? { backgroundColor: "#ede9fe", borderColor: "#c4b5fd" } : { backgroundColor: "#eef5ff", borderColor: "#c8ddf0" }]}>
      <Text style={[S.therapyTx, accent ? { color: C.purple } : { color: C.primary }]}>
        {therapy.therapyName || "Therapy"}
      </Text>
      {therapy.totalPrice > 0 ? <Text style={{ fontSize: 7, color: C.muted }}>₹ {therapy.totalPrice}</Text> : null}
    </View>
    <View style={[S.therapyBody, accent ? { borderColor: "#c4b5fd" } : { borderColor: "#c8ddf0" }]}>
      <ExerciseTable exercises={therapy.exercises || []} />
    </View>
  </View>
);

const SessionBlock = ({ sess, isLast }) => {
  const sType = (sess.serviceType || "").toLowerCase();

  const MetaBar = () => (
    <View style={[S.bRow, { marginBottom: 6 }]}>
      {sess.therapistName ? <Bdg text={`Therapist: ${sess.therapistName}`} variant="default" /> : null}
      {sess.therapistId ? <Bdg text={`ID: ${sess.therapistId}`} variant="gray" /> : null}
      {Array.isArray(sess.modalitiesUsed) && sess.modalitiesUsed.map((m, i) => <Bdg key={i} text={m} />)}
    </View>
  );

  const DetailsBar = () => {
    if (!sess.manualTherapy && !sess.precautions && !sess.patientResponse) return null;
    return (
      <View style={{ backgroundColor: "#fffbeb", borderRadius: 4, padding: "6 8", marginBottom: 8, borderWidth: 1, borderColor: "#fde68a" }}>
        <View style={S.grid}>
          {sess.manualTherapy ? <View style={S.cell3}><LV label="Manual Therapy" value={sess.manualTherapy} /></View> : null}
          {sess.precautions ? <View style={S.cell3}><LV label="Precautions" value={Array.isArray(sess.precautions) ? sess.precautions.join(", ") : sess.precautions} /></View> : null}
          {sess.patientResponse ? <View style={S.cell3}><LV label="Patient Response" value={sess.patientResponse} /></View> : null}
        </View>
      </View>
    );
  };

  if (sType === "package") {
    return (
      <View style={{ marginBottom: isLast ? 0 : 14 }}>
        <View style={[S.pkgHeader, { backgroundColor: C.purple }]}>
          <Text style={S.pkgTx}>📦 {sess.packageName || "Package"}</Text>
          {sess.totalPrice > 0 ? <Text style={S.pkgPriceTx}>₹ {sess.totalPrice}</Text> : null}
        </View>
        <View style={[S.pkgBody, { borderColor: "#c4b5fd" }]}>
          <MetaBar /><DetailsBar />
          {Array.isArray(sess.programs) && sess.programs.length > 0
            ? sess.programs.map((prog, pi) => (
              <View key={pi} style={{ marginBottom: pi < sess.programs.length - 1 ? 10 : 0 }}>
                <View style={S.progHeader}>
                  <Text style={S.progTx}>🎯 {prog.programName || `Program ${pi + 1}`}</Text>
                  {prog.totalPrice > 0 ? <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.8)" }}>₹ {prog.totalPrice}</Text> : null}
                </View>
                <View style={S.progBody}>
                  {Array.isArray(prog.therapyData ?? prog.therophyData)
                    ? (prog.therapyData ?? prog.therophyData).map((t, ti) => <TherapyBlock key={ti} therapy={t} />)
                    : <Text style={{ fontSize: 7, color: C.muted, fontStyle: "italic" }}>No therapy data.</Text>}
                </View>
              </View>
            ))
            : Array.isArray(sess.therapyData ?? sess.therophyData)
              ? (sess.therapyData ?? sess.therophyData).map((t, ti) => <TherapyBlock key={ti} therapy={t} />)
              : <Text style={{ fontSize: 7, color: C.muted, fontStyle: "italic" }}>No data.</Text>
          }
        </View>
      </View>
    );
  }

  if (sType === "program") {
    const therapies = sess.therapyData ?? sess.therophyData ?? [];
    return (
      <View style={{ marginBottom: isLast ? 0 : 14 }}>
        <View style={S.progHeader}>
          <Text style={S.progTx}>🎯 {sess.programName || "Program"}</Text>
          {sess.totalPrice > 0 ? <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.8)" }}>₹ {sess.totalPrice}</Text> : null}
        </View>
        <View style={S.progBody}>
          <MetaBar /><DetailsBar />
          {Array.isArray(therapies) && therapies.length > 0
            ? therapies.map((t, ti) => <TherapyBlock key={ti} therapy={t} />)
            : <Text style={{ fontSize: 7, color: C.muted, fontStyle: "italic" }}>No therapies.</Text>}
        </View>
      </View>
    );
  }

  if (sType === "therapy") {
    const therapies = sess.therapyData ?? [];
    return (
      <View style={{ marginBottom: isLast ? 0 : 14 }}>
        <View style={[S.progHeader, { backgroundColor: C.purple }]}>
          <Text style={S.progTx}>💊 Therapy Session</Text>
          {sess.totalPrice > 0 ? <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.8)" }}>₹ {sess.totalPrice}</Text> : null}
        </View>
        <View style={[S.progBody, { borderColor: "#c4b5fd" }]}>
          <MetaBar /><DetailsBar />
          {Array.isArray(therapies) && therapies.length > 0
            ? therapies.map((t, ti) => <TherapyBlock key={ti} therapy={t} accent />)
            : Array.isArray(sess.exercises) && sess.exercises.length > 0
              ? <ExerciseTable exercises={sess.exercises} />
              : <Text style={{ fontSize: 7, color: C.muted, fontStyle: "italic" }}>No therapy data.</Text>}
        </View>
      </View>
    );
  }

  if (sType === "exercise") {
    return (
      <View style={{ marginBottom: isLast ? 0 : 14 }}>
        <View style={[S.progHeader, { backgroundColor: "#065f46" }]}>
          <Text style={S.progTx}>🏋️ Exercise Session</Text>
          {sess.totalPrice > 0 ? <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.8)" }}>₹ {sess.totalPrice}</Text> : null}
        </View>
        <View style={[S.progBody, { borderColor: "#6ee7b7" }]}>
          <MetaBar /><DetailsBar />
          <ExerciseTable exercises={sess.exercises || []} />
        </View>
      </View>
    );
  }

  // Fallback
  return (
    <View style={{ marginBottom: isLast ? 0 : 14 }}>
      <MetaBar /><DetailsBar />
      {Array.isArray(sess.therapyData) && sess.therapyData.length > 0
        ? sess.therapyData.map((t, ti) => <TherapyBlock key={ti} therapy={t} />)
        : null}
      {Array.isArray(sess.exercises) && sess.exercises.length > 0
        ? <ExerciseTable exercises={sess.exercises} />
        : null}
    </View>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const PrescriptionPDF = (props) => {
  const {
    patient, complaints, investigation, background,
    assessment, diagnosisRows,
    treatmentPlan, sessionsList, overallStatus,
    homeExercises, homeAdvice,
    followUpEntry, parts,
    bookingId, clinicId, branchId,
    doctorData, clicniData,
  } = resolve(props);

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  // Assessment sub-objects
  const subj = assessment.subjectiveAssessment ?? assessment ?? {};
  const func_ = assessment.functionalAssessment ?? {};
  const phys = assessment.physicalExamination ?? {};
  const chron = assessment.chronicPainPatients ?? {};
  const sport = assessment.sportsRehabPatients ?? {};
  const neuro = assessment.neuroRehabPatients ?? {};

  // Flat assessment fields (when assessment is not nested)
  const painScale = subj.painScale ?? assessment.painScale ?? "";
  const chiefComplaint = subj.chiefComplaint ?? assessment.chiefComplaint ?? "";
  const painType = subj.painType ?? assessment.painType ?? "";
  const duration = subj.duration ?? assessment.duration ?? "";
  const onset = subj.onset ?? assessment.onset ?? "";
  const aggravatingFactors = subj.aggravatingFactors ?? assessment.aggravatingFactors ?? "";
  const relievingFactors = subj.relievingFactors ?? assessment.relievingFactors ?? "";
  const observations = subj.observations ?? assessment.observations ?? "";

  const difficultiesIn = Array.isArray(func_.difficultiesIn) ? func_.difficultiesIn : Array.isArray(assessment.difficultiesIn) ? assessment.difficultiesIn : [];
  const otherDifficulty = func_.otherDifficulty ?? assessment.otherDifficulty ?? "";
  const dailyLivingAffected = func_.dailyLivingAffected ?? assessment.dailyLivingAffected ?? "";

  const postureAssessment = Array.isArray(phys.postureAssessment) ? phys.postureAssessment : Array.isArray(assessment.postureAssessment) ? assessment.postureAssessment : [];
  const postureDeviations = phys.postureDeviations ?? assessment.postureDeviations ?? "";
  const romStatus = Array.isArray(phys.rangeOfMotion) ? phys.rangeOfMotion : Array.isArray(assessment.romStatus) ? assessment.romStatus : [];
  const romRestricted = phys.romRestricted ?? assessment.romRestricted ?? "";
  const romJoints = phys.romJoints ?? assessment.romJoints ?? "";
  const muscleStrength = Array.isArray(phys.muscleStrength) ? phys.muscleStrength : Array.isArray(assessment.muscleStrength) ? assessment.muscleStrength : [];
  const muscleWeakness = phys.muscleWeakness ?? assessment.muscleWeakness ?? "";
  const neurologicalSigns = Array.isArray(phys.neurologicalSigns) ? phys.neurologicalSigns : Array.isArray(assessment.neurologicalSigns) ? assessment.neurologicalSigns : [];

  const patientPain = background.patientPain;
  const painTriggers = chron.painTriggers ?? assessment.painTriggers ?? "";
  const chronicRelieving = chron.relievingFactors ?? assessment.chronicRelieving ?? "";
  const typeOfSport = sport.typeOfSport ?? assessment.typeOfSport ?? "";
  const recurringInjuries = sport.recurringInjuries ?? assessment.recurringInjuries ?? "";
  const returnToSportGoals = sport.returnToSportGoals ?? assessment.returnToSportGoals ?? "";
  const neuroDiagnosis = neuro.neuroDiagnosis ?? assessment.neuroDiagnosis ?? "";
  const neuroOnset = neuro.neuroOnset ?? assessment.neuroOnset ?? "";
  const mobilityStatus = neuro.mobilityStatus ?? assessment.mobilityStatus ?? "";
  const cognitiveStatus = neuro.cognitiveStatus ?? assessment.cognitiveStatus ?? "";

  const hasAssessment = chiefComplaint || painScale || painType || duration || onset ||
    aggravatingFactors || relievingFactors || observations ||
    difficultiesIn.length > 0 || dailyLivingAffected ||
    postureAssessment.length > 0 || romStatus.length > 0 ||
    muscleStrength.length > 0 || neurologicalSigns.length > 0;

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* ═══════════════════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════════════════ */}
        <View style={S.header}>
          <View style={S.hLeft}>
            <Text style={S.hClinic}>{clicniData?.name || "PhysioCare Clinic"}</Text>
            {clicniData?.address ? <Text style={S.hMeta}>{clicniData.address}</Text> : null}
            {clicniData?.phone ? <Text style={S.hMeta}>{clicniData.phone}</Text> : null}
          </View>
          <View style={S.hRight}>
            <View style={S.hBadge}>
              <Text style={S.hBadgeTx}>PHYSIOTHERAPY REPORT</Text>
            </View>
            <Text style={S.hMeta2}>Date: {today}</Text>
            {bookingId ? <Text style={S.hMeta2}>Booking: #{String(bookingId).slice(-8).toUpperCase()}</Text> : null}
          </View>
        </View>

        <View style={S.body}>

          {/* ═══════════════════════════════════════════════════════════════
              1. PATIENT & BOOKING INFO
          ═══════════════════════════════════════════════════════════════ */}
          <View style={S.sec}>
            <SH title="Patient & Booking Information" />
            <View style={[S.card, { borderLeftColor: C.primary }]}>
              <View style={S.grid}>
                <View style={S.cell2}><LVB label="Full Name" value={capitalizeEachWord(patient?.patientName || patient?.name || patient?.fullName || "")} /></View>
                <View style={S.cell2}><LV label="Patient ID" value={patient?.patientId} /></View>
                <View style={S.cell2}><LV label="Age" value={patient?.age ? `${patient.age} yrs` : ""} /></View>
                <View style={S.cell2}><LV label="Gender" value={patient?.sex || patient?.gender} /></View>
                <View style={S.cell2}><LV label="Mobile" value={patient?.mobileNumber} /></View>
                <View style={S.cell2}><LV label="Booking ID" value={bookingId} /></View>
                {(clinicId || branchId)
                  ? <View style={S.cell2}><LV label="Clinic / Branch" value={`${clinicId || ""}${branchId ? " · " + branchId : ""}`} /></View>
                  : null}
                {doctorData?.name || doctorData?.fullName
                  ? <View style={S.cell2}><LV label="Doctor" value={doctorData?.name || doctorData?.fullName} /></View>
                  : null}
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════
              2. COMPLAINTS & SYMPTOMS
          ═══════════════════════════════════════════════════════════════ */}
          <View style={S.sec}>
            <SH title="Complaints & Symptoms" color={C.danger} />
            <View style={[S.card, S.cDang]}>
              <View style={S.grid}>
                <View style={S.cell2}><LVB label="Complaint Details" value={complaints.complaintDetails} /></View>
                <View style={S.cell2}><LV label="Duration" value={complaints.duration} /></View>
                <View style={{ width: "100%", marginBottom: 6 }}>
                  <LV label="Selected Therapy" value={complaints.selectedTherapy} />
                </View>
              </View>
              {/* Affected parts */}
              {parts.length > 0
                ? <View style={{ marginBottom: 8 }}>
                  <Text style={S.lbl}>Affected Parts</Text>
                  <View style={S.bRow}>
                    {parts.map((p, i) => <Bdg key={i} text={p} variant="purple" />)}
                  </View>
                </View>
                : null}
              {/* Pain assessment image */}
              {complaints.painAssessmentImage
                ? <View style={{ marginTop: 4 }}>
                  <Text style={S.lbl}>Pain Assessment Diagram</Text>
                  <Image
                    src={String(complaints.painAssessmentImage).startsWith("data:")
                      ? complaints.painAssessmentImage
                      : `data:image/jpeg;base64,${complaints.painAssessmentImage}`}
                    style={S.img}
                  />
                </View>
                : null}
              {/* Report images */}
              {complaints.reportImages.length > 0
                ? <View style={{ marginTop: 6 }}>
                  <Text style={S.lbl}>Report Images ({complaints.reportImages.length})</Text>
                  <View style={S.imgRow}>
                    {complaints.reportImages.map((img, i) => (
                      <Image key={i} src={img} style={S.img} />
                    ))}
                  </View>
                </View>
                : null}
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════
              3. PATIENT BACKGROUND
          ═══════════════════════════════════════════════════════════════ */}
          {(background.previousInjuries || background.currentMedications || background.allergies ||
            background.occupation || background.insuranceProvider || background.patientPain ||
            background.activityLevels.length > 0)
            ? <View style={S.sec}>
              <SH title="Patient Background" color={C.mid} />
              <View style={[S.card, { borderLeftColor: "#6b7280" }]}>
                <View style={S.grid}>
                  {background.previousInjuries ? <View style={S.cell2}><LV label="Previous Injuries" value={background.previousInjuries} /></View> : null}
                  {background.currentMedications ? <View style={S.cell2}><LV label="Current Medications" value={background.currentMedications} /></View> : null}
                  {background.allergies ? <View style={S.cell2}><LV label="Allergies" value={background.allergies} /></View> : null}
                  {background.occupation ? <View style={S.cell2}><LV label="Occupation" value={background.occupation} /></View> : null}
                  {background.insuranceProvider ? <View style={S.cell2}><LV label="Insurance Provider" value={background.insuranceProvider} /></View> : null}
                  {background.patientPain
                    ? <View style={S.cell2}><LV label="Pain Type" value={PAIN_LABEL_MAP[background.patientPain] || background.patientPain} /></View>
                    : null}
                </View>
                {background.activityLevels.length > 0
                  ? <View style={{ marginTop: 4 }}>
                    <Text style={S.lbl}>Activity Levels</Text>
                    <View style={S.bRow}>
                      {background.activityLevels.map((lvl, i) => <Bdg key={i} text={lvl} variant="purple" />)}
                    </View>
                  </View>
                  : null}
              </View>
            </View>
            : null}

          {/* ═══════════════════════════════════════════════════════════════
              4. THERAPY QUESTIONNAIRE
          ═══════════════════════════════════════════════════════════════ */}
          {Object.keys(complaints.therapyAnswersObj).length > 0
            ? <View style={S.sec}>
              <SH title="Therapy Questionnaire" />
              <View style={S.card}>
                {Object.entries(complaints.therapyAnswersObj).map(([cat, qs]) => (
                  <View key={cat} style={{ marginBottom: 8 }}>
                    <Text style={S.qaHead}>{capitalizeEachWord(cat)}</Text>
                    {Array.isArray(qs) && qs.map((q, i) => (
                      <View key={i} style={S.qaRow}>
                        <Text style={S.qaBul}>•</Text>
                        <Text style={S.qaQ}>{q.question}</Text>
                        <Text style={S.qaA}>{q.answer}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
            : null}

          {/* ═══════════════════════════════════════════════════════════════
              5. INVESTIGATION
              ✅ FIX: reads selectedTests/notes from Investigation component
          ═══════════════════════════════════════════════════════════════ */}
          {(investigation.tests.length > 0 || investigation.reason)
            ? <View style={S.sec}>
              <SH title="Investigation" color={C.accent} />
              <View style={[S.card, S.cAcc]}>
                {investigation.tests.length > 0
                  ? <View style={{ marginBottom: investigation.reason ? 8 : 0 }}>
                    <Text style={S.lbl}>Recommended Tests</Text>
                    <View style={S.bRow}>
                      {investigation.tests.map((t, i) => <Bdg key={i} text={t} variant="green" />)}
                    </View>
                  </View>
                  : null}
                {investigation.reason
                  ? <View>
                    <Text style={S.lbl}>Notes / Reason</Text>
                    <Text style={S.val}>{investigation.reason}</Text>
                  </View>
                  : null}
              </View>
            </View>
            : null}

          {/* ═══════════════════════════════════════════════════════════════
              6. ASSESSMENT
          ═══════════════════════════════════════════════════════════════ */}
          {hasAssessment
            ? <View style={S.sec}>
              <SH title="Clinical Assessment" color={C.warning} />
              <View style={[S.card, S.cWarn]}>

                {/* 6a. Subjective */}
                <SubH title="Subjective Assessment" color={C.primary} />
                {painScale
                  ? <View style={{ marginBottom: 8 }}>
                    <Text style={S.lbl}>Pain Scale</Text>
                    <PainBar scaleText={painScale} />
                  </View>
                  : null}
                <View style={S.grid}>
                  {chiefComplaint ? <View style={S.cell2}><LVB label="Chief Complaint" value={chiefComplaint} /></View> : null}
                  {painType ? <View style={S.cell2}><LV label="Pain Type" value={painType} /></View> : null}
                  {duration ? <View style={S.cell2}><LV label="Duration" value={duration} /></View> : null}
                  {onset ? <View style={S.cell2}><LV label="Onset" value={onset} /></View> : null}
                  {aggravatingFactors ? <View style={S.cell2}><LV label="Aggravating Factors" value={aggravatingFactors} /></View> : null}
                  {relievingFactors ? <View style={S.cell2}><LV label="Relieving Factors" value={relievingFactors} /></View> : null}
                </View>
                {observations ? <View style={{ marginBottom: 6 }}><LV label="Observations" value={observations} /></View> : null}

                {/* 6b. Functional Assessment */}
                {(difficultiesIn.length > 0 || otherDifficulty || dailyLivingAffected)
                  ? <View>
                    <View style={S.divider} />
                    <SubH title="Functional Assessment" color={C.primary} />
                    {difficultiesIn.length > 0
                      ? <View style={{ marginBottom: 6 }}>
                        <Text style={S.lbl}>Difficulties In</Text>
                        <View style={S.bRow}>
                          {difficultiesIn.map((d, i) => <Bdg key={i} text={d} />)}
                          {otherDifficulty ? <Bdg text={`Other: ${otherDifficulty}`} /> : null}
                        </View>
                      </View>
                      : null}
                    {dailyLivingAffected ? <LV label="Daily Living Affected" value={dailyLivingAffected} /> : null}
                  </View>
                  : null}

                {/* 6c. Physical Examination */}
                {(postureAssessment.length > 0 || romStatus.length > 0 || muscleStrength.length > 0 || neurologicalSigns.length > 0)
                  ? <View>
                    <View style={S.divider} />
                    <SubH title="Physical Examination" color={C.purple} />
                    <CheckRow label="Posture Assessment" options={["Normal", "Deviations"]} selected={postureAssessment} note={postureDeviations} />
                    <CheckRow label="Range of Motion" options={["Normal", "Restricted"]} selected={romStatus} note={romRestricted ? `${romRestricted}${romJoints ? " · " + romJoints : ""}` : romJoints} />
                    <CheckRow label="Muscle Strength" options={["Normal", "Weakness in"]} selected={muscleStrength} note={muscleWeakness} />
                    <CheckRow label="Neurological Signs" options={["Normal", "Balance", "Coordination", "Sensation issues"]} selected={neurologicalSigns} />
                  </View>
                  : null}

                {/* 6d. Chronic Pain */}
                {patientPain === "chronicPain" && (painTriggers || chronicRelieving)
                  ? <View>
                    <View style={S.divider} />
                    <SubH title="Chronic Pain Assessment" color={C.danger} />
                    <View style={S.grid}>
                      {painTriggers ? <View style={S.cell2}><LV label="Pain Triggers" value={painTriggers} /></View> : null}
                      {chronicRelieving ? <View style={S.cell2}><LV label="Relieving Factors" value={chronicRelieving} /></View> : null}
                    </View>
                  </View>
                  : null}

                {/* 6e. Sports Rehab */}
                {patientPain === "sportsRehab" && (typeOfSport || recurringInjuries || returnToSportGoals)
                  ? <View>
                    <View style={S.divider} />
                    <SubH title="Sports Rehab Assessment" color={C.accent} />
                    <View style={S.grid}>
                      {typeOfSport ? <View style={S.cell2}><LV label="Type of Sport" value={typeOfSport} /></View> : null}
                      {recurringInjuries ? <View style={S.cell2}><LV label="Recurring Injuries" value={recurringInjuries} /></View> : null}
                      {returnToSportGoals ? <View style={{ width: "100%" }}><LV label="Return-to-Sport Goals" value={returnToSportGoals} /></View> : null}
                    </View>
                  </View>
                  : null}

                {/* 6f. Neuro Rehab */}
                {patientPain === "neuroRehab" && (neuroDiagnosis || neuroOnset || mobilityStatus || cognitiveStatus)
                  ? <View>
                    <View style={S.divider} />
                    <SubH title="Neuro Rehab Assessment" color={C.purple} />
                    <View style={S.grid}>
                      {neuroDiagnosis ? <View style={S.cell2}><LV label="Diagnosis" value={neuroDiagnosis} /></View> : null}
                      {neuroOnset ? <View style={S.cell2}><LV label="Onset" value={neuroOnset} /></View> : null}
                      {mobilityStatus ? <View style={S.cell2}><LV label="Mobility Status" value={mobilityStatus} /></View> : null}
                      {cognitiveStatus ? <View style={S.cell2}><LV label="Cognitive / Communication" value={cognitiveStatus} /></View> : null}
                    </View>
                  </View>
                  : null}

              </View>
            </View>
            : null}

          {/* ═══════════════════════════════════════════════════════════════
              7. DIAGNOSIS
          ═══════════════════════════════════════════════════════════════ */}
          {diagnosisRows.length > 0
            ? <View style={S.sec}>
              <SH title="Diagnosis" color={C.accent} />
              <View style={S.tbl}>
                <View style={S.tHead}>
                  <Text style={[S.tHCell, { flex: 0.4 }]}>#</Text>
                  <Text style={[S.tHCell, { flex: 2 }]}>Physio Diagnosis</Text>
                  <Text style={[S.tHCell, { flex: 1.5 }]}>Affected Area</Text>
                  <Text style={[S.tHCell, { flex: 1 }]}>Severity</Text>
                  <Text style={[S.tHCell, { flex: 1 }]}>Stage</Text>
                  <Text style={[S.tHCell, { flex: 2 }]}>Notes</Text>
                </View>
                {diagnosisRows.map((d, i) => (
                  <View key={i} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]}>
                    <Text style={[S.tCell, { flex: 0.4, fontFamily: "Helvetica-Bold", color: C.primary }]}>{i + 1}</Text>
                    <Text style={[S.tCell, { flex: 2, fontFamily: "Helvetica-Bold" }]}>{d.physioDiagnosis || "—"}</Text>
                    <Text style={[S.tCell, { flex: 1.5 }]}>{d.affectedArea || "—"}</Text>
                    <Text style={[S.tCell, { flex: 1 }]}>{d.severity || "—"}</Text>
                    <Text style={[S.tCell, { flex: 1 }]}>{d.stage || "—"}</Text>
                    <Text style={[S.tCell, { flex: 2 }]}>{d.notes || "—"}</Text>
                  </View>
                ))}
              </View>
            </View>
            : null}

          {/* ═══════════════════════════════════════════════════════════════
              8. TREATMENT PLAN
          ═══════════════════════════════════════════════════════════════ */}
          {hasAny(treatmentPlan)
            ? <View style={S.sec}>
              <SH title="Treatment Plan" />
              <View style={S.card}>
                <View style={S.grid}>
                  {(treatmentPlan.doctorName || treatmentPlan.therapistName)
                    ? <View style={S.cell2}><LVB label="Assigned Therapist / Doctor" value={treatmentPlan.therapistName || treatmentPlan.doctorName} /></View>
                    : null}
                  {(treatmentPlan.doctorId || treatmentPlan.therapistId)
                    ? <View style={S.cell2}><LV label="Therapist / Doctor ID" value={treatmentPlan.therapistId || treatmentPlan.doctorId} /></View>
                    : null}
                  {treatmentPlan.frequency
                    ? <View style={S.cell2}><LV label="Frequency" value={`${treatmentPlan.frequency} sessions/week`} /></View>
                    : null}
                  {treatmentPlan.totalSessions
                    ? <View style={S.cell2}><LV label="Total Sessions" value={treatmentPlan.totalSessions} /></View>
                    : null}
                  {treatmentPlan.sessionDuration
                    ? <View style={S.cell2}><LV label="Session Duration" value={`${treatmentPlan.sessionDuration} min`} /></View>
                    : null}
                </View>
                {treatmentPlan.manualTherapy
                  ? <View style={{ marginBottom: 6 }}><LV label="Manual Therapy" value={treatmentPlan.manualTherapy} /></View>
                  : null}
                {treatmentPlan.precautions
                  ? <View style={{ marginBottom: 6 }}>
                    <Text style={S.lbl}>Precautions</Text>
                    <Text style={S.val}>{Array.isArray(treatmentPlan.precautions) ? treatmentPlan.precautions.join(", ") : treatmentPlan.precautions}</Text>
                  </View>
                  : null}
                {Array.isArray(treatmentPlan.modalities) && treatmentPlan.modalities.length > 0
                  ? <View style={{ marginTop: 4 }}>
                    <Text style={S.lbl}>Modalities</Text>
                    <View style={S.bRow}>
                      {treatmentPlan.modalities.map((m, i) => <Bdg key={i} text={m} />)}
                    </View>
                  </View>
                  : null}
              </View>
            </View>
            : null}

          {/* ═══════════════════════════════════════════════════════════════
              9. THERAPY SESSIONS (full nested structure)
              ✅ FIX: renders Package → Program → Therapy → Exercises
          ═══════════════════════════════════════════════════════════════ */}
          {sessionsList.length > 0
            ? <View style={S.sec}>
              <SH title="Therapy Sessions" />
              {overallStatus
                ? <View style={[S.bRow, { marginBottom: 6 }]}>
                  <Text style={{ fontSize: 8, color: C.muted, marginRight: 6 }}>Overall Status:</Text>
                  <Bdg text={overallStatus}
                    variant={overallStatus === "Completed" ? "green" : overallStatus === "Cancelled" ? "red" : "yellow"} />
                </View>
                : null}
              {sessionsList.map((sess, i) => (
                <SessionBlock key={i} sess={sess} isLast={i === sessionsList.length - 1} />
              ))}
            </View>
            : null}

          {/* ═══════════════════════════════════════════════════════════════
              10. EXERCISE PLAN (home exercises)
              ✅ FIX: reads from homeExercises (not exercises)
          ═══════════════════════════════════════════════════════════════ */}
          {(homeExercises.length > 0 || homeAdvice)
            ? <View style={S.sec}>
              <SH title="Home Exercise Plan" color={C.accent} />
              {homeExercises.length > 0
                ? <View style={{ marginBottom: homeAdvice ? 8 : 0 }}>
                  <View style={S.tbl}>
                    <View style={S.tHead}>
                      <Text style={[S.tHCell, { flex: 0.4 }]}>#</Text>
                      <Text style={[S.tHCell, { flex: 2 }]}>Exercise</Text>
                      <Text style={[S.tHCell, { flex: 0.8 }]}>Sets</Text>
                      <Text style={[S.tHCell, { flex: 0.8 }]}>Reps</Text>
                      <Text style={[S.tHCell, { flex: 1.2 }]}>Duration</Text>
                      <Text style={[S.tHCell, { flex: 1.2 }]}>Frequency</Text>
                      <Text style={[S.tHCell, { flex: 2.5 }]}>Instructions</Text>
                    </View>
                    {homeExercises.map((ex, i) => (
                      <View key={i} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]}>
                        <Text style={[S.tCell, { flex: 0.4, fontFamily: "Helvetica-Bold", color: C.primary }]}>{i + 1}</Text>
                        <Text style={[S.tCell, { flex: 2, fontFamily: "Helvetica-Bold" }]}>{ex.name || "—"}</Text>
                        <Text style={[S.tCell, { flex: 0.8 }]}>{dash(ex.sets)}</Text>
                        <Text style={[S.tCell, { flex: 0.8 }]}>{dash(ex.reps)}</Text>
                        <Text style={[S.tCell, { flex: 1.2 }]}>{dash(ex.duration)}</Text>
                        <Text style={[S.tCell, { flex: 1.2 }]}>{dash(ex.frequency)}</Text>
                        <Text style={[S.tCell, { flex: 2.5 }]}>{dash(ex.instructions)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                : null}
              {homeAdvice
                ? <View style={[S.card, S.cAcc]}>
                  <Text style={S.lbl}>Home Advice</Text>
                  <Text style={S.note}>{homeAdvice}</Text>
                </View>
                : null}
            </View>
            : null}

          {/* ═══════════════════════════════════════════════════════════════
              11. FOLLOW-UP PLAN
          ═══════════════════════════════════════════════════════════════ */}
          {(followUpEntry.nextVisitDate || followUpEntry.reviewNotes || followUpEntry.modifications)
            ? <View style={S.sec}>
              <SH title="Follow-Up Plan" />
              <View style={S.card}>
                <View style={S.row2}>
                  <View style={S.col2}>
                    <Text style={S.lbl}>Next Visit Date</Text>
                    <Text style={S.valB}>{followUpEntry.nextVisitDate || "—"}</Text>
                  </View>
                  {followUpEntry.treatmentStatus
                    ? <View style={S.col2}>
                      <Text style={S.lbl}>Treatment Status</Text>
                      <View style={S.bRow}>
                        <Bdg text={followUpEntry.treatmentStatus}
                          variant={
                            followUpEntry.treatmentStatus === "Active" ? "green" :
                              followUpEntry.treatmentStatus === "Discharged" ? "red" :
                                followUpEntry.treatmentStatus === "Completed" ? "green" :
                                  "yellow"
                          } />
                      </View>
                    </View>
                    : null}
                </View>
                {followUpEntry.reviewNotes
                  ? <View style={{ marginTop: 6 }}>
                    <Text style={S.lbl}>Review Notes</Text>
                    <Text style={S.val}>{followUpEntry.reviewNotes}</Text>
                  </View>
                  : null}
                {followUpEntry.modifications
                  ? <View style={{ marginTop: 6 }}>
                    <Text style={S.lbl}>Modifications</Text>
                    <Text style={S.val}>{followUpEntry.modifications}</Text>
                  </View>
                  : null}
              </View>
            </View>
            : null}

          {/* ═══════════════════════════════════════════════════════════════
              12. AUTHORIZED BY
          ═══════════════════════════════════════════════════════════════ */}
          {(doctorData?.name || doctorData?.fullName || doctorData?.doctorName ||
            treatmentPlan?.doctorName || treatmentPlan?.therapistName)
            ? <View style={[S.sec, { marginTop: 8 }]}>
              <SH title="Authorized By" />
              <View style={S.row2}>
                {(doctorData?.name || doctorData?.fullName || doctorData?.doctorName || treatmentPlan?.doctorName)
                  ? <View style={[S.card, { flex: 1, marginRight: 8 }]}>
                    <LVB label="Doctor" value={doctorData?.name || doctorData?.fullName || doctorData?.doctorName || treatmentPlan?.doctorName} />
                    {doctorData?.qualification ? <LV label="Qualification" value={doctorData.qualification} /> : null}
                    {doctorData?.regNumber ? <LV label="Reg. No." value={doctorData.regNumber} /> : null}
                    {(doctorData?.doctorId || treatmentPlan?.doctorId)
                      ? <LV label="Doctor ID" value={doctorData?.doctorId || treatmentPlan?.doctorId} />
                      : null}
                  </View>
                  : null}
                {treatmentPlan?.therapistName
                  ? <View style={[S.card, S.cAcc, { flex: 1 }]}>
                    <LVB label="Therapist" value={treatmentPlan.therapistName} />
                    {treatmentPlan?.therapistId ? <LV label="Therapist ID" value={treatmentPlan.therapistId} /> : null}
                  </View>
                  : null}
              </View>
            </View>
            : null}

        </View>

        {/* ═══════════════════════════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════════════════════════ */}
        <View style={S.footer}>
          <Text style={S.ftTx}>Generated: {today} · {clicniData?.name || "PhysioCare Clinic"}</Text>
          <Text style={S.ftTx}>Confidential — for medical use only.</Text>
        </View>

      </Page>
    </Document>
  );
};

// ── Styles used by TherapyQuestionnaire (kept for compatibility) ──────────────
const extraStyles = StyleSheet.create({
  qaHead: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 4, marginTop: 3 },
  qaRow: { flexDirection: "row", marginBottom: 3, paddingLeft: 6 },
  qaBul: { fontSize: 8, color: C.muted, marginRight: 4 },
  qaQ: { fontSize: 8, color: C.muted, flex: 1 },
  qaA: { fontSize: 8, color: C.dark, fontFamily: "Helvetica-Bold" },
});
// Merge into S so TherapyQuestionnaire block above can reference them
Object.assign(S, extraStyles);

export default PrescriptionPDF;