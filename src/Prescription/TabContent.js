import React from 'react'
import PrescriptionTab from './PrescriptionTab'
import SymptomsDiseases from './SymptomsDiseases'
import DoctorSymptoms from './DoctorSymptoms'
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

/* ─── deepMerge ──────────────────────────────────────────────────────────── */
const deepMerge = (target, source) => {
  if (!source || typeof source !== 'object') return target
  const result = { ...target }
  Object.keys(source).forEach(key => {
    const srcVal = source[key]
    const tgtVal = target[key]
    if (
      srcVal !== null && typeof srcVal === 'object' && !Array.isArray(srcVal) &&
      tgtVal !== null && typeof tgtVal === 'object' && !Array.isArray(tgtVal)
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

  /* ── handleNext ────────────────────────────────────────────────────────────
     Immediately deep-merges the tab's partial payload into formData so that:
     1. If the user navigates BACK, the restored seed already has their edits.
     2. The parent's onNextMap handler then does its own mergeAndLog — which
        is also safe because deepMerge is idempotent.

     IMPORTANT: For the Plan tab, TherapySession calls onNext with:
       { therapySessions: [...], therapistId, therapistName, ... }
     We must NOT wrap this payload in another layer here.
     The parent's Plan handler wraps it into { therapySessions: { sessions, ... } }.
  ─────────────────────────────────────────────────────────────────────────── */
  const handleNext = (payload) => {
    if (setFormData && payload && typeof payload === 'object') {
      // For Plan tab: payload has therapySessions as an ARRAY
      // We pre-merge it so returning to Plan shows saved data.
      // We use the same shape the parent uses: { therapySessions: { sessions: [...], ... } }
      if (activeTab === 'Plan') {
        const planPatch = {
          therapySessions: {
            sessions:        Array.isArray(payload.therapySessions) ? payload.therapySessions : [],
            therapistId:     payload.therapistId    ?? '',
            therapistName:   payload.therapistName  ?? '',
            manualTherapy:   payload.manualTherapy  ?? '',
            precautions:     payload.precautions    ?? [],
            modalitiesUsed:  payload.modalitiesUsed ?? [],
            patientResponse: payload.patientResponse ?? '',
          },
        }
        setFormData(prev => deepMerge(prev, planPatch))
      } else {
        setFormData(prev => deepMerge(prev, payload))
      }
    }
    onNext?.(payload)
  }

  let content = null

  switch (activeTab) {
    case 'Complaints':
      content = fromDoctorTemplate ? (
        <DoctorSymptoms seed={formData.symptoms || {}} onNext={handleNext} sidebarWidth={260} patientData={patientData} setFormData={setFormData} formData={formData} />
      ) : (
        <SymptomsDiseases seed={formData.symptoms || {}} onNext={handleNext} sidebarWidth={260} patientData={patientData} setFormData={setFormData} formData={formData} />
      )
      break

    case 'Assessment':
      content = <Assessment seed={formData.assessment || {}} onNext={handleNext} sidebarWidth={260} formData={formData} />
      break

    case 'Diagnosis':
      content = <PrescriptionTab seed={{ diagnosis: formData.diagnosis || {} }} onNext={handleNext} formData={formData} />
      break

    case 'Investigation':
      content = <Investigation seed={formData.investigation || {}} onNext={handleNext} formData={formData} setFormData={setFormData} />
      break

    case 'Plan':
      /* ── KEY FIX: pass formData.therapySessions as seed ──────────────────
         TherapySession reads:
           seed.sessions[0].serviceType  → restores mode
           seed.therapistId / therapistName → restores therapist
           restoreTherophyDataState(seed.sessions) → rebuilds exercise table
         This ensures all edits survive tab navigation.
      ────────────────────────────────────────────────────────────────────── */
      content = fromDoctorTemplate ? (
        <DoctorFollowUp seed={formData.therapySessions || {}} onNext={handleNext} patientData={patientData} formData={formData} setFormData={setFormData} />
      ) : (
        <TherapySession seed={formData.therapySessions || {}} onNext={handleNext} patientData={patientData} formData={formData} setFormData={setFormData} />
      )
      break

    case 'HomePlan':
      content = <HomePlan seed={formData.exercisePlan || {}} onNext={handleNext} sidebarWidth={260} />
      break

    case 'FollowUp':
      content = <FollowUpnew seed={Array.isArray(formData.followUp) ? formData.followUp : []} onNext={handleNext} sidebarWidth={260} />
      break

    case 'History':
      content = <VisitHistory seed={formData.history || {}} onNext={handleNext} patientId={patientData?.patientId || formData.patientId} doctorId={patientData?.doctorId || formData.doctorId} patientData={patientData} formData={formData} />
      break

    case 'Prescription':
      content = fromDoctorTemplate ? (
        <DoctorSummary onNext={handleNext} onSaveTemplate={onSaveTemplate} patientData={patientData} formData={formData} setFormData={setFormData} sidebarWidth={260} />
      ) : (
        <Summary onNext={handleNext} onSaveTemplate={onSaveTemplate} patientData={patientData} formData={formData} sidebarWidth={260} />
      )
      break

    case 'Images':
      content = setImage ? (
        <MultiImageUpload data={formData} onSubmit={handleNext} patientData={patientData} />
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

  return (
    <div style={{ marginTop: '3%', backgroundColor: COLORS.theme }}>
      {content}
    </div>
  )
}

export default TabContent