// src/components/PrescriptionPDF.jsx
import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { capitalizeEachWord } from "./CaptalZeWord";

// ─────────────────────────────────────────────────────────────────────────────
//  ALL CALL STYLES ARE SUPPORTED:
//
//  A) <PrescriptionPDF bookingData={fullJson} clicniData={c} doctorData={d} />
//  B) <PrescriptionPDF formData={fullJson}    clicniData={c} doctorData={d} />
//  C) <PrescriptionPDF formData={{complaints,assessment,...}} patientData={p} ... />
// ─────────────────────────────────────────────────────────────────────────────

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  primary: "#1a56db", primaryLight: "#e8f0fe",
  accent:  "#0e9f6e", accentLight:  "#e8f5f0",
  warning: "#e3a008", warningLight: "#fef3c7",
  danger:  "#e02424", dangerLight:  "#fde8e8",
  dark: "#111827", mid: "#374151", muted: "#6b7280",
  border: "#e5e7eb", bgLight: "#f9fafb", white: "#ffffff",
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page:    { padding: 0, fontSize: 10, fontFamily: "Helvetica", backgroundColor: C.white },
  header:  { backgroundColor: C.primary, padding: "20 32 16 32", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  hLeft:   { flexDirection: "column" },
  hClinic: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.white, marginBottom: 3 },
  hMeta:   { fontSize: 9, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  hRight:  { alignItems: "flex-end" },
  hBadge:  { backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 4, padding: "4 10", marginBottom: 4 },
  hBadgeTx:{ color: C.white, fontSize: 9, fontFamily: "Helvetica-Bold" },
  hMeta2:  { fontSize: 8, color: "rgba(255,255,255,0.6)" },

  body: { padding: "16 32 24 32" },

  sec:     { marginBottom: 14 },
  secHead: { flexDirection: "row", alignItems: "center", marginBottom: 8, borderBottomWidth: 1.5, borderBottomColor: C.primary, paddingBottom: 4 },
  secDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginRight: 6 },
  secTx:   { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.primary, textTransform: "uppercase", letterSpacing: 0.5 },

  row2:  { flexDirection: "row" },
  col2:  { flex: 1, marginBottom: 6, paddingRight: 8 },
  grid:  { flexDirection: "row", flexWrap: "wrap" },
  cell2: { width: "50%", marginBottom: 6, paddingRight: 8 },

  lbl: { fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 },
  val: { fontSize: 10, color: C.dark },
  valB:{ fontSize: 10, color: C.dark, fontFamily: "Helvetica-Bold" },

  card:  { backgroundColor: C.bgLight, borderRadius: 6, padding: "10 12", marginBottom: 8, borderLeftWidth: 3, borderLeftColor: C.primary },
  cAcc:  { borderLeftColor: C.accent  },
  cWarn: { borderLeftColor: C.warning },
  cDang: { borderLeftColor: C.danger  },

  bRow:  { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  badge: { backgroundColor: C.primaryLight, borderRadius: 10, padding: "2 8", marginRight: 4, marginBottom: 4 },
  bTx:   { fontSize: 9, color: C.primary, fontFamily: "Helvetica-Bold" },
  bGreen:{ backgroundColor: C.accentLight  }, bGreenTx: { color: C.accent  },
  bYell: { backgroundColor: C.warningLight }, bYellTx:  { color: C.warning },
  bRed:  { backgroundColor: C.dangerLight  }, bRedTx:   { color: C.danger  },

  tbl:    { borderWidth: 1, borderColor: C.border, borderRadius: 6, overflow: "hidden" },
  tHead:  { flexDirection: "row", backgroundColor: C.primary, padding: "6 10" },
  tHCell: { flex: 1, fontSize: 9, color: C.white, fontFamily: "Helvetica-Bold" },
  tRow:   { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.border, padding: "6 10" },
  tRowAlt:{ backgroundColor: C.bgLight },
  tCell:  { flex: 1, fontSize: 9, color: C.mid },

  qaHead: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 5, marginTop: 4 },
  qaRow:  { flexDirection: "row", marginBottom: 4, paddingLeft: 8 },
  qaBul:  { fontSize: 9, color: C.muted, marginRight: 4, marginTop: 1 },
  qaQ:    { fontSize: 9, color: C.muted, flex: 1 },
  qaA:    { fontSize: 9, color: C.dark, fontFamily: "Helvetica-Bold" },

  exCard: { borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: "10 12", marginBottom: 8, flexDirection: "row" },
  exThumb:{ width: 60, height: 45, borderRadius: 4, marginRight: 12 },
  exDet:  { flex: 1 },
  exName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 4 },
  exMeta: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
  exMetaI:{ backgroundColor: C.accentLight, borderRadius: 4, padding: "2 6", marginRight: 6, marginBottom: 2 },
  exMetaTx:{ fontSize: 8, color: C.accent },
  exInstr:{ fontSize: 8, color: C.muted, lineHeight: 1.4 },
  exUrl:  { fontSize: 8, color: C.primary, marginTop: 3 },

  pbBg:   { height: 8, backgroundColor: C.border, borderRadius: 4, marginTop: 4, width: "100%" },
  pbFill: { height: 8, borderRadius: 4 },

  img:    { width: 90, height: 90, borderRadius: 6, marginRight: 10, marginTop: 4 },
  imgRow: { flexDirection: "row", flexWrap: "wrap" },

  footer: { backgroundColor: C.bgLight, borderTopWidth: 1, borderTopColor: C.border, padding: "10 32", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ftTx:   { fontSize: 8, color: C.muted },
  note:   { fontSize: 9, color: C.mid, lineHeight: 1.5 },
});

