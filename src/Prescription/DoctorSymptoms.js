import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CForm,
} from '@coreui/react'
import './SymptomsDiseases.css'
import Button from '../components/CustomButton/CustomButton'
import Snackbar from '../components/Snackbar'
import { COLORS } from '../Themes'
import GradientTextCard from '../components/GradintColorText'
import { useToast } from '../utils/Toaster'
import { getDoctorSaveDetails, getAllDiseases, addDisease } from '../Auth/Auth'
import Select, { components } from 'react-select'
import { useDoctorContext } from '../Context/DoctorContext'
import SymptomsModal from '../components/DisaesModal'

const DoctorSymptoms = ({ seed = {}, onNext, sidebarWidth = 0, patientData, setFormData }) => {
  const [symptomDetails, setSymptomDetails] = useState(
    seed.symptomDetails ?? patientData?.problem ?? ''
  )
  const { setUpdateTemplate } = useDoctorContext()

  const [doctorObs, setDoctorObs] = useState(seed.doctorObs ?? '')
  const [diagnosis, setDiagnosis] = useState(seed.diagnosis ?? '')
  const [duration, setDuration] = useState(patientData?.symptomsDuration ?? '')
  const [attachments, setAttachments] = useState(
    Array.isArray(seed.attachments)
      ? seed.attachments
      : Array.isArray(patientData?.attachments)
        ? patientData.attachments
        : []
  )

  const [diseases, setDiseases] = useState([])
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })
  const [tplLoading, setTplLoading] = useState(false)

  const [probableSymptoms, setProbableSymptoms] = useState('')
  const [keyNotes, setKeyNotes] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const [templateData, setTemplateData] = useState({
    symptoms: '',
    tests: {},
    prescription: {},
    treatments: {},
    followUp: {},
    summary: {},
  })

  const [inputValue, setInputValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [hasTemplate, setHasTemplate] = useState(false)

  const { success, error, info } = useToast()

  // ✅ Fetch diseases once
  const fetchDiseases = async () => {
    try {
      const data = await getAllDiseases() || []
      const normalized = data.map(d => ({
        diseaseName: d.diseaseName || '',
        probableSymptoms: d.probableSymptoms || '',
        notes: d.notes || '',
        hospitalId: d.hospitalId,
      }))
      setDiseases(normalized)
    } catch (err) {
      console.error('❌ Failed to fetch diseases:', err)
    }
  }

  useEffect(() => {
    fetchDiseases()
  }, [])

  // ✅ Open Modal
  const openModal = () => {
    setModalOpen(true)
  }

  // Update probableSymptoms and keyNotes whenever diagnosis changes
  useEffect(() => {
    if (!diagnosis) {
      setProbableSymptoms('')
      setKeyNotes('')
      return
    }

    const matched = diseases.find(
      (d) => d.diseaseName && d.diseaseName.toLowerCase() === diagnosis.toLowerCase()
    )

    if (matched) {
      setProbableSymptoms(matched.probableSymptoms || '')
      setKeyNotes(matched.notes || '')
    } else {
      setProbableSymptoms('')
      setKeyNotes('')
    }
  }, [diagnosis, diseases])

  const mapTemplateToFormData = useMemo(
    () => (t = {}, dx) => {
      const symptomStr = typeof t.symptoms === 'string' ? t.symptoms : ''

      const selectedTests = Array.isArray(t?.tests?.selectedTests) ? t.tests.selectedTests : []
      const testReason = t?.tests?.testReason ?? ''

      const medicines = Array.isArray(t?.prescription?.medicines)
        ? t.prescription.medicines.map((m) => {
          const dur = m?.duration ? `${m.duration}`.trim() : "NA";
          const unit = m?.durationUnit ? m.durationUnit.trim() : "";

          // Pluralize if duration > 1
          const durationDisplay =
            dur !== "NA" && unit
              ? `${dur} ${Number(dur) > 1 ? `${unit}s` : unit}`
              : dur;

          return {
            id: m?.id ?? `tmp-${Date.now()}-${Math.random()}`,
            medicineType: m?.medicineType?.trim() || "NA",
            name: m?.name || "",
            dose: m?.dose || "",
            remindWhen: m?.remindWhen || "Once A Day",
            others: m?.others || "",
            duration: durationDisplay,
            food: m?.food || "",
            note: m?.note || "",
            times: Array.isArray(m?.times)
              ? m.times.map((t) => `${t}`.trim()).filter(Boolean)
              : m?.times && typeof m.times === "string"
                ? m.times.split(",").map((t) => t.trim()).filter(Boolean)
                : [],
          };
        })
        : [];

      const generatedData = t?.treatments?.generatedData ?? {}
      const selectedTestTreatments =
        t?.treatments?.selectedTestTreatments ?? t?.treatments?.selectedTreatment ?? []
      const treatmentReason = t?.treatments?.reason ?? ''

      const followUp = {
        durationValue: t?.followUp?.durationValue ?? '',
        durationUnit: t?.followUp?.durationUnit ?? '',
        nextFollowUpDate: t?.followUp?.nextFollowUpDate ?? '',
        followUpNote: t?.followUp?.followUpnote ?? t?.followUp?.followUpNote ?? '',
      }

      return {
        symptoms: {
          symptomDetails: symptomStr,
          doctorObs,
          diagnosis: dx,
          duration,
          attachments,
        },
        tests: {
          selectedTests,
          testReason,
        },
        prescription: {
          medicines,
        },
        treatments: {
          generatedData,
          selectedTestTreatments,
          treatmentReason,
        },
        followUp,
        summary: { diagnosis: dx },
      }
    },
    [doctorObs, duration, attachments]
  )

  const fetchTemplate = useCallback(async (dx) => {
    if (!dx) return
    setTplLoading(true)
    try {
      const res = await getDoctorSaveDetails(dx)
      const raw = res?.data ?? res
      const item = Array.isArray(raw) ? raw[0] : raw
      setTemplateData(item || {})
      setHasTemplate(!!item)
    } catch (e) {
      console.error(e)
      setHasTemplate(false)
    } finally {
      setTplLoading(false)
    }
  }, [])

  useEffect(() => {
    if (diagnosis && !hasTemplate) {
      fetchTemplate(diagnosis)
    }
  }, [diagnosis, hasTemplate, fetchTemplate])

  const handleDiagnosisChange = async (selected) => {
    const selectedValue = selected?.value ?? ''
    setDiagnosis(selectedValue)
    if (!selectedValue) {
      setHasTemplate(false)
      return
    }
    await fetchTemplate(selectedValue)
  }

  useEffect(() => {
    const dx = (seed?.diagnosis ?? diagnosis ?? '').trim()
    if (dx && !hasTemplate) {
      fetchTemplate(dx)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed?.diagnosis])

  const showSnackbar = (message, type) => {
    setSnackbar({ show: true, message, type })
    setTimeout(() => setSnackbar({ show: false, message: '', type: '' }), 3000)
  }

  const applyTemplate = (dx) => {
    const merged = mapTemplateToFormData(templateData, dx)

    setFormData((prev) => ({
      ...prev,
      ...merged,
      __templateApplied: { dx, at: Date.now() },
    }))
    setUpdateTemplate(true)
    success('Template applied successfully!', { title: 'Success' })

    const payload = {
      symptomDetails, doctorObs, diagnosis: dx, duration, attachments, prescription: merged.prescription,
      tests: merged.tests,
      treatments: merged.treatments,
      followUp: merged.followUp,
    }
    console.log("🚀 Final Payload:", payload) // debug log
    onNext?.(payload)
  }

  const options = useMemo(
    () =>
      Array.isArray(diseases) ? diseases.map((d) => ({ label: d.diseaseName, value: d.diseaseName })) : [],
    [diseases],
  )

  const canShowAdd =
    inputValue.trim() &&
    !options.some(
      (opt) =>
        (opt?.value || '').toLowerCase() === inputValue.trim().toLowerCase()
    )

  const handleAddClick = async () => {
    const name = inputValue.trim()
    const symptoms = probableSymptoms.trim()
    const notesText = keyNotes.trim()

    if (!name || adding) return

    try {
      setAdding(true)

      const created = await addDisease({
        diseaseName: name,
        probableSymptoms: symptoms,
        notes: notesText,
      })

      if (created) {
        success?.(`Saved "${name}" to diagnoses`, { title: 'Success' })
        setInputValue('')
        setProbableSymptoms('')
        setKeyNotes('')

        await fetchDiseases()
        setDiagnosis(name)
      } else {
        info?.(created?.message || "Could not add disease", { title: 'Info' })
      }
    } catch (e) {
      console.error(e)
      error?.('Could not add disease. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  const ClearInput = (props) => {
    return (
      <components.ClearIndicator {...props}>
        <span
          style={{ cursor: 'pointer', color: '#7e3a93', fontWeight: 'bold' }}
          onClick={() => props.clearValue()}
        >
          ✕
        </span>
      </components.ClearIndicator>
    )
  }

  const handleNext = () => {
    const payload = {
      symptomDetails,
      doctorObs,
      diagnosis,
      duration,
      attachments,
      prescription: templateData.prescription, // include current template medicines
      tests: templateData.tests,
      treatments: templateData.treatments,
      followUp: templateData.followUp,
    }
    console.log('🚀 Submitting payload:', payload)
    onNext?.(payload)
  }

  const canProceed = !!diagnosis && diagnosis.trim() !== ''

  return (
    <CCard className="border-1 bg-white mb-5" style={{ backgroundColor: 'transparent' }}>
      <CForm className="w-100 " style={{ borderRadius: '10px' }}>
        <CRow className="gx-0">
          <CCol lg={6}>
            <CCardBody>
              <div className="mb-0">
                <GradientTextCard text="Probable Disease" />

                <div className="mt-2 d-flex align-items-start gap-2">
                  <div className="flex-grow-1">
                    <Select
                      value={diagnosis ? { label: diagnosis, value: diagnosis } : null}
                      onChange={handleDiagnosisChange}
                      inputValue={inputValue}
                      onInputChange={(val, meta) => {
                        if (meta.action === 'input-change') setInputValue(val)
                      }}
                      options={options}
                      isClearable
                      components={{ ClearIndicator: ClearInput }}
                      placeholder="Select diagnosis..."
                      menuPlacement="bottom"
                      noOptionsMessage={() =>
                        inputValue
                          ? `No matches. Click Add to create "${inputValue}" as a diagnosis`
                          : 'Type to search...'
                      }
                      styles={{
                        input: (provided) => ({ ...provided, color: 'black' }),
                        singleValue: (provided) => ({ ...provided, color: 'black' }),
                        placeholder: (provided) => ({ ...provided, color: '#000' }),
                      }}
                    />
                  </div>

                  <div className="pt-1 d-flex gap-2">
                    <button
                      type="button"
                      disabled={!canShowAdd || adding}
                      onClick={openModal}
                      style={{
                        backgroundColor: !canShowAdd || adding ? "#a5c4d4ff" : "#7e3a93",
                        color: !canShowAdd || adding ? "#7e3a93" : "#fff",
                        cursor: !canShowAdd || adding ? "not-allowed" : "pointer",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        fontWeight: "600",
                        transition: "all 0.3s ease",
                      }}
                      title={canShowAdd ? "Add new disease" : "Type a new disease name"}
                    >
                      {adding ? "Adding…" : "Add"}
                    </button>
                    <button
                      type="button"
                      // onClick={handleAISuggest}
                      style={{
                        backgroundColor: "#a5c4d4ff",
                        color: "#7e3a93",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                      }}
                      title="AI Suggestion"
                    >
                      AI
                    </button>
                  </div>

                  <SymptomsModal
                    visible={modalOpen}
                    onClose={() => setModalOpen(false)}
                    addDisease={addDisease}
                    fetchDiseases={fetchDiseases}
                    setDiagnosis={setDiagnosis}
                    success={success}
                    info={info}
                    error={error}
                    defaultDiseaseName={inputValue}
                  />
                </div>
              </div>

              {diagnosis && probableSymptoms && (
                <div className="mt-3">
                  <div>
                    <strong>Category : </strong> <span>{probableSymptoms}</span>
                  </div>
                  <div className="mt-2">
                    <strong>Key Notes : </strong> <p>{keyNotes}</p>
                  </div>
                </div>
              )}
            </CCardBody>
          </CCol>
        </CRow>
      </CForm>

      <div
        className="position-fixed bottom-0 p-2"
        style={{
          right: 0,
          left: sidebarWidth || 'auto',
          zIndex: 1000,
          backgroundColor: COLORS.theme,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          customColor={COLORS.bgcolor}
          color={COLORS.black}
          style={{
            cursor: canProceed ? 'pointer' : 'not-allowed',
            opacity: canProceed ? 1 : 0.5,
          }}
        >
          Next
        </Button>
      </div>

      {snackbar.show && <Snackbar message={snackbar.message} type={snackbar.type} />}
    </CCard>
  )
}

export default DoctorSymptoms
