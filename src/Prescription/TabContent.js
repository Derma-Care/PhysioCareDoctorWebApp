import React from 'react'
import PrescriptionTab from './PrescriptionTab'
import SymptomsDiseases from './SymptomsDiseases'
import DoctorSymptoms from './DoctorSymptoms'
import TestsTreatments from './TestsTreatments'
import FollowUp from './FollowUp'
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
  let content = null

  switch (activeTab) {
    case 'Complaints':
      content = fromDoctorTemplate ? (
        <DoctorSymptoms
          seed={formData.symptoms || {}}
          onNext={onNext}
          sidebarWidth={260}
          patientData={patientData}
          setFormData={setFormData}
          formData={formData}
        />
      ) : (
        <SymptomsDiseases
          seed={formData.symptoms || {}}
          onNext={onNext}
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
          onNext={onNext}
          sidebarWidth={260}
          formData={formData}
        />
      )
      break

    case 'Diagnosis':
      content = (
        <PrescriptionTab
          seed={formData.diagnosis || {}}
          onNext={onNext}
          formData={formData}
        />
      )
      break

    case 'TreatmentPlan':
      content = (
        <TestsTreatments
          // ✅ FIXED: treatmentPlans is a top-level array, not formData.treatments
          seed={formData.treatmentPlans || []}
          onNext={onNext}
          formData={formData}
        />
      )
      break

    case 'TherapySessions':
      content = fromDoctorTemplate ? (
        <DoctorFollowUp
          seed={formData.therapySessions || {}}
          onNext={onNext}
          patientData={patientData}
          formData={formData}
          setFormData={setFormData}
        />
      ) : (
        <FollowUp
          seed={formData.therapySessions || {}}
          onNext={onNext}
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
          onNext={onNext}
          sidebarWidth={260}
        />
      )
      break

    case 'FollowUp':
      content = (
        <FollowUpnew
          // ✅ FIXED: followUp is now an array (set by FollowUpnew's handleNext)
          seed={Array.isArray(formData.followUp) ? formData.followUp : []}
          onNext={onNext}
          sidebarWidth={260}
        />
      )
      break

    case 'History':
      content = (
        <VisitHistory
          seed={formData.history || {}}
          onNext={onNext}
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
          onNext={onNext}
          onSaveTemplate={onSaveTemplate}
          patientData={patientData}
          formData={formData}
          setFormData={setFormData}
          sidebarWidth={260}
        />
      ) : (
        <Summary
          onNext={onNext}
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
          onSubmit={onNext}
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