import React from 'react'
import { CPlaceholder, CSidebar, CSidebarHeader, CHeader, CContainer, CRow, CCol, CCard, CCardBody } from '@coreui/react'
import { COLORS } from '../Themes'
import './header/sidebar.css'
import './AppSidebar.css'
import './AppHeader.css'

const AppSkeleton = () => {
  const skelColor = '#e2e8f0' // soft premium gray for skeleton

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Skeleton Sidebar */}
      <CSidebar
        className="border-end shadow-sm"
        position="fixed"
        visible={true}
        style={{ backgroundColor: COLORS.bgcolor, zIndex: 1030 }}
      >
        <CSidebarHeader className="border-bottom d-flex flex-column align-items-center py-4">
          <CPlaceholder component="div" animation="glow" className="w-100 d-flex flex-column align-items-center">
            <CPlaceholder className="rounded-circle mb-3" style={{ width: 90, height: 90, backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <CPlaceholder className="mb-2" style={{ width: '65%', height: 18, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <CPlaceholder className="mb-1" style={{ width: '45%', height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <CPlaceholder className="mb-1" style={{ width: '55%', height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </CPlaceholder>
        </CSidebarHeader>
        <div className="p-4">
          {[...Array(6)].map((_, i) => (
            <CPlaceholder key={i} component="div" animation="glow" className="mb-4 d-flex align-items-center">
              <CPlaceholder className="rounded-circle me-3" style={{ width: 24, height: 24, backgroundColor: 'rgba(255,255,255,0.15)' }} />
              <CPlaceholder style={{ width: '75%', height: 14, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            </CPlaceholder>
          ))}
        </div>
      </CSidebar>

      {/* Skeleton Main Wrapper */}
      <div className="wrapper d-flex flex-column min-vh-100">
        {/* Skeleton Header */}
        <CHeader position="sticky" className="mb-4 p-0 shadow-sm border-0" style={{ zIndex: 1020, backgroundColor: '#ffffff', height: 70 }}>
          <CContainer fluid className="px-4 d-flex align-items-center justify-content-between h-100">
            <CPlaceholder component="div" animation="glow" className="d-flex align-items-center" style={{ width: '40%' }}>
              <CPlaceholder className="me-3" style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: skelColor }} />
              <CPlaceholder style={{ width: '40%', height: 20, borderRadius: 8, backgroundColor: skelColor }} />
            </CPlaceholder>
            <CPlaceholder component="div" animation="glow" className="d-flex align-items-center">
              <CPlaceholder className="rounded-circle" style={{ width: 45, height: 45, backgroundColor: skelColor }} />
            </CPlaceholder>
          </CContainer>
        </CHeader>

        {/* Skeleton Body Content */}
        <div className="body flex-grow-1 px-4">
          <CContainer fluid>
            {/* Top Cards Row */}
            <CRow className="mb-4">
              {[...Array(4)].map((_, i) => (
                <CCol xs={12} sm={6} lg={3} key={i}>
                  <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                    <CCardBody className="p-4">
                      <CPlaceholder component="div" animation="glow">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <CPlaceholder style={{ width: '45%', height: 16, borderRadius: 6, backgroundColor: skelColor }} />
                          <CPlaceholder className="rounded-circle" style={{ width: 35, height: 35, backgroundColor: skelColor }} />
                        </div>
                        <CPlaceholder style={{ width: '70%', height: 32, borderRadius: 8, backgroundColor: skelColor }} />
                      </CPlaceholder>
                    </CCardBody>
                  </CCard>
                </CCol>
              ))}
            </CRow>

            {/* Main Content Area */}
            <CRow>
              <CCol xs={12} lg={8}>
                <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                  <CCardBody className="p-4" style={{ height: 400 }}>
                    <CPlaceholder component="div" animation="glow" className="h-100 d-flex flex-column">
                      <CPlaceholder style={{ width: '30%', height: 24, marginBottom: 30, borderRadius: 8, backgroundColor: skelColor }} />
                      <CPlaceholder className="flex-grow-1" style={{ width: '100%', borderRadius: 12, backgroundColor: skelColor }} />
                    </CPlaceholder>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol xs={12} lg={4}>
                <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                  <CCardBody className="p-4" style={{ height: 400 }}>
                    <CPlaceholder component="div" animation="glow" className="h-100 d-flex flex-column">
                      <CPlaceholder style={{ width: '50%', height: 24, marginBottom: 30, borderRadius: 8, backgroundColor: skelColor }} />
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="d-flex align-items-center mb-3 pb-2 border-bottom">
                           <CPlaceholder className="rounded-circle me-3" style={{ width: 45, height: 45, backgroundColor: skelColor }} />
                           <div className="flex-grow-1">
                             <CPlaceholder className="mb-2" style={{ width: '80%', height: 14, borderRadius: 6, backgroundColor: skelColor }} />
                             <CPlaceholder style={{ width: '50%', height: 12, borderRadius: 6, backgroundColor: skelColor }} />
                           </div>
                        </div>
                      ))}
                    </CPlaceholder>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          </CContainer>
        </div>
      </div>
    </div>
  )
}

export default AppSkeleton
