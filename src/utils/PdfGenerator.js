// src/components/PrescriptionPDF.jsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { capitalizeEachWord, capitalizeFirst } from "./CaptalZeWord";


const styles = StyleSheet.create({
  // Page
  page: {
    padding: 32,
    fontSize: 11, // base size
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between", // pushes left + right blocks
    alignItems: "flex-start", // align top
    marginBottom: 24,
    borderBottom: "2px solid #444",
    paddingBottom: 12,
  },
  leftBlock: {
    flexDirection: "row",
    flex: 1,
    alignItems: "flex-start",
  },
  logo: { width: 60, height: 60, marginRight: 12 },
  patientInfoBlock: { flex: 1, marginLeft: 12 },
  doctorInfoBlock: {
    maxWidth: "40%", // keep it aligned right
    textAlign: "right", // align text to right
  },

  patientName: {
    fontWeight: "bold",
  },

  hospitalDetail: {
    fontSize: 14,
    color: "#444",
    marginVertical: 2,
    flexDirection: "row",
    alignItems: "center",
  },

  patientInfo: {
    fontSize: 10,
    marginBottom: 2,
    flexWrap: "wrap",       // ✅ allow wrapping
    maxWidth: "100%",       // ✅ prevent overflow
    wordBreak: "break-word" // ✅ break long words (like URLs)
  },
  hospitalInfo: {
    flex: 1,

    marginLeft: 20,   // moves whole block right
    paddingLeft: 5,
  },
  hospitalName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
    flexWrap: "wrap",   // ✅ wrap long names
    flexShrink: 1,      // ✅ shrink text if needed
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
    flexWrap: "wrap",   // ✅ allows multiple lines
  },
  label: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#444"   // 👈 dark gray (dim black)
  },
  value: {
    fontSize: 10,
    flexShrink: 1,
    flexWrap: "wrap",   // ✅ wrap onto next line
    color: "#222"       // optional: make values slightly lighter than pure black too
  },
  hospitalInfoText: {
    fontSize: 10,
    marginBottom: 2,
    flexWrap: "wrap",
    maxWidth: "90%",   // or a fixed number like 250–300
  },
  // Section
  section: { marginBottom: 22 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2563eb",
    borderBottom: "1px solid #ddd",
    paddingBottom: 4,
  },
  subText: { fontSize: 10, fontWeight: "bold", color: "#2563eb" },

  // Key-Value rows
  kvRow: { flexDirection: "row", marginBottom: 6 },
  kvLabel: { width: 120, fontWeight: "bold", color: "#111827" },
  kvValue: { flex: 1, color: "#374151", fontSize: 10 },

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e0f2fe",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottom: "1px solid #ccc",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottom: "1px solid #eee",
  },
  cell: { fontSize: 9, paddingRight: 4 },
  center: { textAlign: "center" },
  zebra: { backgroundColor: "#f9fafb" },

  // Notes / Text blocks
  note: { fontSize: 10, marginTop: 4, color: "#374151", lineHeight: 1.5 },
  testName: { fontWeight: "bold", color: "#111827", fontSize: 10 },

  gridRow: {
    flexDirection: "row",
    borderBottom: "1px solid #ccc",
  },
  gridCell: {
    paddingVertical: 5,
    paddingHorizontal: 3,
    borderRight: "1px solid #ccc",
    fontSize: 9,
  },
  wrapText: {
    flexWrap: "wrap",
    flexShrink: 1,
  },
  // Signature
  signatureBlock: {
    marginTop: 32,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signBox: { alignItems: "center" },
});


const COLS = [
  { key: "sno", label: "S.No", w: "6%", align: "center" },
  { key: "medicineType", label: "Type", w: "12%" },
  { key: "name", label: "Medicine", w: "20%" },
  { key: "dose", label: "Dosage", w: "10%" },
  { key: "duration", label: "Duration", w: "12%" },
  { key: "frequency", label: "Frequency", w: "12%" },
  { key: "food", label: "Instructions", w: "10%" },
  { key: "note", label: "Note", w: "10%" },
  { key: "times", label: "Timings", w: "8%", align: "center" },
];

