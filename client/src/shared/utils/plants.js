import { daysBetween, todayISO } from './date.js'
import waterCanIcon from '../../assets/water.svg'
import fertilizeIcon from '../../assets/fertilize.svg'
import pruneIcon from '../../assets/scissor.svg'
import repotIcon from '../../assets/repot.svg'
import cleanIcon from '../../assets/clean.svg'
import healthIcon from '../../assets/stethoscope.svg'
import otherIcon from '../../assets/other.svg'
import rotateIcon from '../../assets/rotate.svg'

const PLANT_EMOJI = {
  'Monstera Deliciosa': '🌿',
  'Ocimum Basilicum': '🌱',
  'Aloe Vera': '🪴',
  'Snake Plant': '🪴',
  'English Ivy': '🍃',
  Mint: '🌱',
  Pothos: '🌿',
  'Peace Lily': '🌸',
  'Spider Plant': '🌾',
  Basil: '🌱',
}

export function emojiFor(species) {
  return PLANT_EMOJI[species] || '🌱'
}

export function healthClass(health) {
  return {
    Healthy: 'healthy',
    Good: 'good',
    'Needs Attention': 'attention',
    Critical: 'critical',
  }[health] || 'good'
}

export function statusDotClass(health) {
  return {
    Healthy: 'status-healthy',
    Good: 'status-good',
    'Needs Attention': 'status-attention',
    Critical: 'status-critical',
  }[health] || 'status-good'
}

export function taskIcon(type) {
  return {
    Water: waterCanIcon,
    Fertilize: fertilizeIcon,
    Prune: pruneIcon,
    Repot: repotIcon,
    Check: healthIcon,
    Rotate: rotateIcon,
  }[type] || repotIcon
}

export function activityIcon(activity) {
  return {
    Watered: waterCanIcon,
    Fertilized: fertilizeIcon,
    Pruned: pruneIcon,
    Repotted: repotIcon,
    Cleaned: cleanIcon,
    'Checked Health': healthIcon,
    Other: otherIcon,
  }[activity] || otherIcon
}

export function computeTaskStatus(task) {
  if (task.status === 'completed') return 'completed'
  const diff = daysBetween(todayISO(), task.date)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  return 'upcoming'
}

export function avatarInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export function waterFrequencyDays(label) {
  return {
    'Every 3 days': 3,
    Weekly: 7,
    'Every 10 days': 10,
    'Every 2 weeks': 14,
    'Every 2-3 days': 3,
    'Every 2-3 weeks': 18,
    'Every 7-10 days': 9,
  }[label] || 7
}
