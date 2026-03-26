import React, { useEffect, useState } from 'react'
import {
  CAlert,
  CAccordion,
  CAccordionBody,
  CAccordionHeader,
  CAccordionItem,
  CCol,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CRow,
  CContainer,
} from '@coreui/react'
import Select from 'react-select'
import GradientTextCard from '../components/GradintColorText'
import Button from '../components/CustomButton/CustomButton'
import { COLORS } from '../Themes'
import { addTreatmentByHospital, getAllTreatments, getAllTreatmentsByHospital, getTreatmentStatusByVisitId } from '../../src/Auth/Auth'
import CIcon from '@coreui/icons-react'
import { cilTrash } from '@coreui/icons'
import './TestsTreatments.css'
import CreatableSelect from 'react-select/creatable';

const DEFAULT_CFG = { frequency: 'day', sittings: 1, startDate: '', reason: '' }

const TestTreatments = ({ seed = {}, onNext, formData }) => {
  const [selectedTestTreatments, setSelectedTestTreatments] = useState(
    seed.selectedTestTreatments ?? [],
  )
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })
  const [activeIdx, setActiveIdx] = useState(-1)
  const [validationErrors, setValidationErrors] = useState({})
  const [selectedTreatmentOption, setSelectedTreatmentOption] = useState(
    formData?.symptoms?.diagnosis
      ? { label: formData.symptoms.diagnosis, value: formData.symptoms.diagnosis }
      : null
  )

  const [treatmentConfigs, setTreatmentConfigs] = useState(
    (seed.selectedTestTreatments || []).reduce((acc, t) => {
      acc[t] = { ...DEFAULT_CFG }
      return acc
    }, {}),
  )

  const [generatedData, setGeneratedData] = useState(
    seed.generatedData && typeof seed.generatedData === 'object' ? seed.generatedData : {},
  )

  const [treatmentReason, setTreatmentReason] = useState(seed.treatmentReason ?? '')
  const [initializedFromSeed, setInitializedFromSeed] = useState(false)
  const [availableTreatments, setAvailableTreatments] = useState([])

  const showSnackbar = (message, type = 'info') => {
    setSnackbar({ show: true, message, type })
    setTimeout(() => setSnackbar({ show: false, message: '', type: '' }), 3000)
  }

  const hasPendingCards = selectedTestTreatments.some((t) => !generatedData[t])
  const hasAnyTable = Object.keys(generatedData).length > 0

  // -------------------- FETCH TREATMENTS --------------------
  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const treatments = await getAllTreatmentsByHospital()
        if (Array.isArray(treatments)) setAvailableTreatments(treatments)
      } catch (error) {
        console.error('Error fetching treatments:', error)
      }
    }
    fetchTreatments()
  }, [])

  // -------------------- AUTO ADD RECOMMENDED TREATMENT --------------------
  useEffect(() => {
    if (
      formData?.symptoms?.diagnosis &&
      !selectedTestTreatments.includes(formData.symptoms.diagnosis) &&
      !generatedData[formData.symptoms.diagnosis]
    ) {
      const diag = formData.symptoms.diagnosis
      setSelectedTestTreatments((prev) => [...prev, diag])
      setTreatmentConfigs((prev) => ({
        ...prev,
        [diag]: { ...DEFAULT_CFG },
      }))
    }
  }, [formData, selectedTestTreatments, generatedData])

  // -------------------- INITIALIZE FROM SEED --------------------
  useEffect(() => {
    if (initializedFromSeed) return

    const fromSeedList = Array.isArray(seed.selectedTestTreatments)
      ? seed.selectedTestTreatments
      : []
    const fromTables =
      seed.generatedData && typeof seed.generatedData === 'object'
        ? Object.keys(seed.generatedData)
        : []

    const merged = Array.from(new Set([...fromSeedList, ...fromTables]))

    setSelectedTestTreatments(merged)
    setGeneratedData(
      seed.generatedData && typeof seed.generatedData === 'object' ? seed.generatedData : {},
    )

    setTreatmentConfigs((prev) => {
      const next = { ...prev }
      merged.forEach((name) => {
        if (!next[name]) next[name] = { ...DEFAULT_CFG }
      })
      return next
    })

    setTreatmentReason(seed.treatmentReason ?? '')
    setInitializedFromSeed(true)
  }, [seed, initializedFromSeed])

  // -------------------- DROPDOWN LOGIC --------------------
  // 🔹 Show ONLY the recommended treatment in dropdown (hide others)
  const diagnosisName = formData?.symptoms?.diagnosis || ''
  const optionsToShow = diagnosisName
    ? [diagnosisName] // only recommended one
    : availableTreatments.map((t) => t.treatmentName)

  // -------------------- ADD / REMOVE --------------------
  const addTreatment = (value) => {
    if (!value) return
    if (selectedTestTreatments.includes(value)) {
      showSnackbar('Treatment already added', 'warning')
      return
    }
    setSelectedTestTreatments((prev) => [...prev, value])
    setTreatmentConfigs((prev) => ({ ...prev, [value]: { ...DEFAULT_CFG } }))
  }

  const handleAddTreatment = (eOrObj) => {
    const value = eOrObj?.target?.value
    addTreatment(value)
  }

  const removeTreatment = (t) => {
    setSelectedTestTreatments((prev) => prev.filter((x) => x !== t))
    setTreatmentConfigs((prev) => {
      const next = { ...prev }
      delete next[t]
      return next
    })
    setGeneratedData((prev) => {
      const next = { ...prev }
      delete next[t]
      return next
    })
    setSelectedTreatmentOption(null)
  }

  // -------------------- UPDATE CONFIG --------------------
  const updateCfg = (t, field, value) => {
    setTreatmentConfigs((prev) => {
      const newCfg = {
        ...prev,
        [t]: {
          ...prev[t],
          [field]: field === 'sittings' ? Number(value || 0) : value,
        },
      }

      const errors = []
      const cfg = newCfg[t]

      if (!cfg.startDate) errors.push('Start date is required')
      else {
        const today = new Date()
        const selected = new Date(cfg.startDate)
        today.setHours(0, 0, 0, 0)
        selected.setHours(0, 0, 0, 0)
        if (selected < today) errors.push('Start date cannot be in the past')
      }

      if (!cfg.sittings || cfg.sittings < 1) errors.push('Sittings must be at least 1')

      setValidationErrors((prevErrors) => {
        const next = { ...prevErrors }
        if (errors.length > 0) next[t] = errors.join('. ')
        else delete next[t]
        return next
      })

      return newCfg
    })
  }

  // -------------------- GENERATE SCHEDULE --------------------
  const generateForTreatment = async (t) => {
    const cfg = treatmentConfigs[t] || DEFAULT_CFG
    const { frequency, sittings, startDate, reason } = cfg

    if (!startDate || !sittings || sittings < 1) {
      showSnackbar(`Please fill start date and sittings for "${t}"`, 'danger')
      return
    }

    const start = new Date(startDate)
    const dates = Array.from({ length: sittings }, (_, i) => {
      const next = new Date(start)
      if (frequency === 'day') next.setDate(start.getDate() + i)
      if (frequency === 'week') next.setDate(start.getDate() + i * 7)
      if (frequency === 'month') next.setMonth(start.getMonth() + i)
      return { date: next.toISOString().split('T')[0], sitting: i + 1 }
    })

    const newGeneratedData = {
      ...generatedData,
      [t]: { frequency, sittings, startDate, reason, dates, bookingId: formData.bookingId },
    }

    setGeneratedData(newGeneratedData)
    setTreatmentConfigs((prev) => ({ ...prev, [t]: { ...DEFAULT_CFG } }))

    await updateTreatmentStatuses(newGeneratedData)
  }

  // -------------------- UPDATE STATUSES --------------------
  const updateTreatmentStatuses = async (dataToUpdate) => {
    try {
      const updatedData = { ...dataToUpdate }

      for (const treatment of Object.keys(updatedData)) {
        const meta = updatedData[treatment]
        if (!meta.bookingId) continue

        const statusData = await getTreatmentStatusByVisitId(formData.patientId, meta.bookingId)

        if (Array.isArray(meta.dates)) {
          updatedData[treatment].dates = meta.dates.map((d) => {
            const matched = statusData.find((s) => s.date === d.date)
            return { ...d, status: matched?.status || 'Pending' }
          })
        }
      }

      setGeneratedData(updatedData)
    } catch (error) {
      showSnackbar('Failed to update treatment statuses', 'error')
      console.error(error)
    }
  }

  // -------------------- DELETE SCHEDULE --------------------
  const deleteSchedule = (t) => {
    setGeneratedData((prev) => {
      const next = { ...prev }
      delete next[t]
      return next
    })
    setSelectedTestTreatments((prev) => prev.filter((x) => x !== t))
    setTreatmentConfigs((prev) => {
      const next = { ...prev }
      delete next[t]
      return next
    })
    showSnackbar(`Removed "${t}"`, 'info')
  }

  // -------------------- HANDLE NEXT --------------------
  const handleNext = () => {
    const payload = {
      selectedTestTreatments,
      generatedData,
    }
    console.log(payload)
    onNext?.(payload)
  }

  // -------------------- PAST DATES CHECK --------------------
  const hasPastDates = Object.values(generatedData).some((meta) =>
    meta.dates?.some((d) => new Date(d.date) < new Date(new Date().setHours(0, 0, 0, 0))),
  )

  const editSchedule = (treatment) => {
  const meta = generatedData[treatment]
  setTreatmentConfigs((prev) => ({
    ...prev,
    [treatment]: {
      frequency: meta.frequency,
      sittings: meta.sittings,
      startDate: meta.startDate,
      reason: meta.reason,
    },
  }))
  setGeneratedData((prev) => {
    const next = { ...prev }
    delete next[treatment]
    return next
  })
  showSnackbar(`Editing schedule for "${treatment}"`, "info")
}

  return (
    <div className="pb-5 treatment-wrapper">
      {snackbar.show && (
        <CAlert color={snackbar.type === 'error' ? 'danger' : snackbar.type} className="mb-3">
          {snackbar.message}
        </CAlert>
      )}

      <CContainer fluid className='p-1'>
        <CRow className="g-3">
          {/* Add Treatments */}
          <CCol md={12} className="g-3" >
            <CFormLabel>
              <GradientTextCard text="Recommended Treatments" />
            </CFormLabel>
            <CreatableSelect
              options={availableTreatments.map((t) => ({ label: t.treatmentName, value: t.treatmentName }))}
              placeholder="Select or add treatments..."
              value={selectedTreatmentOption}
              isClearable
              isSearchable
              formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
              onChange={(selected) => {
                if (!selected) {
                  setSelectedTreatmentOption(null)
                  return
                }

                const pending = selectedTestTreatments.some(t => !generatedData[t])
                if (pending) {
                  showSnackbar("You must generate the schedule for existing treatments before adding a new one.", "error")
                  setSelectedTreatmentOption(null)
                  return
                }

                const value = selected.value
                if (!selectedTestTreatments.includes(value)) {
                  setSelectedTestTreatments((prev) => [...prev, value])
                  setTreatmentConfigs((prev) => ({ ...prev, [value]: { ...DEFAULT_CFG } }))
                }

                setSelectedTreatmentOption(null)
              }}
              onCreateOption={async (inputValue) => {
                if (!inputValue) return

                // ✅ Check for pending tables
                const pending = selectedTestTreatments.some(t => !generatedData[t])
                if (pending) {
                  showSnackbar("Please generate tables for all selected treatments before adding a new one.", "error")
                  setSelectedTreatmentOption(null)
                  return
                }

                const addedTreatment = await addTreatmentByHospital(inputValue)
                setAvailableTreatments((prev) => [...prev, { treatmentName: addedTreatment }])
                setSelectedTestTreatments((prev) => [...prev, addedTreatment])
                setTreatmentConfigs((prev) => ({ ...prev, [addedTreatment]: { ...DEFAULT_CFG } }))
                setSelectedTreatmentOption(null)
                showSnackbar(`Added new treatment: ${addedTreatment}`, 'success')
              }}
            />


          </CCol>

          {/* Selected Treatments + Per-treatment inputs (hide card if table exists) */}
          <CCol md={12}>
            <CFormLabel>
              <GradientTextCard text="Selected Treatments" />
            </CFormLabel>

            {selectedTestTreatments.length === 0 ? (
              <div className="text-muted">No treatments selected.</div>
            ) : (
              <CCol xl={12} md={12} className="d-flex flex-column gap-3 w-100">
                {selectedTestTreatments.map((t) => {
                  // If a table exists for this treatment, don't show its input card
                  if (generatedData[t]) return null

                  const cfg = treatmentConfigs[t] || DEFAULT_CFG
                  return (
                    <div
                      key={t}
                      className="p-3 border rounded bg-light"
                      style={{ display: 'grid', gap: 12 }}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <strong>{t}</strong>
                        <button
                          className="btn btn-sm btn-link text-danger"
                          onClick={() => removeTreatment(t)}
                        >
                          <CIcon icon={cilTrash} />
                        </button>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-3">
                          <GradientTextCard text="Frequency" />
                          <CFormSelect
                            value={cfg.frequency}
                            onChange={(e) => updateCfg(t, 'frequency', e.target.value)}
                          >
                            <option value="day">Daily</option>
                            <option value="week">Weekly</option>
                            <option value="month">Monthly</option>
                          </CFormSelect>
                        </div>

                        <div className="col-md-3">
                          <GradientTextCard text="Sittings" />
                          <input
                            type="number"
                            className="form-control"
                            min={1}
                            value={cfg.sittings}
                            onChange={(e) => updateCfg(t, 'sittings', e.target.value)}
                          />
                        </div>

                        <div className="col-md-3">
                          <GradientTextCard text="Start Date" />
                          <input
                            type="date"
                            className="form-control"
                            value={cfg.startDate}
                            min={new Date().toISOString().split("T")[0]} // disables past dates in calendar picker
                            onChange={(e) => updateCfg(t, "startDate", e.target.value)}
                          />
                          {/* Display validation error for this treatment */}
                          {validationErrors[t] && validationErrors[t].includes("Start date") && (
                            <div className="text-danger mt-1">
                              {validationErrors[t]}
                            </div>
                          )}
                        </div>
                        <div className="col-md-12">
                          <GradientTextCard text="Reason (for this treatment)" />
                          <CFormTextarea
                            rows={2}
                            value={cfg.reason}
                            onChange={(e) => updateCfg(t, 'reason', e.target.value)}
                            placeholder={`Why is "${t}" recommended?`}
                          />
                        </div>
                      </div>

                      <div className="mt-2">
                        <Button
                          onClick={() => generateForTreatment(t)}
                          type="button"
                          size="small"
                          variant="outline"
                          sx={{
                            backgroundColor: COLORS.bgcolor,
                            color: COLORS.black,
                            border: "2px solid #000", // add border here
                          }}
                        >
                          Generate Table for {t}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CCol>
            )}
          </CCol>

          {/* Generated tables */}``
          {Object.keys(generatedData).length > 0 && (
            <CCol md={12} className="mt-4">
              <GradientTextCard text="Treatment Schedule" />

              <CAccordion activeItemKey={activeIdx}>
                {Object.entries(generatedData).map(([treatment, meta], idx) => (
                  <CAccordionItem itemKey={idx} key={treatment}>
                    <CAccordionHeader
                      onClick={(e) => {
                        // keep exactly one open; to allow closing the same one, use the toggle line below
                        e.preventDefault()
                        setActiveIdx(idx)

                        // If you want toggle behavior (clicking the open one closes it), use this instead:
                        // setActiveIdx(prev => (prev === idx ? -1 : idx));
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between w-100">
                        <span>
                          {treatment} —{' '}
                          {meta.frequency === 'day'
                            ? 'Daily'
                            : meta.frequency === 'week'
                              ? 'Weekly'
                              : 'Monthly'}{' '}
                          ({meta?.sittings ?? 0} sittings from{' '}
                          {meta?.startDate ?? '—'})
                        </span>

                        <div className="d-flex align-items-center">
                          <span
                            role="button"
                            tabIndex={0}
                            className="btn btn-sm btn-outline-secondary mx-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              editSchedule(treatment)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                e.stopPropagation()
                                editSchedule(treatment)
                              }
                            }}
                            aria-label="Edit this table"
                          >
                            Edit
                          </span>

                          <span
                            role="button"
                            tabIndex={0}
                            className="btn btn-sm btn-outline-danger mx-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              deleteSchedule(treatment)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                e.stopPropagation()
                                deleteSchedule(treatment)
                              }
                            }}
                            aria-label="Delete this table"
                          >
                            Delete
                          </span>
                        </div>
                      </div>
                    </CAccordionHeader>

                    <CAccordionBody>
                      {meta.reason && (
                        <div className="mb-3">
                          <strong>Reason:</strong> {meta.reason}
                        </div>
                      )}
                      <table className="table table-bordered">
                        <thead>
                          <tr style={{ textAlign: "center" }}>
                            <th>S.No</th>
                            <th>Date</th>
                            <th>Sitting</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meta.dates.map(({ date, sitting, status }, i) => (
                            <tr key={i} style={{ textAlign: "center" }}>
                              <td>{i + 1}</td>
                              <td>{date}</td>
                              <td>{sitting}</td>
                              <td>
                                <span className={`badge ${status === 'Pending' ? 'bg-warning' : 'bg-success'}`}>
                                  {status || 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CAccordionBody>
                    {hasPastDates && (
                      <div className="text-danger my-2">
                        ⚠ Some dates in the treatment table are in the past. Please correct them before proceeding.
                      </div>
                    )}
                  </CAccordionItem>
                ))}
              </CAccordion>
            </CCol>
          )}
        </CRow>
      </CContainer>

      <div
        className="position-fixed bottom-0"
        style={{
          left: 0,
          right: 0,
          backgroundColor: '#f3f4f7',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 16,
          padding: 8,
          zIndex: 999,
        }}
      >
      
        <Button
          customColor={COLORS.bgcolor}
          color={COLORS.black}
          disabled={hasPendingCards || hasPastDates} // disabled if any past date exists
          onClick={handleNext}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default TestTreatments
