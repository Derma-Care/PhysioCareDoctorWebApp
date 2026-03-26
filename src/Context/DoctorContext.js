// DoctorProvider.tsx / .jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const DoctorContext = createContext(null)

const LS = {
  patientData: 'patientData',
  doctorId: 'doctorId',
  hospitalId: 'hospitalId',
  doctorDetails: 'doctorDetails',
  clinicDetails: 'clinicDetails',
  todayAppointments: 'todayAppointments',
}

export const DoctorProvider = ({ children }) => {
  const [patientData, setPatientDataState] = useState(null)
  const [isPatientLoading, setIsPatientLoading] = useState(true)

  // Use objects for details (not arrays)
  const [doctorId, setDoctorIdState] = useState(null)
  const [hospitalId, setHospitalIdState] = useState(null)
  const [doctorDetails, setDoctorDetailsState] = useState(null) // object or null
  const [clinicDetails, setClinicDetailsState] = useState(null) // object or null
  const [todayAppointments, setTodayAppointmentsState] = useState([])
  const [updateTemplate, setUpdateTemplate] = useState(false)

  // Hydrate on first mount
  useEffect(() => {
    try {
      const pd = localStorage.getItem(LS.patientData)
      if (pd) setPatientDataState(JSON.parse(pd))

      const did = localStorage.getItem(LS.doctorId)
      if (did) setDoctorIdState(did)

      const hid = localStorage.getItem(LS.hospitalId)
      if (hid) setHospitalIdState(hid)

      const dd = localStorage.getItem(LS.doctorDetails)
      if (dd) setDoctorDetailsState(JSON.parse(dd)) // expect object

      const cd = localStorage.getItem(LS.clinicDetails)
      if (cd) setClinicDetailsState(JSON.parse(cd)) // expect object

      const ta = localStorage.getItem(LS.todayAppointments)
      if (ta) setTodayAppointmentsState(JSON.parse(ta))
    } catch (e) {
      console.warn('Hydrate error', e)
    } finally {
      setIsPatientLoading(false)
    }
  }, [])

  // Persist helpers (the only place that touches localStorage)
  const setPatientData = (p) => {
    setPatientDataState(p)
    try {
      if (p) localStorage.setItem(LS.patientData, JSON.stringify(p))
      else localStorage.removeItem(LS.patientData)
    } catch {}
  }

  const setDoctorId = (v) => {
    setDoctorIdState(v)
    try {
      v ? localStorage.setItem(LS.doctorId, v) : localStorage.removeItem(LS.doctorId)
    } catch {}
  }

  const setHospitalId = (v) => {
    setHospitalIdState(v)
    try {
      v ? localStorage.setItem(LS.hospitalId, v) : localStorage.removeItem(LS.hospitalId)
    } catch {}
  }

  const setDoctorDetails = (obj) => {
    setDoctorDetailsState(obj)
    try {
      obj
        ? localStorage.setItem(LS.doctorDetails, JSON.stringify(obj))
        : localStorage.removeItem(LS.doctorDetails)
    } catch {}
  }

  const setClinicDetails = (obj) => {
    setClinicDetailsState(obj)
    try {
      obj
        ? localStorage.setItem(LS.clinicDetails, JSON.stringify(obj))
        : localStorage.removeItem(LS.clinicDetails)
    } catch {}
  }

  const setTodayAppointments = (arr) => {
    setTodayAppointmentsState(arr || [])
    try {
      arr?.length
        ? localStorage.setItem(LS.todayAppointments, JSON.stringify(arr))
        : localStorage.removeItem(LS.todayAppointments)
    } catch {}
  }

  const value = useMemo(
    () => ({
      // data
      isPatientLoading,
      patientData,
      doctorId,
      hospitalId,
      doctorDetails,
      clinicDetails,
      todayAppointments,
      // setters (persisting)
      setPatientData,
      setDoctorId,
      setHospitalId,
      setDoctorDetails,
      setClinicDetails,
      setTodayAppointments,updateTemplate, setUpdateTemplate
    }),
    [
      isPatientLoading,
      patientData,
      doctorId,
      hospitalId,
      doctorDetails,
      clinicDetails,
      todayAppointments,
    ],
  )

  return <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>
}

export const useDoctorContext = () => useContext(DoctorContext)
