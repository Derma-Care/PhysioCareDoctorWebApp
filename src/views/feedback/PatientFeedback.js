import React, { useEffect, useState } from 'react';
import { CSpinner } from '@coreui/react';
import { COLORS } from '../../Themes';
import { getDoctorFeedbackSummary } from '../../Auth/Auth';

const PatientFeedback = () => {
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState([]);
  const [comments, setComments] = useState([]);
  const [overallData, setOverallData] = useState({ averageRating: 0, totalPatientsRated: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const storedDoctor = localStorage.getItem('doctorDetails');
        const storedClinic = localStorage.getItem('clinicDetails');

        const docId = storedDoctor
          ? JSON.parse(storedDoctor).doctorId || localStorage.getItem('doctorId')
          : localStorage.getItem('doctorId');
        const cId = storedClinic
          ? JSON.parse(storedClinic).id || localStorage.getItem('hospitalId')
          : localStorage.getItem('hospitalId') || '0001';

        const feedbackRes = await getDoctorFeedbackSummary(cId, docId);

        if (feedbackRes?.success && feedbackRes?.data) {
          const payload = feedbackRes.data;

          setOverallData({
            averageRating: payload.averageRating || 0,
            totalPatientsRated: payload.totalPatientsRated || 0,
          });

          const patientsList = payload.patients || [];

          const textComments = patientsList
            .filter(p => p.whatWentWell && p.whatWentWell.trim() !== '')
            .slice(0, 10)
            .map(p => ({
              patientName: p.patientName,
              text: p.whatWentWell,
              rating: Number(p.rating || 0),
              mobileNumber: p.mobileNumber,
            }));

          let excellent = 0, good = 0, average = 0, poor = 0;
          patientsList.forEach(p => {
            const r = Number(p.rating || 0);
            if (r >= 9) excellent++;
            else if (r >= 7) good++;
            else if (r >= 5) average++;
            else poor++;
          });

          const total = patientsList.length > 0 ? patientsList.length : 1;
          const stats = [
            { category: 'Excellent (9-10)', percentage: Math.round((excellent / total) * 100), color: '#1D9E75' },
            { category: 'Good (7-8)', percentage: Math.round((good / total) * 100), color: '#378ADD' },
            { category: 'Average (5-6)', percentage: Math.round((average / total) * 100), color: '#EF9F27' },
            { category: 'Poor (1-4)', percentage: Math.round((poor / total) * 100), color: '#E24B4A' },
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

  const renderStars = (rating, size = 18) => (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
        <span key={star} style={{ fontSize: size, color: star <= Math.round(rating) ? '#EF9F27' : '#dee2e6' }}>
          {star <= Math.round(rating) ? '★' : '☆'}
        </span>
      ))}
    </div>
  );

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : 'A');

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CSpinner color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6c757d', fontSize: '15px' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '1.5rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 3fr)',
        gap: '20px',
        width: '100%',
      }}>

        {/* LEFT: Overall Rating + Progress Bars */}
        <div style={{
          background: '#fff',
          border: '1px solid #f1f3f5',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#adb5bd',
            marginBottom: '1rem',
          }}>
            Overall Rating
          </div>

          <div style={{ fontSize: '52px', fontWeight: '600', color: COLORS.primary, lineHeight: 1 }}>
            {Number(overallData.averageRating).toFixed(1)}
          </div>

          <div style={{ margin: '10px 0 4px' }}>
            {renderStars(overallData.averageRating, 22)}
          </div>

          <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '1.5rem' }}>
            Based on {overallData.totalPatientsRated} patient review{overallData.totalPatientsRated !== 1 ? 's' : ''}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f1f3f5', marginBottom: '1.25rem' }} />

          {ratings.length > 0 ? ratings.map((item, index) => (
            <div key={index} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#495057' }}>{item.category}</span>
                <span style={{ fontSize: '12px', color: '#6c757d' }}>{item.percentage}%</span>
              </div>
              <div style={{ height: '7px', background: '#f1f3f5', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${item.percentage}%`,
                  background: item.color,
                  borderRadius: '99px',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          )) : (
            <p style={{ color: '#adb5bd', fontSize: '13px', textAlign: 'center', marginTop: '1rem' }}>
              No rating stats available.
            </p>
          )}
        </div>

        {/* RIGHT: Recent Comments */}
        <div style={{
          background: '#fff',
          border: '1px solid #f1f3f5',
          borderRadius: '12px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h5 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#212529' }}>
              Recent Feedback
            </h5>
            <span style={{
              fontSize: '11px',
              padding: '3px 10px',
              borderRadius: '99px',
              background: '#f8f9fa',
              color: '#6c757d',
              border: '1px solid #e9ecef',
            }}>
              Top {comments.length}
            </span>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '520px', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
            {comments.length > 0 ? comments.map((comment, index) => (
              <div key={index} style={{
                display: 'flex',
                gap: '12px',
                padding: '14px',
                background: '#f8f9fa',
                borderRadius: '10px',
                border: '1px solid #f1f3f5',

              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#E1F5EE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '15px',
                  color: COLORS.primary,
                  flexShrink: 0,
                }}>
                  {getInitial(comment.patientName)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#212529' }}>
                      {comment.patientName || 'Anonymous Patient'}
                    </span>
                    {renderStars(comment.rating, 13)}
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#495057', lineHeight: '1.5' }}>
                    "{comment.text}"
                  </p>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#adb5bd' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>💬</div>
                <p style={{ fontSize: '14px', margin: 0 }}>No written comments have been submitted yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientFeedback;