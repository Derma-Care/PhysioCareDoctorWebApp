import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

// ─────────────────────────────────────────────────────────────────────────────
//  COLOR PALETTE
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  navy: '#1B4F8A',
  navyDark: '#163f70',
  orange: '#f9c571',
  white: '#ffffff',
  gray50: '#f8f9fa',
  gray100: '#f0f4f8',
  gray200: '#e5ecf3',
  gray300: '#b0c1d4',
  gray400: '#7a94b0',
  gray500: '#5a7592',
  gray600: '#3d5a75',
  gray700: '#2a3f55',
  borderGray: '#d0d7e0',
}

// ─────────────────────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: C.white,
    fontFamily: 'Helvetica',
  },

  // ── HEADER ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px 24px',
    borderBottomWidth: 2,
    borderBottomColor: C.navy,
  },

  headerLeft: {
    flex: 1,
  },

  headerRight: {
    textAlign: 'right',
    alignItems: 'flex-end',
  },

  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: C.navy,
    marginBottom: 4,
    letterSpacing: 0.5,
  },

  clinicLocation: {
    fontSize: 8,
    color: C.gray600,
    marginBottom: 2,
    lineHeight: 1.4,
  },

  clinicContact: {
    fontSize: 8,
    color: C.gray600,
    marginBottom: 1,
  },

  dateBox: {
    alignItems: 'flex-end',
    marginTop: 2,
  },

  dateLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: C.navy,
    marginBottom: 2,
  },

  dateValue: {
    fontSize: 9,
    color: C.gray700,
  },

  timeValue: {
    fontSize: 9,
    color: C.gray700,
  },

  // ── CONTENT ──
  content: {
    padding: '20px 24px',
    flex: 1,
  },

  // ── SECTION DIVIDER ──
  sectionDivider: {
    borderBottomWidth: 2,
    borderBottomColor: C.navy,
    marginVertical: 12,
  },

  // ── SECTION TITLE ──
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: C.navy,
    marginVertical: 10,
    letterSpacing: 0.8,
  },

  // ── INFO GRID ──
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 40,
  },

  infoCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.gray200,
    borderRadius: 4,
    padding: '12px 14px',
    backgroundColor: C.gray50,
  },

  infoCellTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: C.navy,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  infoLabel: {
    fontSize: 7.5,
    color: C.gray600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    width: 65,
    fontWeight: 500,
  },

  infoValue: {
    fontSize: 8.5,
    color: C.gray700,
    fontWeight: 600,
    flex: 1,
  },

  infoMainValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: C.navy,
    marginBottom: 6,
  },

  // ── TESTS LIST ──
  testBox: {
    backgroundColor: C.gray50,
    border: '1px solid ' + C.gray200,
    borderRadius: 4,
    padding: '12px 14px',
    marginBottom: 12,
  },

  testItem: {
    fontSize: 9,
    color: C.gray700,
    marginBottom: 5,
    lineHeight: 1.5,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  testBullet: {
    color: C.navy,
    fontWeight: 'bold',
    marginRight: 8,
    width: 12,
  },

  testText: {
    flex: 1,
  },

  // ── NOTES BOX ──
  notesBox: {
    backgroundColor: C.gray50,
    borderWidth: 1,
    borderColor: C.gray200,
    borderRadius: 4,
    padding: '12px 14px',
    marginBottom: 12,
  },

  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: C.navy,
    marginBottom: 6,
    letterSpacing: 0.5,
  },

  notesText: {
    fontSize: 8.5,
    color: C.gray700,
    lineHeight: 1.6,
    textAlign: 'justify',
  },

  // ── FOOTER ──
  footer: {
    borderTopWidth: 1,
    borderTopColor: C.borderGray,
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 24,
    textAlign: 'center',
  },

  footerMessage: {
    fontSize: 11,
    fontWeight: 'bold',
    color: C.navy,
    marginBottom: 6,
  },

  footerNote: {
    fontSize: 8,
    color: C.gray600,
    marginBottom: 8,
    lineHeight: 1.5,
  },

  footerEnd: {
    fontSize: 9,
    fontWeight: '600',
    color: C.navy,
  },
})

