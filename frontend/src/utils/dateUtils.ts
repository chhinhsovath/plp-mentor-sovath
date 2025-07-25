export const formatDate = (date: string | Date, locale = 'en'): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (locale === 'km') {
    // Khmer date formatting
    const day = d.getDate().toString()
    const month = d.getMonth() + 1
    const year = d.getFullYear().toString()
    
    const khmerMonths = [
      'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
      'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
    ]
    
    return `${day} ${khmerMonths[month - 1]} ${year}`
  }
  
  // English date formatting
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateTime = (date: string | Date, locale = 'en'): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
  
  return `${formatDate(d, locale)} ${timeStr}`
}

export const getTimeAgo = (date: string | Date, locale = 'en'): string => {
  const now = new Date()
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - d.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (locale === 'km') {
    if (diffHours < 1) return 'ពេលនេះ'
    if (diffHours < 24) return `${diffHours} ម៉ោងមុន`
    if (diffDays < 7) return `${diffDays} ថ្ងៃមុន`
    return formatDate(d, locale)
  }
  
  if (diffHours < 1) return 'now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(d, locale)
}