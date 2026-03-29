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
import { capitalizeEachWord } from "./CaptalZeWord";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#2563eb",
  },
  note: { fontSize: 10, marginBottom: 4 },
  image: { width: 100, height: 100, marginTop: 6 },
});

const PrescriptionPDF = ({ doctorData, clicniData, formData, patientData }) => {
  // ✅ SAFE EXTRACTION
  const complaints = formData?.complaints ?? {};

  const therapyAnswers = complaints?.therapyAnswers ?? {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* ================= HEADER ================= */}
        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>
            {clicniData?.name || "Clinic"}
          </Text>
        </View>

        {/* ================= PATIENT ================= */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Details</Text>

          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Name: </Text>
            {capitalizeEachWord(patientData?.name || "—")}
          </Text>

          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Age / Gender: </Text>
            {patientData?.age || "—"} / {patientData?.gender || "—"}
          </Text>

          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Mobile: </Text>
            {patientData?.mobileNumber || "—"}
          </Text>
        </View>

        {/* ================= COMPLAINTS ================= */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Complaints</Text>

          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Complaint: </Text>
            {complaints?.complaintDetails || "—"}
          </Text>

          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Duration: </Text>
            {complaints?.duration || "—"}
          </Text>

          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Selected Therapy: </Text>
            {complaints?.selectedTherapy || "—"}
          </Text>

          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Therapy ID: </Text>
            {complaints?.selectedTherapyID || "—"}
          </Text>
        </View>

        {/* ================= BODY PART IMAGE ================= */}
        {complaints?.painAssessmentImage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pain Assessment Image</Text>
            <Image
              src={complaints.painAssessmentImage}
              style={styles.image}
            />
          </View>
        )}

        {/* ================= REPORT IMAGES ================= */}
        {Array.isArray(complaints?.reportImages) &&
          complaints.reportImages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Report Images</Text>

              {complaints.reportImages.map((img, i) => (
                <Image key={i} src={img} style={styles.image} />
              ))}
            </View>
          )}

        {/* ================= THERAPY ANSWERS ================= */}
        {Object.keys(therapyAnswers).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Therapy Questionnaire</Text>

            {Object.entries(therapyAnswers).map(([category, questions]) => (
              <View key={category} style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: "bold" }}>{category}</Text>

                {Array.isArray(questions) &&
                  questions.map((q, i) => (
                    <Text key={i} style={styles.note}>
                      • {q.question} : {q.answer}
                    </Text>
                  ))}
              </View>
            ))}
          </View>
        )}

        {/* ================= DOCTOR ================= */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doctor</Text>

          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Name: </Text>
            {doctorData?.doctorName || "—"}
          </Text>

          <Text style={styles.note}>
            <Text style={{ fontWeight: "bold" }}>Qualification: </Text>
            {doctorData?.qualification || "—"}
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export default PrescriptionPDF;