// ── Data resolver — the single source of truth ────────────────────────────────
function resolve(props) {
  const { bookingData, formData, patientData } = props;

  // Detect whether an object IS the full booking JSON
  const isFull = (o) =>
    o != null && typeof o === "object" &&
    (o.patientInfo != null || o.assessment != null ||
     o.followUp    != null || o.treatmentPlan != null ||
     o.therapySessions != null || o.exercisePlan != null);

  // Pick the root: bookingData wins, then formData if it looks full
  const root = bookingData ?? (isFull(formData) ? formData : null);

  // Helper: root.key → formData.key → explicit prop → fallback
  const pick = (key, explicitProp, fb = {}) =>
    root?.[key]     != null ? root[key]      :
    explicitProp    != null ? explicitProp    :
    formData?.[key] != null ? formData[key]  :
    fb;

  const patient         = pick("patientInfo",      patientData,            {});
  const complaints      = pick("complaints",        props.complaintsData,   {});
  const assessment      = pick("assessment",        props.assessmentData,   {});
  const diagnosis       = pick("diagnosis",         props.diagnosisData,    {});
  const treatmentPlan   = pick("treatmentPlan",     props.treatmentData,    {});
  const therapySessions = pick("therapySessions",   props.sessionsData,     []);
  const exercisePlan    = pick("exercisePlan",      props.exerciseData,     {});
  const followUp        = pick("followUp",          props.followUpData,     {});

  const bookingId = root?.bookingId ?? formData?.bookingId ?? null;
  const clinicId  = root?.clinicId  ?? formData?.clinicId  ?? null;
  const branchId  = root?.branchId  ?? formData?.branchId  ?? null;

  const therapyAnswers =
    complaints?.therapyAnswers  ||
    complaints?.theraphyAnswers || {};

  return {
    patient, complaints, assessment, diagnosis,
    treatmentPlan, therapySessions, exercisePlan, followUp,
    therapyAnswers, bookingId, clinicId, branchId,
    doctorData:  props.doctorData  ?? {},
    clicniData:  props.clicniData  ?? {},
  };
}

// ── Primitive helpers ─────────────────────────────────────────────────────────
const hasAny = (obj) =>
  obj != null && typeof obj === "object" &&
  Object.values(obj).some((v) => v != null && v !== "");

