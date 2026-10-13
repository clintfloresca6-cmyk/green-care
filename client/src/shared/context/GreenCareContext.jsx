import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../features/auth/AuthContext'
import { todayISO } from '../utils/date'
import { TASK_TYPE_TO_ACTIVITY } from '../utils/plants'
import { subscribeToPush } from '../utils/push.js'
import { io } from 'socket.io-client'

// ─── Static Data ─────────────────────────────────────────────────────────────
const HEALTH_ISSUES = {
  'Yellow Leaves': { causes: ['Overwatering', 'Insufficient light', 'Nutrient deficiency'], tips: ['Check soil moisture before watering again', 'Review watering frequency', 'Move the plant to appropriate lighting'] },
  Wilting: { causes: ['Underwatering', 'Root stress', 'Heat exposure'], tips: ['Water thoroughly and check drainage', 'Move away from direct heat sources', "Check roots aren't bound or rotting"] },
  Pests: { causes: ['Poor air circulation', 'Overwatering', 'Nearby infested plants'], tips: ['Isolate the affected plant', 'Wipe leaves with diluted neem oil', 'Improve airflow around the plant'] },
  'Brown Leaves': { causes: ['Low humidity', 'Mineral buildup from tap water', 'Sunburn'], tips: ['Increase humidity with a tray or misting', 'Use filtered or rested water', 'Move out of direct harsh sun'] },
  Overwatering: { causes: ['Watering on a fixed schedule', 'Poor drainage', 'Pot without drainage holes'], tips: ['Let soil dry before watering again', 'Ensure pots have drainage holes', 'Repot in well-draining soil if needed'] },
  Underwatering: { causes: ['Forgetting scheduled waterings', 'Fast-draining soil mix', 'Low humidity environment'], tips: ['Set reminders for consistent watering', 'Water deeply until it drains out the bottom', 'Group plants to raise local humidity'] }
}

const GreenCareContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')

const toJournalEntry = (row) => ({
  ...row,
  plantId: row.plant_id,
  date: row.entry_date,
  photo: row.photo_url,
  title: row.subject || row.activity,
})

const toTask = (row) => ({
  ...row,
  plantId: row.plant_id,
  date: row.task_date ? String(row.task_date).slice(0, 10) : null,
  time: row.task_time,
})

