import React, { useState, useEffect } from 'react'
import './FollowUp.css'
import Button from '../components/CustomButton/CustomButton'
import { COLORS } from '../Themes'
import Snackbar from '../components/Snackbar'
import {
    CCard,
    CCardBody,
    CRow,
    CCol,
    CForm,
    CFormLabel,
    CFormInput,
    CFormSelect,
    CFormTextarea,
    CContainer,
    CCardHeader,
    CButton,
} from '@coreui/react'
import GradientTextCard from '../components/GradintColorText'

/**
 * Props:
 *  - onNext?: (data) => void
 *  - sidebarWidth?: number // if you have a fixed left sidebar
 */
const DoctorFollowUp = ({ seed = {}, onNext, sidebarWidth = 0, patientData }) => {
    const [patientName, setPatientName] = useState('')
    const [followUpNote, setFollowUpNote] = useState(seed.followUpNote ?? '')
    const [durationValue, setDurationValue] = useState(seed.durationValue ?? '')
    const [durationUnit, setDurationUnit] = useState('')
    const [nextFollowUpDate, setNextFollowUpDate] = useState('')
    const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })
    const [userTouched, setUserTouched] = useState(false)
    // Calculate next follow-up date when duration/unit changes
    useEffect(() => {
        if (!seed) return
        // backend sometimes uses followUpnote, or note
        const note = seed.followUpNote ?? seed.followUpnote ?? seed.note ?? ''

        setFollowUpNote(note)

        if (seed.durationValue !== undefined && seed.durationValue !== null) {
            setDurationValue(Number(seed.durationValue))
        }
        if (seed.durationUnit) {
            setDurationUnit(seed.durationUnit)
        }
        if (seed.nextFollowUpDate) {
            setNextFollowUpDate(seed.nextFollowUpDate)
            setUserTouched(false) // respect template date until user edits
        }
    }, [seed])

    // Calculate next follow-up date only if user edits OR we don't have a template date
    useEffect(() => {
        // Only calculate if user has entered a duration AND selected a unit
        if (!durationValue || !durationUnit) {
            setNextFollowUpDate('')
            return
        }

        const now = new Date()

        if (durationUnit === 'Weeks') {
            now.setDate(now.getDate() + durationValue * 7)
        } else if (durationUnit === 'Months') {
            const d = new Date(now)
            d.setMonth(d.getMonth() + durationValue)
            // handle month overflow (e.g., Jan 31 + 1 month)
            if (d.getDate() !== now.getDate()) {
                d.setDate(0)
            }
            now.setTime(d.getTime())
        } else {
            // Days
            now.setDate(now.getDate() + durationValue)
        }

        const day = String(now.getDate()).padStart(2, '0')
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const year = now.getFullYear()

        setNextFollowUpDate(`${day}-${month}-${year}`)
    }, [durationValue, durationUnit])

    const handleNext = () => {
        const payload = {
            durationValue,
            durationUnit,
            nextFollowUpDate,
            followUpNote,
        }
        console.log(payload)
        onNext?.(payload)
    }
    const showSnackbar = (message, type) => {
        setSnackbar({ show: true, message, type })
        setTimeout(() => setSnackbar({ show: false, message: '', type: '' }), 3000)
    }

    return (
        <div className="follow-up-wrapper pb-5">
            <CContainer fluid className="p-0">
                <CCard className="shadow-sm">
                    <CCardBody>
                        <CForm>
                            {/* Row: Patient Name & Duration */}
                            <CRow className="g-3">

                                <CCol xs={12} md={5}>
                                    <GradientTextCard text="Follow Up Duration" />

                                    <div className="d-flex gap-2">
                                        <CFormInput
                                            type="number"
                                            value={durationValue}
                                            onChange={(e) => setDurationValue(Number(e.target.value))}
                                            placeholder="Select Duration in Days"
                                            min={0}
                                        />
                                        <CFormSelect
                                            value={durationUnit}
                                            onChange={(e) => setDurationUnit(e.target.value)}
                                        >
                                            <option value="" >
                                                Select Duration Unit
                                            </option>
                                            <option value="Days">Days</option>
                                            <option value="Weeks">Weeks</option>
                                            <option value="Months">Months</option>
                                        </CFormSelect>

                                    </div>

                                    {/* Next follow-up date */}
                                    <p className="mb-0 mt-1" style={{ fontSize: 14 }}>
                                        Next Follow Up Date: <span style={{ fontWeight: 600 }}>{nextFollowUpDate}</span>
                                    </p>
                                </CCol>
                            </CRow>

                            {/* Notes */}
                            <CRow className="g-3 mt-1">
                                <CCol xs={12}>
                                    <GradientTextCard text="Follow Up Notes (Optional)" />

                                    <CFormTextarea
                                        className="mt-2"
                                        rows={4}
                                        value={followUpNote}
                                        onChange={(e) => setFollowUpNote(e.target.value)}
                                        placeholder="Any special instructions…"
                                    />
                                </CCol>
                            </CRow>
                        </CForm>
                    </CCardBody>
                </CCard>
            </CContainer>

            {/* Sticky bottom bar (single, full width; offset by sidebar if provided) */}
            <div
                className="position-fixed bottom-0"
                style={{
                    left: 0,
                    right: 0,
                    backgroundColor: '#F3f3f7',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 16,
                    padding: 8,
                }}
            >
                <div className="d-flex gap-3">
                    <Button customColor={COLORS.bgcolor} // background color of button
                        color={COLORS.black} onClick={handleNext}>
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default DoctorFollowUp