const PrescriptionPDF = ({
  logoSrc,
  doctorData,
  clicniData,
  formData,
  patientData,
}) => {
  const symptomsDetails = formData?.symptoms?.symptomDetails ?? formData?.symptoms?.doctorObs ?? '—'
  const symptomsDuration = formData?.symptoms?.duration ?? patientData?.duration ?? '—'

  const tests = Array.isArray(formData?.tests?.selectedTests) ? formData.tests.selectedTests : []
  const testsReason = formData?.tests?.testReason ? formData.tests.testReason : ''

  const treatments = Array.isArray(formData?.treatments?.selectedTestTreatments)
    ? formData.treatments.selectedTestTreatments
    : [];

  const treatmentReason = formData?.treatments?.treatmentReason
    ? formData.treatments.treatmentReason
    : ''
  const treatmentSchedules = formData?.treatments?.generatedData || {}
  const meds = Array.isArray(formData?.prescription?.medicines)
    ? formData.prescription.medicines
    : [];
  const followUp = {
    durationValue: Number(formData?.followUp?.durationValue) || 0,
    durationUnit: formData?.followUp?.durationUnit || "",
    date: formData?.followUp?.nextFollowUpDate || "",
    note: formData?.followUp?.followUpNote || "",
  };
  const freqLabel = (f) =>
    f === 'day' ? 'Daily' : f === 'week' ? 'Weekly' : f === 'month' ? 'Monthly' : f || '—'

const hospitalLogo = clicniData?.hospitalLogo
  ? `data:image/jpeg;base64,${clicniData.hospitalLogo}`
  : logoSrc;

  const cleanAddress = (clicniData?.address ?? "—")
    .split(",")                // split by comma
    .map((part) => part.trim()) // trim spaces
    .filter(Boolean)            // remove empty parts
    .join(", ");
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Left side - Logo + Hospital info */}
          <View style={styles.leftBlock}>
           <Image style={styles.logo} src={hospitalLogo} />
            <View style={styles.hospitalInfo}>
              {/* Name */}
              <Text style={styles.hospitalName}>
                {clicniData?.name ?? "—"}
              </Text>

              {/* Address */}
              <Text style={styles.hospitalInfoText}>Address:{cleanAddress}</Text>

              {/* Branch */}
              {clicniData?.branch && (
                <Text style={styles.hospitalInfoText}>Branch: {clicniData.branch}</Text>
              )}

              {/* Contact */}
              {clicniData?.contactNumber && (
                <Text style={styles.hospitalInfoText}>Contact: {clicniData.contactNumber}</Text>
              )}

              {/* Website */}
              {clicniData?.website && (
                <Text style={styles.hospitalInfoText}>Website: {clicniData.website}</Text>
              )}
            </View>
          </View>


        </View>
        {/* Patient Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Details</Text>

          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Patient Name: </Text>
            {capitalizeEachWord(patientData?.name ?? "—")}
          </Text>

          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Age / Gender: </Text>
            {patientData?.age
              ? (patientData.age.toString().toLowerCase().includes("yr") ||
                patientData.age.toString().toLowerCase().includes("year")
                ? patientData.age
                : `${patientData.age} yrs`)
              : "—"}
            / {patientData?.gender ?? "—"}

          </Text>

          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Mobile number: </Text>
            {patientData?.mobileNumber ?? "—"}
          </Text>

          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Address: </Text>
            {patientData?.patientAddress ?? "—"}
          </Text>
        </View>

        {/* Symptoms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms & Diagnosis</Text>
          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Patient Provided Symptoms: </Text>
            {symptomsDetails}
          </Text>
          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Probable Disease: </Text>
            {formData?.symptoms?.diagnosis ?? "NA"}
          </Text>
          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Duration of Symptoms: </Text>
            {symptomsDuration}
          </Text>
          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Doctor Observations: </Text>
            {formData?.symptoms?.doctorObs ?? "NA"}
          </Text>
        </View>

        {/* Medicines */}
        {meds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prescribed Medicines</Text>

            {/* Table Header */}
            <View style={[styles.gridRow, { backgroundColor: "#e0f2fe" }]}>
              {COLS.map((c) => (
                <View
                  key={c.key}
                  style={[styles.gridCell, { width: c.w, borderBottom: "1px solid #333" }]}
                >
                  <Text style={[styles.center, { fontWeight: "bold" }]}>{c.label}</Text>
                </View>
              ))}
            </View>

            {/* Table Rows */}
            {meds.map((med, i) => (
              <View
                key={i}
                style={[
                  styles.gridRow,
                  i % 2 === 0 ? { backgroundColor: "#f9fafb" } : null,
                ]}
              >
                <View style={[styles.gridCell, { width: COLS[0].w }]}>
                  <Text style={styles.center}>{i + 1}</Text>
                </View>
                <View style={[styles.gridCell, { width: COLS[1].w }]}>
                  <Text>{med?.medicineType ?? "NA"}</Text>
                </View>
                <View style={[styles.gridCell, { width: COLS[2].w }]}>
                  <Text>{med?.name ?? "NA"}</Text>
                </View>
                <View style={[styles.gridCell, { width: COLS[3].w }]}>
                  <Text>{med?.dose ?? "NA"}</Text>
                </View>
                <View style={[styles.gridCell, { width: COLS[4].w }]}>
                  <Text>
                    {med?.duration
                      ? `${med.duration} ${med.durationUnit ?
                        med.duration === "1"
                          ? med.durationUnit
                          : med.durationUnit.endsWith("s")
                            ? med.durationUnit
                            : med.durationUnit + "s"
                        : ""}`
                      : "NA"}
                  </Text>
                </View>

                <View style={[styles.gridCell, { width: COLS[5].w }]}>
                  <Text>{med?.remindWhen ?? "NA"}</Text>
                </View>
                <View style={[styles.gridCell, { width: COLS[6].w }]}>
                  <Text>{med?.food ?? "NA"}</Text>
                </View>
                <View
                  style={[
                    styles.gridCell,
                    { width: COLS[7].w, flexShrink: 1 } // ensure it can shrink
                  ]}
                >
                  <Text
                    numberOfLines={0}   // allows unlimited lines
                    style={{ flexWrap: "wrap" }}
                  >
                    {med?.note ?? "NA"}
                  </Text>
                </View>

                <View style={[styles.gridCell, { width: COLS[8].w }]}>
                  <Text style={styles.center}>
                    {Array.isArray(med?.times) && med.times.length > 0
                      ? med.times
                        .map((t) => {
                          const map = {
                            morning: "M",
                            afternoon: "A",
                            evening: "E",
                            night: "N",
                          };
                          return map[t.toLowerCase()] || t;
                        })
                        .join(", ")
                      : "NA"}
                  </Text>
                </View>
              </View>
            ))}

            {/* Legend */}
            <Text style={{ marginTop: 6, color: '#777' }}>
              Legend:{" "}
              <Text style={{ fontWeight: "normal", color: '#777' }}>
                M – Morning, A – Afternoon, E – Evening, N – Night
              </Text>
            </Text>

          </View>
        )}

        {/* Tests */}
        {/* Tests */}
        {(tests.length > 0 || testsReason) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Investigations</Text>

            {/* Selected Tests */}
            {tests.length > 0 ? (
              tests.map((t, i) => (
                <Text key={`test-${i}`} style={styles.note}>
                  <Text style={{ fontWeight: "bold" }}>Recommended Test (Optional): </Text>
                  {typeof t === 'string' ? t : t?.name ?? '—'}
                </Text>
              ))
            ) : (
              <Text style={styles.note}>
                <Text style={{ fontWeight: "bold" }}>Recommended Test (Optional): </Text>
                NA
              </Text>
            )}

            {/* Test Reason */}
            {testsReason && (
              <Text style={styles.note}>
                <Text style={{ fontWeight: "bold" }}>Reason:</Text>
                {testsReason}
              </Text>

            )}
          </View>
        )}


        {/* Treatments */}
        {treatments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Treatment Plan</Text>
            {treatments.map((t, i) => (
              <Text key={`treat-${i}`} style={styles.note}>
                <Text style={{ fontWeight: "bold" }}>Selected Treatments: </Text>
                <Text style={{ fontWeight: "normal" }}>
                  {typeof t === "string" ? t : t?.name ?? "—"}
                </Text>
              </Text>
            ))}

            {treatmentReason && (
              <View style={{ marginTop: 4 }}>
                <Text style={styles.subText}>Reason:</Text>
                <Text style={styles.note}>{treatmentReason}</Text>
              </View>
            )}
          </View>
        )}
        {/* Treatment Schedules */}
        {treatmentSchedules && Object.keys(treatmentSchedules).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Treatment Schedule</Text>

            {Object.entries(treatmentSchedules).map(([name, meta]) => (
              <View key={name} style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                  {name} — {freqLabel(meta?.frequency)} ({meta?.sittings ?? 0} sittings from {meta?.startDate ?? "—"})
                </Text>

                {/* Table Header */}
                <View style={[styles.gridRow, { backgroundColor: "#e0f2fe", borderTopLeftRadius: 4, borderTopRightRadius: 4 }]}>
                  <View style={[styles.gridCell, { width: "8%" }]}><Text style={[styles.center, { fontWeight: "bold" }]}>S.No</Text></View>
                  <View style={[styles.gridCell, { width: "46%" }]}><Text style={[styles.center, { fontWeight: "bold" }]}>Date</Text></View>
                  <View style={[styles.gridCell, { width: "46%" }]}><Text style={[styles.center, { fontWeight: "bold" }]}>Sitting</Text></View>
                </View>

                {/* Table Rows */}
                {(meta?.dates || []).map((d, i) => (
                  <View
                    key={`${name}-row-${i}`}
                    style={[
                      styles.gridRow,
                      i % 2 === 0 ? { backgroundColor: "#f9fafb" } : null,
                    ]}
                  >
                    <View style={[styles.gridCell, { width: "8%" }]}><Text style={styles.center}>{i + 1}</Text></View>
                    <View style={[styles.gridCell, { width: "46%" }]}><Text style={styles.center}>{d?.date ?? "—"}</Text></View>
                    <View style={[styles.gridCell, { width: "46%" }]}><Text style={styles.center}>{d?.sitting ?? "—"}</Text></View>
                  </View>
                ))}

                {meta?.reason && (
                  <Text style={{ marginTop: 4 }}>
                    <Text style={{ fontWeight: "bold" }}>Reason: </Text>{meta.reason}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}


        {/* Follow-up */}
        {(followUp.durationValue > 0 || followUp.date || followUp.note) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Follow-up Plan</Text>
            <Text style={styles.note}>
              <Text style={{ fontWeight: "bold" }}>Next Follow Up: </Text>
              {followUp.durationValue > 0 && followUp.durationUnit
                ? `After ${followUp.durationValue} ${followUp.durationUnit}`
                : "—"}
              {followUp.date ? ` (${followUp.date})` : ""}
            </Text>
            {followUp.note && (
              <Text style={styles.note}>
                <Text style={{ fontWeight: "bold" }}>Note: </Text>
                {followUp.note}
              </Text>
            )}
          </View>
        )}

        {/* Signature */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {/* Doctor Info - Left */}
          <View style={styles.DoctorInfoBlock}>
            <Text style={styles.patientName}> Doctor Name: {doctorData?.doctorName ?? "—"}
            </Text>
            <Text style={styles.patientInfo}> Specialization: {doctorData?.qualification ?? ""}{" "}
              {doctorData?.specialization ?? ""} </Text>
            <Text style={[styles.patientInfo, { flexWrap: "wrap" }]}> Address: {patientData?.patientAddress ?? "—"} </Text>
            <Text style={styles.patientInfo}> Licence: {doctorData?.doctorLicence ?? "—"} </Text>
          </View> {/* Doctor Signature - Right */}
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              {doctorData?.doctorSignature ? (
                <Image source={{ uri: doctorData.doctorSignature }}
                  style={{ width: 100, height: 50, marginBottom: 5 }} />) : (
                <Text>No Signature Available</Text>)}
              <Text style={styles.signatureLabel}>Doctor's Signature</Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  );
};

export default PrescriptionPDF;