export function GreenCareProvider({ children }) {
  const { currentUser: authUser } = useAuth()
  const [dismissedDerived, setDismissedDerived] = useState(new Set())

  const getStoredTheme = () => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('greencare-theme')
      return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : 'light'
    }
    return 'light'
  }

  const [state, setState] = useState(() => {
    if (!authUser) {
      return {
        plants: [], tasks: [], journal: [], notifications: [], library: [],
        healthIssues: HEALTH_ISSUES, profile: null,
        settings: { careReminders: true, overdueReminders: true, healthAlerts: true, browserNotifs: false, theme: getStoredTheme(), reminderTime: '08:00', weekStart: 'mon' },
        activity: [], adminReports: [], toasts: [], modal: null,
      }
    }
    return {
      plants: [], tasks: [], journal: [], notifications: [], library: [],
      healthIssues: HEALTH_ISSUES,
      profile: { id: authUser.id, name: authUser.name, email: authUser.email, role: authUser.role, photo: authUser.photo_url || null, location: authUser.location ?? '' },
      settings: { careReminders: true, overdueReminders: true, healthAlerts: true, browserNotifs: false, theme: getStoredTheme(), reminderTime: '08:00', weekStart: 'mon' },
      activity: [], adminReports: [], toasts: [], modal: null,
    }
  })

  // ── Authenticated fetch helper (must be defined before effects that use it) ──
  const authFetch = useCallback(async (endpoint, options = {}) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      credentials: 'include',
      ...options,
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || errorData.error || `Request failed: ${response.status}`)
    }
    return await response.json()
  }, [])

  // ── Fetch initial data on login/logout ───────────────────────────────────────
  useEffect(() => {
    if (!authUser) return

    const fetchInitialData = async () => {
      try {
        const plantsData = await authFetch('/plants')
        const plants = plantsData.data || []

        const tasksData = await authFetch('/tasks')
        const tasks = (tasksData.data || []).map(toTask)

        const journalData = await authFetch('/journal')
        const journal = (journalData.data || []).map(toJournalEntry)

        const notificationsData = await authFetch('/notifications')
        const notifications = notificationsData.data || []

        const libraryData = await authFetch('/library')
        const library = libraryData.data || []

        let adminReports = []
        if (authUser.role === 'admin') {
          const adminData = await authFetch('/admin/reports')
          adminReports = adminData.data || []
        }

        setState(prev => ({ ...prev, plants, tasks, journal, notifications, library, adminReports }))

        const recentJournal = [...journal].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3)
        const recentTasks = [...tasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3)
        const activity = [
          ...recentJournal.map(entry => ({
            text: entry.activity,
            time: new Date(entry.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          })),
          ...recentTasks.map(task => ({
            text: `${task.type} ${task.plant_id ? '(for plant)' : ''}`,
            time: new Date(task.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          })),
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8)

        setState(prev => ({ ...prev, activity }))
      } catch (error) {
        console.error('Failed to fetch initial data:', error)
      }
    }

    fetchInitialData()
  }, [authUser, authFetch])

  // ── Push subscription (gated by setting) ─────────────────────────────────────
  useEffect(() => {
    if (!authUser) return
    if (!state.settings.browserNotifs) return
    subscribeToPush().catch((err) => console.warn('[push] subscribe failed:', err))
  }, [authUser, state.settings.browserNotifs])

  // ── Derived notifications ────────────────────────────────────────────────────
  const derivedNotifications = useMemo(() => {
    if (!authUser) return []

    const today = new Date().toISOString().slice(0, 10)
    const todayDate = new Date(today)

    const tasksDueToday = state.tasks.filter(t => t.date === today && t.status !== 'completed').length
    const overdueTasks = state.tasks.filter(t => t.date && new Date(t.date) < todayDate && t.status !== 'completed').length

    const oneWeek = new Date()
    oneWeek.setDate(oneWeek.getDate() + 7)
    const oneWeekISO = oneWeek.toISOString().slice(0, 10)
    const tasksDueThisWeek = state.tasks.filter(t => t.date >= today && t.date <= oneWeekISO && t.status !== 'completed').length

    const out = []
    if (tasksDueToday > 0) out.push({ id: 'derived-tasks-due-today', type: 'task_due', title: `${tasksDueToday} task${tasksDueToday === 1 ? '' : 's'} due today`, body: null, notice_date: today, is_read: false, page: 'schedule' })
    if (overdueTasks > 0) out.push({ id: 'derived-overdue-tasks', type: 'task_overdue', title: `${overdueTasks} overdue task${overdueTasks === 1 ? '' : 's'}`, body: null, notice_date: today, is_read: false, page: 'schedule' })
    if (tasksDueThisWeek > 0) out.push({ id: 'derived-tasks-this-week', type: 'task_due_this_week', title: `${tasksDueThisWeek} task${tasksDueThisWeek === 1 ? '' : 's'} due this week`, body: null, notice_date: today, is_read: false, page: 'schedule' })
    return out
  }, [state.tasks, authUser])

  // ── Merge derived notifications into state.notifications ─────────────────────
  useEffect(() => {
    const visibleDerived = derivedNotifications.filter(n => !dismissedDerived.has(n.id))
    setState(prev => ({
      ...prev,
      notifications: [
        ...prev.notifications.filter(n => n.id && !n.id.startsWith('derived-')),
        ...visibleDerived,
      ],
    }))
  }, [derivedNotifications, dismissedDerived])

  // ── Theme persistence (single instance) ──────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('greencare-theme', state.settings.theme)
    }
  }, [state.settings.theme])

  // ── Real-time socket (below authFetch so no TDZ error) ───────────────────────
  useEffect(() => {
    if (!authUser) return

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => console.log('[socket] connected', socket.id))
    socket.on('connect_error', (err) => console.warn('[socket] error:', err.message))

    socket.on('notification:new', (notif) => {
      setState(prev => {
        if (prev.notifications.some(n => n.id === notif.id)) return prev
        return { ...prev, notifications: [...prev.notifications, notif] }
      })
    })

    socket.on('notification:update', () => {
      authFetch('/notifications')
        .then(res => setState(prev => ({ ...prev, notifications: res.data || [] })))
        .catch(() => { })
    })

    socket.on('plant:created', (plant) => {
      setState(prev => {
        if (prev.plants.some(p => p.id === plant.id)) return prev
        return { ...prev, plants: [plant, ...prev.plants] }
      })
    })

    socket.on('plant:updated', (plant) => {
      setState(prev => ({
        ...prev,
        plants: prev.plants.map(p => (p.id === plant.id ? plant : p)),
      }))
    })

    socket.on('plant:archived', ({ id }) => {
      setState(prev => ({ ...prev, plants: prev.plants.filter(p => p.id !== id) }))
    })

    return () => socket.disconnect()
  }, [authUser, authFetch])

  // ── Actions ──────────────────────────────────────────────────────────────────
  const actions = {
    openModal: (type, props = {}) => setState(prev => ({ ...prev, modal: { type, props } })),
    closeModal: () => setState(prev => ({ ...prev, modal: null })),

    toast: (message) => {
      const toast = { id: Date.now() + Math.random(), message }
      setState(prev => ({ ...prev, toasts: [...prev.toasts, toast] }))
      setTimeout(() => {
        setState(prev => ({ ...prev, toasts: prev.toasts.filter(t => t.id !== toast.id) }))
      }, 3000)
    },

    resetData() {
      setState(prev => ({ ...prev, plants: [], tasks: [], journal: [], notifications: [], library: [], activity: [], adminReports: [], toasts: [] }))
    },

    // ── Plants ──
    async listPlants() {
      const result = await authFetch('/plants')
      setState(prev => ({ ...prev, plants: result.data || [] }))
      return result.data || []
    },

    async getPlant(plantId) {
      const result = await authFetch(`/plants/${plantId}`)
      return result.data
    },

    async createPlant(payload) {
      const result = await authFetch('/plants', { method: 'POST', body: JSON.stringify(payload) })
      setState(prev => ({ ...prev, plants: [result.data, ...prev.plants] }))

      // Event notification (best-effort)
      actions.addNotification({
        type: 'system',
        title: `Added new plant: ${payload.name || 'Unknown Plant'}`,
        notice_date: todayISO(),
        page: 'plants',
        plantId: result.data.id,
      }).catch(err => console.error('Failed to add plant notification:', err))

      return result.data
    },

    async updatePlant(plantId, patch) {
      const result = await authFetch(`/plants/${plantId}`, { method: 'PATCH', body: JSON.stringify(patch) })
      setState(prev => ({ ...prev, plants: prev.plants.map(p => (p.id === plantId ? result.data : p)) }))
      return result.data
    },

    async archivePlant(plantId) {
      await authFetch(`/plants/${plantId}`, { method: 'DELETE' })
      setState(prev => ({ ...prev, plants: prev.plants.filter(p => p.id !== plantId) }))
    },

    // ── Tasks ──
    async listTasks() {
      const result = await authFetch('/tasks')
      const tasks = (result.data || []).map(toTask)
      setState(prev => ({ ...prev, tasks }))
      return tasks
    },

    async createTask(payload) {
      const result = await authFetch('/tasks', { method: 'POST', body: JSON.stringify(payload) })
      setState(prev => ({ ...prev, tasks: [ toTask(result.data), ...prev.tasks] }))

      actions.addNotification({
        type: 'system',
        title: `New task created: ${payload.type || 'Task'}`,
        notice_date: todayISO(),
        page: 'schedule',
      }).catch(err => console.error('Failed to add task notification:', err))

      return result.data
    },

    async updateTask(taskId, patch) {
      const result = await authFetch(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(patch) })
      const updated = toTask(result.data)
      setState(prev => ({ ...prev, tasks: prev.tasks.map(t => (t.id === taskId ? updated : t)) }))
      return updated
    },

    async completeTask(task) {
      const result = await authFetch(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' }),
      })
      const updated = toTask(result.data)
      setState(prev => ({ ...prev, tasks: prev.tasks.map(t => (t.id === task.id ? updated : t)) }))

      // Spawn next repeating occurrence
      if (task.is_repeating && task.is_repeating > 0) {
        const today = todayISO()
        const baseDate = task.date < today ? today : task.date
        const [y, m, d] = baseDate.split('-').map(Number)
        const next = new Date(Date.UTC(y, m - 1, d + task.is_repeating))
        const newDateISO = next.toISOString().slice(0, 10)

        const created = await authFetch('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            plant_id: task.plantId,
            type: task.type,
            task_date: newDateISO,
            task_time: task.task_time,
            priority: task.priority,
            status: 'pending',
            is_repeating: task.is_repeating,
          }),
        })
        setState(prev => ({ ...prev, tasks: [...prev.tasks, toTask(created.data)] }))
      }

      const plant = state.plants.find(p => p.id === task.plantId)

      await actions.createJournalEntry({
        plant_id: task.plantId,
        entry_date: task.date,
        activity: TASK_TYPE_TO_ACTIVITY[task.type] ?? task.type,
        notes: `Task "${task.type}" for plant "${plant?.name || ''}" completed on ${task.date}.`,
      }).catch(err => console.error('Journal entry failed:', err))

      await actions.addNotification({
        type: 'system',
        title: `Completed "${task.type}" for ${plant?.name || 'a plant'}`,
        notice_date: todayISO(),
        page: 'schedule',
        taskId: task.id,
      }).catch(err => console.error('Notification failed:', err))

      return updated
    },

    // ── Journal ──
    async listJournal() {
      const result = await authFetch('/journal')
      const journal = (result.data || []).map(toJournalEntry)
      setState(prev => ({ ...prev, journal }))
      return journal
    },

    async createJournalEntry(payload) {
      const result = await authFetch('/journal', { method: 'POST', body: JSON.stringify(payload) })
      const entry = toJournalEntry(result.data)
      setState(prev => ({ ...prev, journal: [...prev.journal, entry] }))

      const newActivity = {
        text: payload.activity,
        time: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      }
      setState(prev => ({ ...prev, activity: [newActivity, ...prev.activity].slice(0, 8) }))
      return result.data
    },

    // ── Notifications ──
    async listNotifications() {
      const result = await authFetch('/notifications')
      setState(prev => ({ ...prev, notifications: result.data || [] }))
      return result.data || []
    },

    async markNotificationRead(notificationId) {
      if (notificationId.startsWith('derived-')) {
        setDismissedDerived(prev => new Set(prev).add(notificationId))
        return
      }
      try {
        await authFetch(`/notifications/${notificationId}`, { method: 'PATCH', body: JSON.stringify({ is_read: true }) })
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => (n.id === notificationId ? { ...n, is_read: true } : n)),
        }))
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    },

    async markAllRead() {
      await authFetch('/notifications/read-all', { method: 'PATCH' })
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })),
      }))
    },

    async clearNotifications() {
      await authFetch('/notifications/clear-all', { method: 'DELETE' })
      setState(prev => ({ ...prev, notifications: [] }))
    },

    async addNotification(notification) {
      const result = await authFetch('/notifications', { method: 'POST', body: JSON.stringify(notification) })
      setState(prev => ({ ...prev, notifications: [...prev.notifications, result.data] }))
      return result.data
    },

    // ── Library ──
    async listLibrary() {
      const result = await authFetch('/library')
      setState(prev => ({ ...prev, library: result.data || [] }))
      return result.data || []
    },

    async searchTreflePlants(params = {}) {
      const defaults = { page: 1, perPage: 10, query: '' }
      const p = { ...defaults, ...params }
      const result = await authFetch(`/trefle/search?page=${p.page}&per_page=${p.perPage}&q=${encodeURIComponent(p.query)}`)
      return result.data || []
    },

    async saveSpecies(speciesId, speciesData) {
      const result = await authFetch(`/admin/species/${speciesId}`, { method: 'PATCH', body: JSON.stringify(speciesData) })
      const updated = { ...speciesData, ...(result?.data ?? result), id: speciesId }
      setState(prev => ({
        ...prev,
        library: prev.library.map(s => (s.id === speciesId ? { ...s, ...updated } : s)),
      }))
      return result.data
    },

    // ── Settings / Profile ──
    async updateSettings(settingsPatch) {
      setState(prev => ({ ...prev, settings: { ...prev.settings, ...settingsPatch } }))
      return settingsPatch
    },

    async updateProfile(profilePatch) {
      setState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...profilePatch } : { ...profilePatch },
      }))
      return profilePatch
    },

    // ── Reports ──
    async createReport(payload) {
      const result = await authFetch('/reports', { method: 'POST', body: JSON.stringify(payload) })
      return result.data
    },

    async updateReport(reportId, status) {
      const result = await authFetch(`/reports/${reportId}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      const updated = { ...(result?.data ?? result), id: reportId, status }
      setState(prev => ({
        ...prev,
        adminReports: prev.adminReports.map(r => (r.id === reportId ? { ...r, ...updated } : r)),
      }))
      return result.data
    },
  }

  // ── Service worker push → toast + refresh notifications ──────────────────────
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    function onMessage(event) {
      if (event.data?.type !== 'PUSH_RECEIVED') return
      setState(prev => {
        const toast = { id: Date.now() + Math.random(), message: event.data.body || event.data.title || 'New notification' }
        return { ...prev, toasts: [...prev.toasts, toast] }
      })
      setTimeout(() => {
        setState(prev => ({ ...prev, toasts: prev.toasts.slice(1) }))
      }, 3000)

      authFetch('/notifications')
        .then(res => setState(prev => ({ ...prev, notifications: res.data || [] })))
        .catch(() => { })
    }

    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [authFetch])

  const unreadCount = useMemo(
    () => state.notifications.filter(n => !n.is_read).length,
    [state.notifications],
  )

  const isAuthenticated = Boolean(authUser)

  return (
    <GreenCareContext value={{ state, actions, isAuthenticated, unreadCount }}>
      {children}
    </GreenCareContext>
  )
}

export function useGreenCare() {
  const value = useContext(GreenCareContext)
  if (!value) throw new Error('useGreenCare must be used within GreenCareProvider')
  return value
}