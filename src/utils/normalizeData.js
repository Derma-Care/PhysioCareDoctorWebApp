/**
 * Normalizes the clinical record fetched from the backend (which uses API-specific keys)
 * into the internal shape used by the clinical documentation workflow components.
 */
export const normalizeSavedData = (saved) => {
  if (!saved || typeof saved !== 'object') return {}

  // 1. Map complaints -> symptoms
  const complaints = saved.complaints || {}

  // Group flat therapyAnswers array into category-keyed object if needed
  // Handle both 'theraphy' and 'therapy' spellings
  let therapyAnswersRaw = complaints.therapyAnswers || complaints.theraphyAnswers || saved.theraphyAnswers || saved.therapyAnswers || {}
  let theraphyAnswers = therapyAnswersRaw
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
    symptomDetails: complaints.complaintDetails || complaints.symptomDetails || '',
    duration: complaints.duration || '',
    selectedTherapy: complaints.selectedTherapy || '',
    selectedTherapyID: complaints.selectedTherapyId || complaints.selectedTherapyID || '',
    partImage: complaints.painAssessmentImage || '',
    attachmentImages: complaints.reportImages || [],
    theraphyAnswers: theraphyAnswers,
    patientPain: complaints.patientPain || complaints.reasonforVisit || complaints.reasonForVisit || complaints.reason || saved.reasonforVisit || saved.patientPain || '',
    previousInjuries: complaints.previousInjuries || '',
    currentMedications: complaints.currentMedications || '',
    allergies: complaints.allergies || '',
    occupation: complaints.occupation || '',
    insuranceProvider: complaints.insuranceProvider || '',
    activityLevels: complaints.activityLevels || [],
    parts: complaints.parts || saved.parts || complaints.selectedBodyPart || [],
  }

  // 2. Flatten nested assessment
  const assessmentRaw = saved.assessment || {}
  const sub = assessmentRaw.subjectiveAssessment || {}
  const fun = assessmentRaw.functionalAssessment || {}
  const phy = assessmentRaw.physicalExamination || {}

  const assessment = {
    // Subjective / DoctorSymptoms fields
    complaints: sub.chiefComplaint || assessmentRaw.chiefComplaint || assessmentRaw.complaints || symptoms.symptomDetails || '',
    doctorObs: sub.observations || assessmentRaw.observations || assessmentRaw.doctorObs || '',
    chiefComplaint: sub.chiefComplaint || assessmentRaw.chiefComplaint || symptoms.symptomDetails || '',
    painScale: sub.painScale || assessmentRaw.painScale || 0,
    painType: sub.painType || assessmentRaw.painType || '',
    duration: sub.duration || assessmentRaw.duration || symptoms.duration || '',
    onset: sub.onset || assessmentRaw.onset || '',
    aggravatingFactors: sub.aggravatingFactors || assessmentRaw.aggravatingFactors || '',
    relievingFactors: sub.relievingFactors || assessmentRaw.relievingFactors || '',
    observations: sub.observations || assessmentRaw.observations || '',
    posture: assessmentRaw.posture || '',
    rangeOfMotion: assessmentRaw.rangeOfMotion || '',
    specialTests: assessmentRaw.specialTests || '',
    attachments: assessmentRaw.attachments || [],

    // Functional
    difficultiesIn: Array.isArray(fun.difficultiesIn) ? fun.difficultiesIn : (fun.difficultiesIn ? [fun.difficultiesIn] : []),
    otherDifficulty: fun.otherDifficulty || assessmentRaw.otherDifficulty || '',
    dailyLivingAffected: fun.dailyLivingAffected || assessmentRaw.dailyLivingAffected || '',

    // Physical
    postureAssessment: Array.isArray(phy.postureAssessment) ? phy.postureAssessment : (Array.isArray(assessmentRaw.postureAssessment) ? assessmentRaw.postureAssessment : []),
    postureDeviations: phy.postureDeviations || assessmentRaw.postureDeviations || '',
    romStatus: Array.isArray(phy.rangeOfMotion) ? phy.rangeOfMotion : (Array.isArray(phy.romStatus) ? phy.romStatus : (Array.isArray(assessmentRaw.rangeOfMotion) ? assessmentRaw.rangeOfMotion : [])),
    romRestricted: phy.romRestricted || assessmentRaw.romRestricted || '',
    romJoints: phy.romJoints || assessmentRaw.romJoints || '',
    muscleStrength: Array.isArray(phy.muscleStrength) ? phy.muscleStrength : (Array.isArray(assessmentRaw.muscleStrength) ? assessmentRaw.muscleStrength : []),
    muscleWeakness: phy.muscleWeakness || assessmentRaw.muscleWeakness || '',
    neurologicalSigns: Array.isArray(phy.neurologicalSigns) ? phy.neurologicalSigns : (Array.isArray(assessmentRaw.neurologicalSigns) ? assessmentRaw.neurologicalSigns : []),

    // Condition-specific (nested in API, flat in UI)
    patientPain: symptoms.patientPain || saved.patientPain || '',

    // Chronic Pain
    painTriggers: assessmentRaw.chronicPainPatients?.painDuration || assessmentRaw.painTriggers || '',
    chronicRelieving: assessmentRaw.chronicPainPatients?.sleepDisturbance ? 'Sleep Disturbance: Yes' : (assessmentRaw.chronicRelieving || ''),

    // Sports Rehab
    typeOfSport: assessmentRaw.sportsRehabPatients?.sportName || assessmentRaw.typeOfSport || '',
    recurringInjuries: assessmentRaw.sportsRehabPatients?.injuryType || assessmentRaw.recurringInjuries || '',
    returnToSportGoals: assessmentRaw.returnToSportGoals || '',

    // Neuro Rehab
    neuroDiagnosis: assessmentRaw.neuroRehabPatients?.balanceIssue ? 'Balance Issues identified' : (assessmentRaw.neuroDiagnosis || ''),
    neuroOnset: assessmentRaw.neuroOnset || '',
    mobilityStatus: assessmentRaw.neuroRehabPatients?.walkingSupport || assessmentRaw.mobilityStatus || '',
    cognitiveStatus: assessmentRaw.cognitiveStatus || '',

    // ── Screening Fields (Missing in previous version) ───────────────────
    redFlags: assessmentRaw.redFlags || saved.redFlags || {},
    radiationNeuro: assessmentRaw.radiationNeuro || saved.radiationNeuro || {},
    psychosocial: assessmentRaw.psychosocial || saved.psychosocial || {},
    specialSymptoms: assessmentRaw.specialSymptoms || saved.specialSymptoms || {},
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
    differentialDiagnosis: diagRaw.differentialDiagnosis || '',
    diagnosisRows: diagRaw.diagnosisRows || [
      {
        physioDiagnosis: diagRaw.physioDiagnosis || '',
        affectedArea: diagRaw.affectedArea || '',
        severity: diagRaw.severity || '',
        stage: diagRaw.stage || '',
        differentialDiagnosis: diagRaw.differentialDiagnosis || '',
        notes: diagRaw.notes || '',
      }
    ]
  }

  // 4. Map therapySessions and treatmentPlan metadata
  const tp = saved.treatmentPlan || {}
  // Handle case where therapySessions is an object containing a 'sessions' array
  const sessions = saved.therapySessions?.sessions || (Array.isArray(saved.therapySessions) ? saved.therapySessions : [])

  const rawModalities = tp.modalitiesUsed || saved.therapySessions?.modalitiesUsed
  const rawPrecautions = tp.precautions || saved.therapySessions?.precautions

  const tId = tp.therapistId || saved.therapySessions?.therapistId || ''
  const tName = tp.therapistName || saved.therapySessions?.therapistName || ''
  const therapySessions = {
    sessions: sessions,
    therapistId: tId,
    therapistName: tName,
    therapists: Array.isArray(saved.therapySessions?.therapists)
      ? saved.therapySessions.therapists
      : (tId && tName ? [{ therapistId: tId, fullName: tName }] : []),
    therapistIds: Array.isArray(saved.therapySessions?.therapistIds)
      ? saved.therapySessions.therapistIds
      : (tId ? [tId] : []),
    therapistNames: Array.isArray(saved.therapySessions?.therapistNames)
      ? saved.therapySessions.therapistNames
      : (tName ? [tName] : []),
    manualTherapy: tp.manualTherapy || saved.therapySessions?.manualTherapy || '',
    modalitiesUsed: Array.isArray(rawModalities) ? rawModalities : (rawModalities ? [rawModalities] : []),
    patientResponse: tp.patientResponse || saved.therapySessions?.patientResponse || '',
    precautions: Array.isArray(rawPrecautions) ? rawPrecautions : (rawPrecautions ? [rawPrecautions] : []),
  }

  // 5. Exercise Plan
  const ep = saved.exercisePlan || {}
  const rawSupport = saved.recoverySupport || ep.recoverySupport || []
  const recoverySupportNormalized = Array.isArray(rawSupport) ? rawSupport : (rawSupport ? [rawSupport] : [])
  const exercisePlan = {
    homeAdvice: ep.homeAdvice || '',
    recoverySupport: recoverySupportNormalized,
    exercises: Array.isArray(ep.homeExercises) ? ep.homeExercises : (Array.isArray(ep.exercises) ? ep.exercises : []),
  }

  // 6. Investigation
  const invRaw = saved.investigation || {}
  const rawTests = invRaw.selectedTests || invRaw.tests
  const investigation = {
    ...invRaw,
    selectedTests: Array.isArray(rawTests) ? rawTests : (rawTests ? [rawTests] : []),
    notes: invRaw.notes || invRaw.reason || '',
  }

  const recordStatusNorm = (saved.status || '').toLowerCase().replace(/[\s_]/g, '')
  const isDueOrDone = ['dueforinvestigation', 'duetoinvestigation', 'investigationdone', 'doneforinvestigation'].includes(recordStatusNorm)

  return {
    ...saved,
    therapyRecordId: saved.therapistRecordId || saved.therapyRecordId || saved.id || saved._id || saved.therapyrecordid,
    id: saved.therapistRecordId || saved.therapyRecordId || saved.id || saved._id || saved.therapyrecordid,
    uptoInvestigation: isDueOrDone ? true : !!saved.uptoInvestigation,
    symptoms,
    assessment,
    diagnosis,
    therapySessions,
    exercisePlan,
    recoverySupport: recoverySupportNormalized,
    investigation,
    followUp: Array.isArray(saved.followUp) ? saved.followUp : (saved.followUp ? [saved.followUp] : []),
    history: saved.history || {},
    ClinicImages: saved.ClinicImages || {},
    summary: saved.summary || {},
    patientPain: symptoms.patientPain || saved.patientPain || '',
    redFlags: saved.assessment?.redFlags || saved.redFlags || {},
    radiationNeuro: saved.assessment?.radiationNeuro || saved.radiationNeuro || {},
    psychosocial: saved.assessment?.psychosocial || saved.psychosocial || {},
    specialSymptoms: saved.assessment?.specialSymptoms || saved.specialSymptoms || {},
  }
}
