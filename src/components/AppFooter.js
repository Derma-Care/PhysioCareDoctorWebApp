import React from 'react'
import { CFooter } from '@coreui/react'

const FOOTER_STYLES = `
  @keyframes stripFlow {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  @keyframes dotPulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50%       { opacity: 1;   transform: scale(1.2); }
  }
  .footer-link {
    color: #1B4F8A;
    text-decoration: none;
    font-weight: 600;
    transition: color .2s;
  }
  .footer-link:hover { color: #F5A623; }
`

const AppFooter = () => {
  return (
    <>
      <style>{FOOTER_STYLES}</style>

      <CFooter
        className="px-4"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1030,
          padding: '9px 24px',
          background: '#fff',
          borderTop: '1px solid rgba(27,79,138,0.1)',
          boxShadow: '0 -2px 16px rgba(27,79,138,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Animated brand strip */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          background: 'linear-gradient(90deg,#1B4F8A 0%,#F5A623 40%,#ffd17a 60%,#1B4F8A 100%)',
          backgroundSize: '200% auto',
          animation: 'stripFlow 3s linear infinite',
        }}/>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontFamily: "'Outfit', sans-serif",
          fontSize: 12.5,
          color: '#8a94a6',
        }}>
          {/* Pulse dot */}
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#F5A623',
            animation: 'dotPulse 2.5s ease-in-out infinite',
            flexShrink: 0,
          }}/>

          <span>Powered by</span>

          <a
            href="https://chiselontechnologies.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Chiselon Technologies &copy; 2025
          </a>
        </div>
      </CFooter>
    </>
  )
}

export default React.memo(AppFooter)