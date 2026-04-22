import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import routes from '../routes'
import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'
import { COLORS } from '../Themes'

const AppBreadcrumb = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [dateTime, setDateTime] = useState('')

  // Update date & time every minute
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      const day = now.getDate()
      const suffix =
        day % 10 === 1 && day !== 11
          ? 'st'
          : day % 10 === 2 && day !== 12
          ? 'nd'
          : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th'

      const month = now.toLocaleString('en-US', { month: 'short' })
      const year = now.getFullYear().toString().slice(-2)
      const weekday = now.toLocaleString('en-US', { weekday: 'short' })
      const time = now.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })

      setDateTime(`${day}${suffix} ${month}, ${year} (${weekday}), ${time}`)
    }

    updateDateTime()
    const timer = setInterval(updateDateTime, 60000)
    return () => clearInterval(timer)
  }, [])

  // Find route by path (supports dynamic paths)
  const findRouteName = (pathname, routes) => {
    for (let route of routes) {
      if (route.path === pathname) return route.name
      const routeParts = route.path.split('/')
      const pathParts = pathname.split('/')
      if (
        routeParts.length === pathParts.length &&
        routeParts.every((part, i) => part.startsWith(':') || part === pathParts[i])
      ) {
        return route.name
      }
    }
    return null
  }

  // Generate breadcrumbs
  const generateBreadcrumbs = (pathname) => {
    const crumbs = []
    pathname.split('/').reduce((prev, curr, idx, arr) => {
      if (!curr) return prev
      const path = `${prev}/${curr}`
      const name = findRouteName(path, routes)
      if (name) {
        crumbs.push({ pathname: path, name, active: idx === arr.length - 1 })
      }
      return path
    }, '')
    return crumbs
  }

  const breadcrumbs = generateBreadcrumbs(location.pathname)

  // Show Back button on detail pages
  const showBackButton =
    location.pathname.includes('/tab-content/') ||
    location.pathname.includes('/tab-inProgress/') ||
    location.pathname.includes('/tab-completed-content/') ||
    location.pathname.includes('/appointments/')

  // Always go to Dashboard
  const handleBack = () => {
    navigate('/dashboard')
  }

  return (
    <div className="d-flex justify-content-between align-items-center w-100 px-3 py-2">
      {/* Breadcrumbs */}
      <CBreadcrumb
        className="my-0"
        style={{ '--cui-breadcrumb-divider-color': COLORS.black, marginBottom: 0 }}
      >
        <CBreadcrumbItem
          style={{ cursor: 'pointer', color: COLORS.black, fontWeight: 'bold' }}
          onClick={() => navigate('/dashboard')}
        >
          Home
        </CBreadcrumbItem>
        {breadcrumbs.map((b, idx) => (
          <CBreadcrumbItem
            key={idx}
            style={{
              color: COLORS.black,
              cursor: b.active ? 'default' : 'pointer',
              fontWeight: b.active ? 600 : 500,
            }}
            {...(b.active ? { active: true } : { onClick: () => navigate(b.pathname) })}
          >
            {b.name}
          </CBreadcrumbItem>
        ))}
      </CBreadcrumb>

      {/* Date & Back Button */}
      <div className="d-flex align-items-center gap-3">
       
        <small style={{ fontWeight: 600, color: COLORS.black, fontSize: '0.9rem' }}>
          {dateTime}
        </small>
         {showBackButton && (
          <button
            className="btn btn-sm btn-outline-primary d-flex align-items-center px-3"
            onClick={handleBack}
            style={{
              fontWeight: 600,
              borderRadius: '20px',
              color: COLORS.black,
              backgroundColor: 'transparent',
            }}
          >
            Back
          </button>
        )}
      </div>
    </div>
  )
}

export default React.memo(AppBreadcrumb)
