import React from 'react'
import logo from '../assets/images/ic_launcher.png'
import { motion } from 'framer-motion'

export const LogoLoader = () => {
  return (
    <div
      className="vh-100 d-flex flex-column justify-content-center align-items-center"
      style={{ backgroundColor: '#f8f9fa' }} // subtle background
    >
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* Outer glowing ring */}
        <motion.div
          style={{
            position: 'absolute',
            width: 130,
            height: 130,
            borderRadius: '50%',
            border: '3px solid rgba(0, 123, 255, 0.3)',
            boxShadow: '0 0 20px rgba(0, 123, 255, 0.2)'
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 0, 0.8],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut"
          }}
        />
        {/* Inner pulsing logo */}
        <motion.img
          src={logo}
          alt="logo"
          style={{ width: 90, zIndex: 1, filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.1))' }}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Loading text with shimmer */}
      <motion.h5
        className="mt-4"
        style={{ color: '#6c757d', fontWeight: 600, letterSpacing: '1px' }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >

      </motion.h5>
    </div>
  )
}