const SH = ({ title, color }) => (
  <View style={S.secHead}>
    <View style={[S.secDot, color ? { backgroundColor: color } : {}]} />
    <Text style={[S.secTx, color ? { color } : {}]}>{title}</Text>
  </View>
);

const LV = ({ label, value }) => (
  <View>
    <Text style={S.lbl}>{label}</Text>
    <Text style={S.val}>{value || "—"}</Text>
  </View>
);

const LVB = ({ label, value }) => (
  <View>
    <Text style={S.lbl}>{label}</Text>
    <Text style={S.valB}>{value || "—"}</Text>
  </View>
);

const Bdg = ({ text, variant }) => {
  const bg = variant === "green" ? S.bGreen : variant === "yellow" ? S.bYell : variant === "red" ? S.bRed : S.badge;
  const tx = variant === "green" ? S.bGreenTx : variant === "yellow" ? S.bYellTx : variant === "red" ? S.bRedTx : S.bTx;
  return (
    <View style={[S.badge, bg]}>
      <Text style={[S.bTx, tx]}>{text}</Text>
    </View>
  );
};

const PainBar = ({ scaleText }) => {
  const m = scaleText?.match(/(\d+)\s*\/\s*(\d+)/);
  const pct = m ? (parseInt(m[1]) / parseInt(m[2])) * 100 : 0;
  const color = pct >= 70 ? C.danger : pct >= 40 ? C.warning : C.accent;
  return (
    <View>
      <View style={S.pbBg}>
        <View style={[S.pbFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={{ fontSize: 8, color: C.muted, marginTop: 2 }}>{scaleText} pain scale</Text>
    </View>
  );
};

const sevV = (s) => {
  const sl = (s || "").toLowerCase();
  return sl === "mild" ? "green" : sl === "moderate" ? "yellow" : sl === "severe" ? "red" : "default";
};

// ── Main ──────────────────────────────────────────────────────────────────────
const PrescriptionPDF = (props) => {
  const {
    patient, complaints, assessment, diagnosis,
    treatmentPlan, therapySessions, exercisePlan, followUp,
    therapyAnswers, bookingId, clinicId, branchId,
    doctorData, clicniData,
  } = resolve(props);

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <View style={S.header}>
          <View style={S.hLeft}>
            <Text style={S.hClinic}>{clicniData?.name || "PhysioCare Clinic"}</Text>
            {clicniData?.address ? <Text style={S.hMeta}>{clicniData.address}</Text> : null}
            {clicniData?.phone   ? <Text style={S.hMeta}>{clicniData.phone}</Text>   : null}
          </View>
          <View style={S.hRight}>
            <View style={S.hBadge}>
              <Text style={S.hBadgeTx}>PHYSIOTHERAPY REPORT</Text>
            </View>
            <Text style={S.hMeta2}>Date: {today}</Text>
            {bookingId
              ? <Text style={S.hMeta2}>Booking: #{String(bookingId).slice(-8).toUpperCase()}</Text>
              : null}
          </View>
        </View>

        <View style={S.body}>

          {/* ── PATIENT ───────────────────────────────────────────────────── */}
          <View style={S.sec}>
            <SH title="Patient Information" />
            <View style={[S.card, { borderLeftColor: C.primary }]}>
              <View style={S.grid}>
                <View style={S.cell2}><LVB label="Full Name" value={capitalizeEachWord(patient?.name || patient?.patientName || "—")} /></View>
                <View style={S.cell2}><LV  label="Patient ID"  value={patient?.patientId} /></View>
                <View style={S.cell2}><LV  label="Age"         value={patient?.age} /></View>
                <View style={S.cell2}><LV  label="Gender"      value={patient?.sex || patient?.gender} /></View>
                <View style={S.cell2}><LV  label="Mobile"      value={patient?.mobileNumber} /></View>
                {(clinicId || branchId)
                  ? <View style={S.cell2}><LV label="Clinic / Branch" value={`${clinicId || ""}${branchId ? " · " + branchId : ""}`} /></View>
                  : null}
              </View>
            </View>
          </View>

          {/* ── CHIEF COMPLAINTS ──────────────────────────────────────────── */}
          <View style={S.sec}>
            <SH title="Chief Complaints" color={C.danger} />
            <View style={[S.card, S.cDang]}>
              <View style={S.row2}>
                <View style={S.col2}><LVB label="Complaint"      value={complaints?.complaintDetails} /></View>
                <View style={S.col2}><LV  label="Duration"       value={complaints?.duration} /></View>
              </View>
              <View style={{ marginBottom: 6 }}>
                <LV label="Selected Therapy" value={complaints?.selectedTherapy} />
              </View>
              {complaints?.painAssessmentImage
                ? <View style={{ marginTop: 6 }}>
                    <Text style={S.lbl}>Pain Assessment Diagram</Text>
                    <Image
                      src={String(complaints.painAssessmentImage).startsWith("data:")
                        ? complaints.painAssessmentImage
                        : `data:image/png;base64,${complaints.painAssessmentImage}`}
                      style={S.img}
                    />
                  </View>
                : null}
              {Array.isArray(complaints?.reportImages) && complaints.reportImages.length > 0
                ? <View style={{ marginTop: 6 }}>
                    <Text style={S.lbl}>Report Images</Text>
                    <View style={S.imgRow}>
                      {complaints.reportImages.map((img, i) => <Image key={i} src={img} style={S.img} />)}
                    </View>
                  </View>
                : null}
            </View>
          </View>

          {/* ── THERAPY QUESTIONNAIRE ─────────────────────────────────────── */}
          {Object.keys(therapyAnswers).length > 0
            ? <View style={S.sec}>
                <SH title="Therapy Questionnaire" />
                <View style={S.card}>
                  {Object.entries(therapyAnswers).map(([cat, qs]) => (
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

          {/* ── CLINICAL ASSESSMENT ───────────────────────────────────────── */}
          {hasAny(assessment)
            ? <View style={S.sec}>
                <SH title="Clinical Assessment" color={C.warning} />
                <View style={[S.card, S.cWarn]}>
                  {assessment.painScale
                    ? <View style={{ marginBottom: 8 }}>
                        <Text style={S.lbl}>Pain Scale</Text>
                        <PainBar scaleText={assessment.painScale} />
                      </View>
                    : null}
                  <View style={S.grid}>
                    {[
                      ["chiefComplaint",     "Chief Complaint"],
                      ["painType",           "Pain Type"],
                      ["duration",           "Duration"],
                      ["onset",              "Onset"],
                      ["aggravatingFactors", "Aggravating Factors"],
                      ["relievingFactors",   "Relieving Factors"],
                      ["posture",            "Posture"],
                      ["rangeOfMotion",      "Range of Motion"],
                      ["specialTests",       "Special Tests"],
                    ].map(([k, lbl]) =>
                      assessment[k]
                        ? <View key={k} style={S.cell2}><LV label={lbl} value={assessment[k]} /></View>
                        : null
                    )}
                    {assessment.observations
                      ? <View style={{ width: "100%" }}><LV label="Observations" value={assessment.observations} /></View>
                      : null}
                  </View>
                </View>
              </View>
            : null}

          {/* ── DIAGNOSIS ─────────────────────────────────────────────────── */}
          {hasAny(diagnosis)
            ? <View style={S.sec}>
                <SH title="Diagnosis" color={C.accent} />
                <View style={[S.card, S.cAcc]}>
                  {diagnosis.physioDiagnosis
                    ? <View style={{ width: "100%", marginBottom: 6 }}>
                        <LVB label="Physio Diagnosis" value={diagnosis.physioDiagnosis} />
                      </View>
                    : null}
                  <View style={S.row2}>
                    <View style={S.col2}><LV label="Affected Area" value={diagnosis.affectedArea} /></View>
                    <View style={S.col2}>
                      <Text style={S.lbl}>Severity</Text>
                      {diagnosis.severity
                        ? <View style={S.bRow}><Bdg text={diagnosis.severity} variant={sevV(diagnosis.severity)} /></View>
                        : <Text style={S.val}>—</Text>}
                    </View>
                  </View>
                  <View style={S.row2}>
                    <View style={S.col2}>
                      <Text style={S.lbl}>Stage</Text>
                      {diagnosis.stage
                        ? <View style={S.bRow}><Bdg text={diagnosis.stage} variant="yellow" /></View>
                        : <Text style={S.val}>—</Text>}
                    </View>
                    <View style={S.col2} />
                  </View>
                  {diagnosis.notes
                    ? <View style={{ marginTop: 4 }}><LV label="Notes" value={diagnosis.notes} /></View>
                    : null}
                </View>
              </View>
            : null}

          {/* ── TREATMENT PLAN ────────────────────────────────────────────── */}
          {hasAny(treatmentPlan)
            ? <View style={S.sec}>
                <SH title="Treatment Plan" />
                <View style={S.card}>
                  <View style={S.row2}>
                    <View style={S.col2}>
                      <LVB label="Assigned Therapist / Doctor"
                           value={treatmentPlan.therapistName || treatmentPlan.doctorName} />
                    </View>
                    <View style={S.col2}>
                      <LV label="Session Duration"
                          value={treatmentPlan.sessionDuration ? `${treatmentPlan.sessionDuration} min` : null} />
                    </View>
                  </View>
                  <View style={S.row2}>
                    <View style={S.col2}>
                      <LV label="Frequency"
                          value={treatmentPlan.frequency ? `${treatmentPlan.frequency} sessions/week` : null} />
                    </View>
                    <View style={S.col2}>
                      <LV label="Total Sessions" value={treatmentPlan.totalSessions} />
                    </View>
                  </View>
                  {treatmentPlan.manualTherapy
                    ? <View style={{ marginBottom: 6 }}><LV label="Manual Therapy" value={treatmentPlan.manualTherapy} /></View>
                    : null}
                  {treatmentPlan.precautions
                    ? <View style={{ marginBottom: 6 }}><LV label="Precautions" value={treatmentPlan.precautions} /></View>
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

          {/* ── THERAPY SESSIONS ──────────────────────────────────────────── */}
          {Array.isArray(therapySessions) && therapySessions.length > 0
            ? <View style={S.sec}>
                <SH title="Therapy Sessions" />
                <View style={S.tbl}>
                  <View style={S.tHead}>
                    <Text style={[S.tHCell, { flex: 1.2 }]}>Date</Text>
                    <Text style={[S.tHCell, { flex: 0.8 }]}>Status</Text>
                    <Text style={[S.tHCell, { flex: 1.5 }]}>Modalities</Text>
                    <Text style={[S.tHCell, { flex: 2   }]}>Exercises</Text>
                    <Text style={[S.tHCell, { flex: 2   }]}>Response</Text>
                  </View>
                  {therapySessions.map((s, i) => (
                    <View key={i} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]}>
                      <Text style={[S.tCell, { flex: 1.2 }]}>{s.sessionDate || "—"}</Text>
                      <Text style={[S.tCell, { flex: 0.8 },
                        s.status === "Completed" ? { color: C.accent  } :
                        s.status === "Cancelled" ? { color: C.danger  } :
                                                   { color: C.warning }]}>
                        {s.status || "—"}
                      </Text>
                      <Text style={[S.tCell, { flex: 1.5 }]}>
                        {Array.isArray(s.modalitiesUsed) ? s.modalitiesUsed.join(", ") : "—"}
                      </Text>
                      <Text style={[S.tCell, { flex: 2 }]}>{s.exercisesDone   || "—"}</Text>
                      <Text style={[S.tCell, { flex: 2 }]}>{s.patientResponse || "—"}</Text>
                    </View>
                  ))}
                </View>
              </View>
            : null}

          {/* ── EXERCISE PLAN ─────────────────────────────────────────────── */}
          {Array.isArray(exercisePlan?.exercises) && exercisePlan.exercises.length > 0
            ? <View style={S.sec}>
                <SH title="Exercise Plan" color={C.accent} />
                {exercisePlan.exercises.map((ex, i) => (
                  <View key={i} style={S.exCard}>
                    {ex.thumbnail ? <Image src={ex.thumbnail} style={S.exThumb} /> : null}
                    <View style={S.exDet}>
                      <Text style={S.exName}>{ex.name || "Exercise"}</Text>
                      <View style={S.exMeta}>
                        {ex.sets     ? <View style={S.exMetaI}><Text style={S.exMetaTx}>Sets: {ex.sets}</Text></View>              : null}
                        {ex.reps     ? <View style={S.exMetaI}><Text style={S.exMetaTx}>Reps: {ex.reps}</Text></View>              : null}
                        {ex.duration ? <View style={S.exMetaI}><Text style={S.exMetaTx}>Duration: {ex.duration} min</Text></View>  : null}
                      </View>
                      {ex.instructions ? <Text style={S.exInstr}>{ex.instructions}</Text> : null}
                      {ex.videoUrl     ? <Text style={S.exUrl}>{ex.videoUrl}</Text>        : null}
                    </View>
                  </View>
                ))}
                {exercisePlan.homeAdvice
                  ? <View style={[S.card, S.cAcc]}>
                      <Text style={S.lbl}>Home Advice</Text>
                      <Text style={S.note}>{exercisePlan.homeAdvice}</Text>
                    </View>
                  : null}
              </View>
            : null}

          {/* ── FOLLOW-UP PLAN ────────────────────────────────────────────── */}
          {hasAny(followUp)
            ? <View style={S.sec}>
                <SH title="Follow-Up Plan" />
                <View style={S.card}>
                  <View style={S.row2}>
                    <View style={S.col2}>
                      <Text style={S.lbl}>Next Visit Date</Text>
                      <Text style={S.valB}>{followUp.nextVisitDate || "—"}</Text>
                    </View>
                    <View style={S.col2}>
                      <Text style={S.lbl}>Continue Treatment</Text>
                      {followUp.continueTreatment
                        ? <View style={S.bRow}>
                            <Bdg text={followUp.continueTreatment}
                                 variant={followUp.continueTreatment === "Yes" ? "green" : "red"} />
                          </View>
                        : <Text style={S.val}>—</Text>}
                    </View>
                  </View>
                  {followUp.reviewNotes
                    ? <View style={{ marginTop: 6 }}>
                        <Text style={S.lbl}>Review Notes</Text>
                        <Text style={S.val}>{followUp.reviewNotes}</Text>
                      </View>
                    : null}
                  {followUp.modifications
                    ? <View style={{ marginTop: 6 }}>
                        <Text style={S.lbl}>Modifications</Text>
                        <Text style={S.val}>{followUp.modifications}</Text>
                      </View>
                    : null}
                </View>
              </View>
            : null}

          {/* ── AUTHORIZED BY ─────────────────────────────────────────────── */}
          {(doctorData?.doctorName || treatmentPlan?.doctorName || treatmentPlan?.therapistName)
            ? <View style={[S.sec, { marginTop: 8 }]}>
                <SH title="Authorized By" />
                <View style={S.row2}>
                  {(doctorData?.doctorName || treatmentPlan?.doctorName)
                    ? <View style={[S.card, { flex: 1, marginRight: 8 }]}>
                        <LVB label="Doctor" value={doctorData?.doctorName || treatmentPlan?.doctorName} />
                        {doctorData?.qualification ? <LV label="Qualification" value={doctorData.qualification} /> : null}
                        {doctorData?.regNumber     ? <LV label="Reg. No."      value={doctorData.regNumber}     /> : null}
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

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <View style={S.footer}>
          <Text style={S.ftTx}>Generated: {today} · {clicniData?.name || "PhysioCare Clinic"}</Text>
          <Text style={S.ftTx}>This document is confidential and intended for medical use only.</Text>
        </View>

      </Page>
    </Document>
  );
};

export default PrescriptionPDF;