// ─────────────────────────────────────────────────────────────────────────────
//  HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
const formatDate = () => {
  const now = new Date()
  return now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const formatTime = () => {
  const now = new Date()
  return now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const capitalizeEachWord = (str) => {
  if (!str) return ''
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const hv = (v) => v != null && String(v).trim() !== '' && String(v) !== 'NA'

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const InvestigationPDF = ({ formData, patientData, doctorData, clicniData }) => {
  // Extract investigation data
  const investigation = formData?.investigation || {}
  const tests = Array.isArray(investigation.tests)
    ? investigation.tests.filter((t) => hv(t))
    : []
  const reason = investigation.reason || investigation.notes || ''

  // Patient info
  const patientName =
    patientData?.patientName ||
    patientData?.name ||
    patientData?.fullName ||
    'Patient'
  const patientId =
    patientData?.patientId || formData?.patientInfo?.patientId || ''
  const mobileNumber =
    patientData?.mobileNumber ||
    patientData?.phone ||
    patientData?.contactNumber ||
    patientData?.phoneNumber ||
    ''

  // Booking info
  const bookingId =
    formData?.bookingId || patientData?.bookingId || ''
  const doctorName =
    doctorData?.name ||
    doctorData?.fullName ||
    doctorData?.doctorName ||
    ''

  // Clinic info
  const clinicName = clicniData?.name || 'PhysioElite'
  const clinicAddress = clicniData?.address || ''
  const clinicPhone = clicniData?.phone || ''
  const clinicEmail = clicniData?.email || ''

  const currentDate = formatDate()
  const currentTime = formatTime()

  // Booking date
  let bookingDate = currentDate
  if (patientData?.appointmentDate) {
    const date = new Date(patientData.appointmentDate)
    bookingDate = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.clinicName}>{clinicName}</Text>
            {hv(clinicAddress) && (
              <Text style={styles.clinicLocation}>📍 {clinicAddress}</Text>
            )}
            <View style={{ flexDirection: 'row', marginTop: 3 }}>
              {hv(clinicPhone) && (
                <Text style={[styles.clinicContact, { marginRight: 12 }]}>
                  📞 {clinicPhone}
                </Text>
              )}
              {hv(clinicEmail) && (
                <Text style={styles.clinicContact}>📧 {clinicEmail}</Text>
              )}
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Date: {currentDate}</Text>
              <Text style={styles.timeValue}>Time: {currentTime}</Text>
            </View>
          </View>
        </View>

        {/* ── CONTENT ── */}
        <View style={styles.content}>
          {/* ── PATIENT & BOOKING INFO ── */}
          <View style={styles.infoGrid}>
            {/* Patient */}
            <View style={styles.infoCell}>
              <Text style={styles.infoCellTitle}>PATIENT</Text>
              <Text style={styles.infoMainValue}>
                {capitalizeEachWord(patientName)}
              </Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Patient ID:</Text>
                <Text style={styles.infoValue}>{patientId || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mobile:</Text>
                <Text style={styles.infoValue}>{mobileNumber || '—'}</Text>
              </View>
            </View>

            {/* Booking */}
            <View style={styles.infoCell}>
              <Text style={styles.infoCellTitle}>BOOKING</Text>
              <Text style={styles.infoMainValue}>
                #{bookingId ? bookingId.toString().slice(-8).toUpperCase() : '—'}
              </Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Doctor:</Text>
                <Text style={styles.infoValue}>{doctorName || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoValue}>{bookingDate}</Text>
              </View>
            </View>
          </View>

          {/* ── RECOMMENDED TESTS SECTION ── */}
          {tests.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>RECOMMENDED TESTS</Text>
              <View style={styles.testBox}>
                {tests.map((test, index) => (
                  <View key={index} style={styles.testItem}>
                    <Text style={styles.testBullet}>•</Text>
                    <Text style={styles.testText}>{test}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── NOTE / REASON ── */}
          {hv(reason) && (
            <>
              <Text style={styles.sectionTitle}>
                NOTE / REASON FOR RECOMMENDATION
              </Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesTitle}>Clinical Notes</Text>
                <Text style={styles.notesText}>{reason}</Text>
              </View>
            </>
          )}

          {/* ── FOOTER ── */}
          <View style={styles.footer}>
            <Text style={styles.footerMessage}>Thank you for choosing us!</Text>
            <Text style={styles.footerNote}>
              This is a computer-generated statement and does not require a
              signature.
            </Text>
            <Text style={styles.footerEnd}>Thank You. Visit Again!</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export default InvestigationPDF
