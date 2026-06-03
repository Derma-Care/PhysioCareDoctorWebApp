import React from 'react';
import { CCard, CCardBody, CPlaceholder, CRow, CCol } from '@coreui/react';
import PropTypes from 'prop-types';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const renderCardSkeleton = (key) => (
    <CCard className="mb-4" key={key}>
      <CCardBody>
        <CPlaceholder component="p" animation="glow">
          <CPlaceholder xs={7} />
          <CPlaceholder xs={4} />
          <CPlaceholder xs={4} />
          <CPlaceholder xs={6} />
          <CPlaceholder xs={8} />
        </CPlaceholder>
      </CCardBody>
    </CCard>
  );

  const renderTableSkeleton = (key) => (
    <div key={key} className="mb-4">
      <CPlaceholder component="p" animation="glow">
        <CPlaceholder xs={12} size="lg" className="mb-2" />
        <CPlaceholder xs={12} className="mb-1" />
        <CPlaceholder xs={12} className="mb-1" />
        <CPlaceholder xs={12} className="mb-1" />
        <CPlaceholder xs={12} className="mb-1" />
      </CPlaceholder>
    </div>
  );

  const renderTextSkeleton = (key) => (
    <CPlaceholder key={key} component="p" animation="glow">
      <CPlaceholder xs={12} />
      <CPlaceholder xs={8} />
    </CPlaceholder>
  );

  const renderGridSkeleton = (key) => (
    <CRow key={key}>
      {[...Array(4)].map((_, idx) => (
        <CCol xs={12} sm={6} md={3} key={idx} className="mb-4">
          <CCard>
            <CCardBody>
              <CPlaceholder component="p" animation="glow">
                <CPlaceholder xs={12} size="lg" className="mb-2" />
                <CPlaceholder xs={8} />
              </CPlaceholder>
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
