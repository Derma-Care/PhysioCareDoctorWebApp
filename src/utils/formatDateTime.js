// src/utils/dateFormatter.js

export const getDateParts = () => {
  const date = new Date()

  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })

  const day = date.getDate()
  const getDaySuffix = (d) => {
    if (d > 3 && d < 21) return 'th'
    switch (d % 10) {
      case 1:
        return 'st'
      case 2:
        return 'nd'
      case 3:
        return 'rd'
      default:
        return 'th'
    }
  }
  const dayWithSuffix = `${day}${getDaySuffix(day)}`
  const month = date.toLocaleString('en-US', { month: 'short' }) 
  const year = date.getFullYear().toString().slice(-2) 

  const dateStr = `${dayWithSuffix} ${month}, ${year}`

  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const formattedHour = hours % 12 || 12
  const formattedMinutes = minutes.toString().padStart(2, '0')
  const timeStr = `${formattedHour}:${formattedMinutes} ${ampm}`

  return {
    day: weekday,
    date: dateStr,
    time: timeStr,
  }
}




export const formatDuration = (duration, unit) => {
  const d = parseInt(duration, 10)
  if (isNaN(d) || d <= 0 || !unit) return 'NA'

  const pluralUnit = d > 1 ? `${unit}s` : unit
  return `${d} ${pluralUnit}`
}