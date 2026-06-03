import React from 'react';
import { CCard, CCardBody, CRow, CCol } from '@coreui/react';
import PropTypes from 'prop-types';
import './Skeleton.css';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const renderCardSkeleton = (key) => (
    <CCard className="mb-4" key={key}>
      <CCardBody>
        <div>
          <div className="insta-shimmer mb-2" style={{ width: '70%', height: 16, borderRadius: 6 }} />
          <div className="insta-shimmer mb-2" style={{ width: '40%', height: 16, borderRadius: 6 }} />
          <div className="insta-shimmer mb-2" style={{ width: '40%', height: 16, borderRadius: 6 }} />
          <div className="insta-shimmer mb-2" style={{ width: '60%', height: 16, borderRadius: 6 }} />
          <div className="insta-shimmer" style={{ width: '80%', height: 16, borderRadius: 6 }} />
        </div>
      </CCardBody>
    </CCard>
  );

  const renderTableSkeleton = (key) => (
    <div key={key} className="mb-4">
      <div>
        <div className="insta-shimmer mb-3" style={{ width: '100%', height: 24, borderRadius: 8 }} />
        <div className="insta-shimmer mb-2" style={{ width: '100%', height: 16, borderRadius: 6 }} />
        <div className="insta-shimmer mb-2" style={{ width: '100%', height: 16, borderRadius: 6 }} />
        <div className="insta-shimmer mb-2" style={{ width: '100%', height: 16, borderRadius: 6 }} />
        <div className="insta-shimmer mb-2" style={{ width: '100%', height: 16, borderRadius: 6 }} />
      </div>
    </div>
  );

  const renderTextSkeleton = (key) => (
    <div key={key} className="mb-4">
      <div className="insta-shimmer mb-2" style={{ width: '100%', height: 16, borderRadius: 6 }} />
      <div className="insta-shimmer" style={{ width: '80%', height: 16, borderRadius: 6 }} />
    </div>
  );

  const renderGridSkeleton = (key) => (
    <CRow key={key}>
      {[...Array(4)].map((_, idx) => (
        <CCol xs={12} sm={6} md={3} key={idx} className="mb-4">
          <CCard>
            <CCardBody>
              <div>
                <div className="insta-shimmer mb-3" style={{ width: '100%', height: 24, borderRadius: 8 }} />
                <div className="insta-shimmer" style={{ width: '80%', height: 16, borderRadius: 6 }} />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      ))}
    </CRow>
  );

  const skeletons = [...Array(count)].map((_, index) => {
    switch (type) {
      case 'table':
        return renderTableSkeleton(index);
      case 'text':
        return renderTextSkeleton(index);
      case 'grid':
        return renderGridSkeleton(index);
      case 'card':
      default:
        return renderCardSkeleton(index);
    }
  });

  return <>{skeletons}</>;
};

SkeletonLoader.propTypes = {
  type: PropTypes.oneOf(['card', 'table', 'text', 'grid']),
  count: PropTypes.number,
};

export default SkeletonLoader;
