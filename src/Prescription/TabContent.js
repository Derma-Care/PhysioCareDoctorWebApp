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
import Tests from './Tests'
import MultiImageUpload from './ClinicImages'
import { COLORS } from '../Themes'
import ReportDetails from '../components/Reports/Reports'
import ImageGallery from './RetiveImages'
import Investigations from './Tests'

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
    case 'Diagnosis':
      content = fromDoctorTemplate ? (
        <DoctorSymptoms seed={formData.symptoms || {}} onNext={onNext} sidebarWidth={260} patientData={patientData} setFormData={setFormData} formData={formData} />
      ) : (
        <SymptomsDiseases seed={formData.symptoms || {}} onNext={onNext} sidebarWidth={260} patientData={patientData} setFormData={setFormData} formData={formData} />
      )
      break

    case 'Investigations':
      content = <Investigations seed={formData.tests || {}} onNext={onNext} sidebarWidth={260} formData={formData} />
      break

    case 'Medication':
      content = <PrescriptionTab seed={formData.prescription || {}} onNext={onNext} formData={formData} />
      break

    case 'Procedures':
      content = <TestsTreatments seed={formData.treatments || {}} onNext={onNext} formData={formData} />
      break

    case 'Follow-up':
      content = fromDoctorTemplate ? (
        <DoctorFollowUp seed={formData.followUp || {}} onNext={onNext} patientData={patientData} formData={formData} setFormData={setFormData} />
      ) : (
        <FollowUp seed={formData.followUp || {}} onNext={onNext} patientData={patientData} formData={formData} setFormData={setFormData} />
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
        <DoctorSummary onNext={onNext} onSaveTemplate={onSaveTemplate} patientData={patientData} formData={formData} setFormData={setFormData} sidebarWidth={260} />
      ) : (
        <Summary onNext={onNext} onSaveTemplate={onSaveTemplate} patientData={patientData} formData={formData} sidebarWidth={260} />
      )
      break

    case 'Images':
      content = setImage ? (
        <MultiImageUpload data={formData} onSubmit={onNext} patientData={patientData} />
      ) : (
        <ImageGallery data={formData} patientData={patientData} />
      )
      break

    case 'Reports':
      content = <ReportDetails patientData={patientData} formData={formData} show={true} />
      break

    default:
      content = null
  }

  return <div style={{ marginTop: '3%', backgroundColor: COLORS.theme }}>{content}</div>
}

export default TabContent
