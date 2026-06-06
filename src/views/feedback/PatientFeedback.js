import React, { useEffect, useState } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CProgress,
  CSpinner,
  CBadge
} from '@coreui/react';
import { COLORS } from '../../Themes';
import { getDoctorFeedbackSummary } from '../../Auth/Auth';

const PatientFeedback = () => {
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState([]);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const storedDoctor = localStorage.getItem('doctorDetails');
        const storedClinic = localStorage.getItem('clinicDetails');
        
        const docId = storedDoctor ? JSON.parse(storedDoctor).doctorId || localStorage.getItem('doctorId') : localStorage.getItem('doctorId');
        const cId = storedClinic ? JSON.parse(storedClinic).id || localStorage.getItem('hospitalId') : localStorage.getItem('hospitalId') || '0001';

        const feedbackRes = await getDoctorFeedbackSummary(cId, docId);

        if (feedbackRes?.success && feedbackRes?.data) {
          const payload = feedbackRes.data;
          
          // The API returns an array of patients with their ratings and feedback
          const patientsList = payload.patients || [];
          
          // Map the patients to comments for the UI
          const textComments = patientsList
            .filter(p => p.whatWentWell && p.whatWentWell.trim() !== '')
            .map(p => ({
              patientName: p.patientName,
              text: p.whatWentWell,
              rating: p.rating
            }));
            
          // Compute percentages for the progress bars
          let excellent = 0, good = 0, average = 0, poor = 0;
          patientsList.forEach(p => {
            const r = Number(p.rating);
            if (r >= 4.5) excellent++;
            else if (r >= 3.5) good++;
            else if (r >= 2.5) average++;
            else poor++;
          });
          
          const total = patientsList.length > 0 ? patientsList.length : 1;
          const stats = [
            { category: 'Excellent (5)', percentage: Math.round((excellent / total) * 100) },
            { category: 'Good (4)', percentage: Math.round((good / total) * 100) },
            { category: 'Average (3)', percentage: Math.round((average / total) * 100) },
            { category: 'Poor (1-2)', percentage: Math.round((poor / total) * 100) },
          ];
          
          setRatings(stats);
          setComments(textComments);
        } else {
          setError(feedbackRes?.message || 'No feedback found.');
        }
      } catch (err) {
        setError('Failed to load patient feedback.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <CSpinner color="primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid mt-3 mx-auto" style={{ maxWidth: '800px' }}>
      {error ? (
        <div className="text-center py-5">
          <p className="text-muted" style={{ fontSize: '15px' }}>{error}</p>
        </div>
      ) : (
        <CRow>
          {/* LEFT COLUMN: Summary Progress Bars */}
          <CCol md={5} className="mb-4">
            <CCard className="h-100 shadow-sm border-0">
              <CCardHeader style={{ backgroundColor: COLORS.bgcolor, color: COLORS.white, fontWeight: 'bold', fontSize: '14px' }}>
                Overall Ratings
              </CCardHeader>
              <CCardBody>
                {ratings.length > 0 ? (
                  ratings.map((item, index) => {
                    const isExcellent = item.category.toLowerCase().includes('excellent');
                    const isGood = item.category.toLowerCase().includes('good');
                    const isAverage = item.category.toLowerCase().includes('average');
                    
                    let colorClass = 'bg-secondary';
                    if (isExcellent) colorClass = 'bg-success';
                    else if (isGood) colorClass = 'bg-primary';
                    else if (isAverage) colorClass = 'bg-warning';
                    else colorClass = 'bg-danger';

                    return (
                      <div key={index} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <strong style={{ fontSize: '13px', color: COLORS.black }}>{item.category}</strong>
                          <span className="text-muted" style={{ fontSize: '12px' }}>{item.percentage}%</span>
                        </div>
                        <div className="progress" style={{ height: '8px', borderRadius: '4px', backgroundColor: '#e9ecef' }}>
                          <div
                            className={`progress-bar ${colorClass}`}
                            role="progressbar"
                            style={{ width: `${item.percentage}%`, borderRadius: '4px' }}
                            aria-valuenow={item.percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted text-center mt-4" style={{ fontSize: '13px' }}>No rating stats available.</p>
                )}
              </CCardBody>
            </CCard>
          </CCol>

          {/* RIGHT COLUMN: Written Comments List */}
          <CCol md={7} className="mb-4">
            <CCard className="h-100 shadow-sm border-0">
              <CCardHeader style={{ backgroundColor: COLORS.white, borderBottom: `2px solid ${COLORS.bgcolor}`, fontSize: '14px' }}>
                <h6 className="mb-0" style={{ color: COLORS.black, fontWeight: 'bold' }}>Recent Comments</h6>
              </CCardHeader>
              <CCardBody style={{ maxHeight: '50vh', overflowY: 'auto', padding: '15px' }}>
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <div 
                      key={index} 
                      className="p-3 mb-3" 
                      style={{ 
                        backgroundColor: index % 2 === 0 ? '#F8F9FA' : '#FFFFFF',
                        border: '1px solid #E9ECEF',
                        borderRadius: '6px'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <h6 className="mb-0" style={{ color: COLORS.black, fontWeight: 'bold', fontSize: '13px' }}>
                          {comment.patientName || 'Anonymous Patient'}
                        </h6>
                        {comment.date && (
                          <CBadge color="light" textColor="dark" style={{ fontSize: '11px' }}>
                            {comment.date}
                          </CBadge>
                        )}
                      </div>
                      <p className="mb-0" style={{ color: '#495057', fontStyle: 'italic', fontSize: '13px' }}>
                        "{comment.text}"
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted" style={{ fontSize: '14px' }}>No written comments have been submitted yet.</p>
                  </div>
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}
    </div>
  );
};

export default PatientFeedback;
