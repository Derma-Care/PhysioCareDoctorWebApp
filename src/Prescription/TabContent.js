import React from 'react'
import PrescriptionTab from './PrescriptionTab'
import SymptomsDiseases from './SymptomsDiseases'
import DoctorSymptoms from './DoctorSymptoms'
import FollowUp from './TherapySessions'
import DoctorFollowUp from './DoctorFollowUp'
import VisitHistory from './VisitHistory'
import Summary from './Summary'
import DoctorSummary from './DoctorSummary'
import MultiImageUpload from './ClinicImages'
import { COLORS } from '../Themes'
import ReportDetails from '../components/Reports/Reports'
import ImageGallery from './RetiveImages'
import Assessment from './Tests'

import FollowUpnew from './FollowUpnew'
import TherapySession from './TreatmentPlan'
import HomePlan from './ExercisePlan'
import Investigation from './Investigation'

/* ─────────────────────────────────────────────────────────────────────────
   Deep merge helper — keeps nested objects intact instead of overwriting
   them wholesale the way Object.assign / spread does.
───────────────────────────────────────────────────────────────────────── */
const deepMerge = (target, source) => {
  if (!source || typeof source !== 'object') return target
  const result = { ...target }
  Object.keys(source).forEach(key => {
    const srcVal = source[key]
    const tgtVal = target[key]
    if (
      srcVal !== null &&
      typeof srcVal === 'object' &&
      !Array.isArray(srcVal) &&
      tgtVal !== null &&
      typeof tgtVal === 'object' &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(tgtVal, srcVal)
    } else {
      result[key] = srcVal
    }
  })
  return result
}

const TabContent = ({
  activeTab,
  formData = {},
  onSaveTemplate,
  onNext,
  setActiveTab,
  patientData,
  setFormData,
  fromDoctorTemplate,
  setImage,
}) => {

  // ── KEY FIX ──────────────────────────────────────────────────────────────
  // Each tab sends a partial payload. This wrapper DEEP-merges it into
  // formData BEFORE calling the real onNext, so:
  //   1. Navigating back always shows the last-entered data.
  //   2. Nested fields (e.g. therapySessions._internalState) are NOT wiped.
  const handleNext = (payload) => {
    if (setFormData && payload && typeof payload === 'object') {
      setFormData(prev => deepMerge(prev, payload))
    }
    onNext?.(payload)
  }
  // ─────────────────────────────────────────────────────────────────────────

  let content = null

  switch (activeTab) {
    case 'Complaints':
      content = fromDoctorTemplate ? (
        <DoctorSymptoms
          seed={formData.symptoms || {}}
          onNext={handleNext}
          sidebarWidth={260}
          patientData={patientData}
          setFormData={setFormData}
          formData={formData}
        />
      ) : (
        <SymptomsDiseases
          seed={formData.symptoms || {}}
          onNext={handleNext}
          sidebarWidth={260}
          patientData={patientData}
          setFormData={setFormData}
          formData={formData}
        />
      )
      break

    case 'Assessment':
      content = (
        <Assessment
          seed={formData.assessment || {}}
          onNext={handleNext}
          sidebarWidth={260}
          formData={formData}
        />
      )
      break

    case 'Diagnosis':
      content = (
        <PrescriptionTab
          seed={{ diagnosis: formData.diagnosis || {} }}
          onNext={handleNext}
          formData={formData}
        />
      )
      break

    case 'Investigation':
      content = (
        <Investigation
          seed={formData.investigation || {}}
          onNext={handleNext}
          formData={formData}
          setFormData={setFormData}
        />
      )
      break

    case 'Plan':
      // KEY FIX: Pass the full therapySessions object as seed.
      // TherapySession reads seed.sessions[0] to restore mode / therapistId /
      // therapistId / modalitiesUsed / patientResponse / manualTherapy / precautions,
      // and calls restoreTherophyDataState(seed.sessions) to rebuild the
      // exercise table from the stored therapyData arrays — preserving every
      // set / rep / session / frequency edit the user made.
      content = fromDoctorTemplate ? (
        <DoctorFollowUp
          seed={formData.therapySessions || {}}
          onNext={handleNext}
          patientData={patientData}
          formData={formData}
          setFormData={setFormData}
        />
      ) : (
        <TherapySession
          seed={formData.therapySessions || {}}
          onNext={handleNext}
          patientData={patientData}
          formData={formData}
          setFormData={setFormData}
        />
      )
      break

    case 'HomePlan':
      content = (
        <HomePlan
          seed={formData.exercisePlan || {}}
          onNext={handleNext}
          sidebarWidth={260}
        />
      )
      break

    case 'FollowUp':
      content = (
        <FollowUpnew
          seed={Array.isArray(formData.followUp) ? formData.followUp : []}
          onNext={handleNext}
          sidebarWidth={260}
        />
      )
      break

    case 'History':
      content = (
        <VisitHistory
          seed={formData.history || {}}
          onNext={handleNext}
          patientId={patientData?.patientId || formData.patientId}
          doctorId={patientData?.doctorId || formData.doctorId}
          patientData={patientData}
          formData={formData}
        />
      )
      break

    case 'Prescription':
      content = fromDoctorTemplate ? (
        <DoctorSummary
          onNext={handleNext}
          onSaveTemplate={onSaveTemplate}
          patientData={patientData}
          formData={formData}
          setFormData={setFormData}
          sidebarWidth={260}
        />
      ) : (
        <Summary
          onNext={handleNext}
          onSaveTemplate={onSaveTemplate}
          patientData={patientData}
          formData={formData}
          sidebarWidth={260}
        />
      )
      break

    case 'Images':
      content = setImage ? (
        <MultiImageUpload
          data={formData}
          onSubmit={handleNext}
          patientData={patientData}
        />
      ) : (
        <ImageGallery
          data={formData}
          patientData={patientData}
        />
      )
      break

    case 'Reports':
      content = (
        <ReportDetails
          patientData={patientData}
          formData={formData}
          show={true}
        />
      )
      break

    default:
      content = null
  }

  return (
    <div style={{ marginTop: '3%', backgroundColor: COLORS.theme }}>
      {content}
    </div>
  )
}

export default TabContent