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
import ExercisePlan from './ExercisePlan'
import FollowUpnew from './FollowUpnew'
import TherapySession from './TreatmentPlan'

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
  // Each tab sends a partial payload. This wrapper merges it into formData
  // BEFORE calling the real onNext, so navigating back always shows the data.
  const handleNext = (payload) => {
    if (setFormData) {
      setFormData(prev => ({ ...prev, ...payload }))
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

    case 'TherapySessions':
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

    case 'ExercisePlan':
      content = (
        <ExercisePlan
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