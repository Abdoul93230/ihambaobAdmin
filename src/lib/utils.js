import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
export function formatCurrency(amount, currency = 'CFA') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ' + currency
}

export function formatWeight(weight) {
  return `${weight} kg`
}

export function getZoneTypeLabel(type) {
  const labels = {
    country: 'Pays',
    region: 'Région',
    city: 'Ville', 
    district: 'Quartier'
  }
  return labels[type] || type
}

export function getZoneIcon(type) {
  const icons = {
    country: '🌍',
    region: '🏛️',
    city: '🏙️',
    district: '🏘️'
  }
  return icons[type] || '📍'
}

export function buildZoneFullPath(zone) {
  if (!zone) return ''
  
  let path = zone.name
  if (zone.parent) {
    path = `${buildZoneFullPath(zone.parent)} > ${zone.name}`
  }
  return path
}

export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
