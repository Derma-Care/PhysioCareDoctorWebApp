import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'
import routes from '../routes'
import Dashboard from '../views/dashboard/Dashboard'
import { COLORS } from '../Themes'
import PatientAppointmentDetails from './PatientAppointmnetDetails'
import ReportDetails from './Reports/Reports'
import CompletedAppointmentsView from './ComplatedAppointmnetView'
import DoctorProfile from '../views/Profile/DoctorProfile'
const AppContent = () => {
  return (
    <CContainer className="px-4" lg style={{ backgroundColor: COLORS.theme }}>
      <Suspense fallback={<CSpinner color="primary" />}>
        <Routes>
          {routes.map((route, idx) => {
            return (
              route.element && (
                <Route
                  key={idx}
                  path={route.path}
                  exact={route.exact}
                  name={route.name}
                  element={<route.element />}
                />
              )
            )
          })}

          <Route path="/" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="/tab-content/:id" element={<PatientAppointmentDetails />} />
           <Route path="/tab-inProgress/:id" element={<PatientAppointmentDetails />} /> 
          <Route path="/tab-completed-content/:id" element={<CompletedAppointmentsView />} />
          <Route path="doctorprofile" element={<DoctorProfile />} />
          {/* <Route path="/reportDetails/:id" element={<ReportDetails />} /> */}

          {/* Doctor-template opens with all tabs but History active */}
          <Route
            path="/doctor-template"
            element={
              <PatientAppointmentDetails
                defaultTab="Symptoms"
                fromDoctorTemplate={true} // ✅ tells TabContent to load DoctorSymptoms
                tabs={[
                  'Diagnosis',
                  'Investigations',
                  'Medication',
                  'Procedures',
                  'Follow-up',
                  'Prescription',
                ]}
              />
            }
          />

          {/* Optional: Doctor-template Images direct */}
          <Route
            path="/doctor-template/images"
            element={<PatientAppointmentDetails defaultTab="Images" />}
          />
        </Routes>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)
