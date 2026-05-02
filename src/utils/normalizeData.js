/**
 * Normalizes the clinical record fetched from the backend (which uses API-specific keys)
 * into the internal shape used by the clinical documentation workflow components.
 */
export const normalizeSavedData = (saved) => {
  if (!saved || typeof saved !== 'object') return {}

  // 1. Map complaints -> symptoms
  const complaints = saved.complaints || {}
  
  // Group flat therapyAnswers array into category-keyed object if needed
  let theraphyAnswers = complaints.therapyAnswers || {}
  if (Array.isArray(theraphyAnswers)) {
    const grouped = {}
    theraphyAnswers.forEach(q => {
      const cat = q.questionKey || 'General'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(q)
    })
    theraphyAnswers = grouped
  }

  const symptoms = {
    symptomDetails: complaints.complaintDetails || '',
    duration: complaints.duration || '',
    selectedTherapy: complaints.selectedTherapy || '',
    selectedTherapyID: complaints.selectedTherapyId || complaints.selectedTherapyID || '',
    partImage: complaints.painAssessmentImage || '',
    attachmentImages: complaints.reportImages || [],
    theraphyAnswers: theraphyAnswers,
    patientPain: complaints.patientPain || '',
    previousInjuries: complaints.previousInjuries || '',
    currentMedications: complaints.currentMedications || '',
    allergies: complaints.allergies || '',
    occupation: complaints.occupation || '',
    insuranceProvider: complaints.insuranceProvider || '',
    activityLevels: complaints.activityLevels || [],
  }

  // 2. Flatten nested assessment
  const assessmentRaw = saved.assessment || {}
  const sub = assessmentRaw.subjectiveAssessment || {}
  const fun = assessmentRaw.functionalAssessment || {}
  const phy = assessmentRaw.physicalExamination || {}
  
  const assessment = {
    // Subjective / DoctorSymptoms fields
    complaints: sub.chiefComplaint || assessmentRaw.chiefComplaint || assessmentRaw.complaints || '',
    doctorObs: sub.observations || assessmentRaw.observations || assessmentRaw.doctorObs || '',
    chiefComplaint: sub.chiefComplaint || assessmentRaw.chiefComplaint || '',
    painScale: sub.painScale || assessmentRaw.painScale || 0,
    painType: sub.painType || assessmentRaw.painType || '',
    duration: sub.duration || assessmentRaw.duration || '',
    onset: sub.onset || assessmentRaw.onset || '',
    aggravatingFactors: sub.aggravatingFactors || assessmentRaw.aggravatingFactors || '',
    relievingFactors: sub.relievingFactors || assessmentRaw.relievingFactors || '',
    observations: sub.observations || assessmentRaw.observations || '',
    attachments: assessmentRaw.attachments || [],
    
    // Functional
    difficultiesIn: fun.difficultiesIn || assessmentRaw.difficultiesIn || [],
    otherDifficulty: fun.otherDifficulty || assessmentRaw.otherDifficulty || '',
    dailyLivingAffected: fun.dailyLivingAffected || assessmentRaw.dailyLivingAffected || '',
    
    // Physical
    postureAssessment: phy.postureAssessment || assessmentRaw.postureAssessment || [],
    postureDeviations: phy.postureDeviations || assessmentRaw.postureDeviations || '',
    romStatus: phy.rangeOfMotion || phy.romStatus || assessmentRaw.romStatus || [],
    romRestricted: phy.romRestricted || assessmentRaw.romRestricted || '',
    romJoints: phy.romJoints || assessmentRaw.romJoints || '',
    muscleStrength: phy.muscleStrength || assessmentRaw.muscleStrength || [],
    muscleWeakness: phy.muscleWeakness || assessmentRaw.muscleWeakness || '',
    neurologicalSigns: phy.neurologicalSigns || assessmentRaw.neurologicalSigns || [],
    
    // Condition-specific (nested in API, flat in UI)
    painTriggers: saved.assessment?.chronicPainPatients?.painTriggers || assessmentRaw.painTriggers || '',
    chronicRelieving: saved.assessment?.chronicPainPatients?.relievingFactors || assessmentRaw.chronicRelieving || '',
    typeOfSport: saved.assessment?.sportsRehabPatients?.typeOfSport || assessmentRaw.typeOfSport || '',
    recurringInjuries: saved.assessment?.sportsRehabPatients?.recurringInjuries || assessmentRaw.recurringInjuries || '',
    returnToSportGoals: saved.assessment?.sportsRehabPatients?.returnToSportGoals || assessmentRaw.returnToSportGoals || '',
    neuroDiagnosis: saved.assessment?.neuroRehabPatients?.neuroDiagnosis || assessmentRaw.neuroDiagnosis || '',
    neuroOnset: saved.assessment?.neuroRehabPatients?.neuroOnset || assessmentRaw.neuroOnset || '',
    mobilityStatus: saved.assessment?.neuroRehabPatients?.mobilityStatus || assessmentRaw.mobilityStatus || '',
    cognitiveStatus: saved.assessment?.neuroRehabPatients?.cognitiveStatus || assessmentRaw.cognitiveStatus || '',
  }

  // 3. Map diagnosis
  const diagRaw = saved.diagnosis || {}
  const diagnosis = {
    // Provide both flat fields for PrescriptionTab and diagnosisRows for other uses
    physioDiagnosis: diagRaw.physioDiagnosis || '',
    affectedArea: diagRaw.affectedArea || '',
    severity: diagRaw.severity || '',
    stage: diagRaw.stage || '',
    notes: diagRaw.notes || '',
    diagnosisRows: diagRaw.diagnosisRows || [
      {
        physioDiagnosis: diagRaw.physioDiagnosis || '',
        affectedArea: diagRaw.affectedArea || '',
        severity: diagRaw.severity || '',
        stage: diagRaw.stage || '',
        notes: diagRaw.notes || '',
      }
    ]
  }

  // 4. Map therapySessions and treatmentPlan metadata
  const tp = saved.treatmentPlan || {}
  const therapySessions = {
    sessions: saved.therapySessions || [],
    therapistId: tp.therapistId || '',
    therapistName: tp.therapistName || '',
    manualTherapy: tp.manualTherapy || '',
    modalitiesUsed: tp.modalitiesUsed || [],
    patientResponse: tp.patientResponse || '',
    precautions: tp.precautions || [],
  }

  // 5. Exercise Plan
  const ep = saved.exercisePlan || {}
  const exercisePlan = {
    homeAdvice: ep.homeAdvice || '',
    exercises: ep.homeExercises || ep.exercises || [],
  }

  // 6. Investigation
  const invRaw = saved.investigation || {}
  const investigation = {
    ...invRaw,
    selectedTests: invRaw.selectedTests || invRaw.tests || [],
    notes: invRaw.notes || invRaw.reason || '',
  }

  return {
    ...saved,
    symptoms,
    assessment,
    diagnosis,
    therapySessions,
    exercisePlan,
    investigation,
    followUp: Array.isArray(saved.followUp) ? saved.followUp : (saved.followUp ? [saved.followUp] : []),
    history: saved.history || {},
    ClinicImages: saved.ClinicImages || {},
    summary: saved.summary || {},
    patientPain: symptoms.patientPain || saved.patientPain || '',
  }
}
