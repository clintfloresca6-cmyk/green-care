import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../features/auth/AuthContext'
import calendarIcon from '../../assets/calendar1.svg'
import warningIcon from '../../assets/warning.svg'
import locationIcon from '../../assets/location.svg'

// ─── Static Data (equivalent to mock data healthIssues) ────────────────────────
const HEALTH_ISSUES = {
  'Yellow Leaves': { causes: ['Overwatering', 'Insufficient light', 'Nutrient deficiency'], tips: ['Check soil moisture before watering again', 'Review watering frequency', 'Move the plant to appropriate lighting'] },
  Wilting: { causes: ['Underwatering', 'Root stress', 'Heat exposure'], tips: ['Water thoroughly and check drainage', 'Move away from direct heat sources', "Check roots aren't bound or rotting"] },
  Pests: { causes: ['Poor air circulation', 'Overwatering', 'Nearby infested plants'], tips: ['Isolate the affected plant', 'Wipe leaves with diluted neem oil', 'Improve airflow around the plant'] },
  'Brown Leaves': { causes: ['Low humidity', 'Mineral buildup from tap water', 'Sunburn'], tips: ['Increase humidity with a tray or misting', 'Use filtered or rested water', 'Move out of direct harsh sun'] },
  Overwatering: { causes: ['Watering on a fixed schedule', 'Poor drainage', 'Pot without drainage holes'], tips: ['Let soil dry before watering again', 'Ensure pots have drainage holes', 'Repot in well-draining soil if needed'] },
  Underwatering: { causes: ['Forgetting scheduled waterings', 'Fast-draining soil mix', 'Low humidity environment'], tips: ['Set reminders for consistent watering', 'Water deeply until it drains out the bottom', 'Group plants to raise local humidity'] }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const GreenCareContext = createContext(null)

// Convert an API journal row (snake_case) to the shape the UI expects
const toJournalEntry = (row) => ({
  ...row, // keeps created_at, which the activity feed uses
  plantId: row.plant_id,
  date: row.entry_date,
  photo: row.photo_url,
})

const toTask = (row) => ({
  ...row, // keeps status, priority, type, created_at, completed_at
  plantId: row.plant_id,
  date: row.task_date ? String(row.task_date).slice(0, 10) : null,
  time: row.task_time,
})

export function GreenCareProvider({ children }) {
  const { currentUser: authUser } = useAuth()

  // Get theme from localStorage with fallback to 'light'
  const getStoredTheme = () => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('greencare-theme')
      return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : 'light'
    }
    return 'light'
  }

  const [state, setState] = useState(() => {
    // If no auth user, return minimal state
    if (!authUser) {
      return {
        plants: [],
        tasks: [],
        journal: [],
        notifications: [],
        library: [],
        healthIssues: HEALTH_ISSUES,
        profile: null,
        settings: { careReminders: true, overdueReminders: true, healthAlerts: true, browserNotifs: false, theme: getStoredTheme(), reminderTime: '08:00', weekStart: 'mon' },
        activity: [],
        adminReports: [],
        toasts: [],
      }
    }

    // If auth user exists but we haven't fetched data yet, start with empty collections
    // They will be populated by the effect below
    return {
      plants: [],
      tasks: [],
      journal: [],
      notifications: [],
      library: [],
      healthIssues: HEALTH_ISSUES,
      profile: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        photo: authUser.photo || null,
      },
      settings: { careReminders: true, overdueReminders: true, healthAlerts: true, browserNotifs: false, theme: getStoredTheme(), reminderTime: '08:00', weekStart: 'mon' },
      activity: [],
      adminReports: [],
      toasts: [],
    }
  })

  // Fetch initial data when auth user changes (login/logout)
  useEffect(() => {
    if (!authUser) return

    // Fetch all initial data for the logged-in user
    const fetchInitialData = async () => {
      try {
        // Fetch plants
        const plantsData = await authFetch('/plants')
        const plants = plantsData.data || []

        // Fetch tasks
        const tasksData = await authFetch('/tasks')
        const tasks = (tasksData.data || []).map(toTask)

        // Fetch journal entries
        const journalData = await authFetch('/journal')
        const journal = (journalData.data || []).map(toJournalEntry)

        // Fetch notifications
        const notificationsData = await authFetch('/notifications')
        const notifications = notificationsData.data || []

        // Fetch library species
        const libraryData = await authFetch('/library')
        const library = libraryData.data || []

        // Fetch admin reports (only for admins)
        let adminReports = []
        if (authUser.role === 'admin') {
          const adminData = await authFetch('/admin/reports') // assuming endpoint for admin reports
          adminReports = adminData.data || []
        }

        // Update state with fetched data
        setState(prev => ({
          ...prev,
          plants,
          tasks,
          journal,
          notifications,
          library,
          adminReports,
          // Activity will be computed below
        }))

        // Compute activity from recent journal and tasks
        const recentJournal = [...journal].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3)
        const recentTasks = [...tasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3)
        const activity = [
          ...recentJournal.map(entry => ({
            text: entry.activity,
            time: new Date(entry.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } )
          })),
          ...recentTasks.map(task => ({
            text: `${task.type} ${task.plant_id ? '(for plant)' : ''}`,
            time: new Date(task.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } )
          }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8)

        setState(prev => ({ ...prev, activity }))

      } catch (error) {
        console.error('Failed to fetch initial data:', error)
        // Keep existing state if fetch fails
      }
    }

    fetchInitialData()
  }, [authUser])

  // Compute derived notifications based on current tasks (useMemo for pure computation)
  const derivedNotifications = useMemo(() => {
    if (!authUser) return []

    const today = new Date().toISOString().slice(0, 10)
    const todayDate = new Date(today)

    // Count tasks due today (not completed)
    const tasksDueToday = state.tasks.filter(task =>
      task.date === today &&
      task.status !== 'completed'
    ).length

    // Count overdue tasks (date < today and not completed)
    const overdueTasks = state.tasks.filter(task =>
      task.date &&
      new Date(task.date) < todayDate &&
      task.status !== 'completed'
    ).length

    // Count tasks due this week (next 7 days, not completed)
    const oneWeekFromToday = new Date()
    oneWeekFromToday.setDate(oneWeekFromToday.getDate() + 7)
    const oneWeekFromTodayISO = oneWeekFromToday.toISOString().slice(0, 10)

    const tasksDueThisWeek = state.tasks.filter(task =>
      task.date >= today &&
      task.date <= oneWeekFromTodayISO &&
      task.status !== 'completed'
    ).length

    // Create derived notifications array
    const derivedNotifications = []

    if (tasksDueToday > 0) {
      derivedNotifications.push({
        id: `derived-tasks-due-today`,
        text: `${tasksDueToday} task${tasksDueToday === 1 ? '' : 's'} due today`,
        icon: calendarIcon,
        notice_date: today,
        is_read: false,
        page: 'schedule'
      })
    }

    if (overdueTasks > 0) {
      derivedNotifications.push({
        id: `derived-overdue-tasks`,
        text: `${overdueTasks} overdue task${overdueTasks === 1 ? '' : 's'}`,
        icon: warningIcon,
        notice_date: today,
        is_read: false,
        page: 'schedule'
      })
    }

    if (tasksDueThisWeek > 0) {
      derivedNotifications.push({
        id: `derived-tasks-this-week`,
        text: `${tasksDueThisWeek} task${tasksDueThisWeek === 1 ? '' : 's'} due this week`,
        icon: calendarIcon,
        notice_date: today,
        is_read: false,
        page: 'schedule'
      })
    }

    return derivedNotifications
  }, [state.tasks, authUser])

  // Update state with derived notifications when they change
  useEffect(() => {
    // Update state with derived notifications
    // We'll merge them with existing notifications, giving derived ones stable IDs
    setState(prev => ({
      ...prev,
      notifications: [
        ...prev.notifications.filter(n => n.id && !n.id.startsWith('derived-')), // Remove old derived notifications
        ...derivedNotifications
      ]
    }))
  }, [derivedNotifications])

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('greencare-theme', state.settings.theme)
    }
  }, [state.settings.theme])

  // Helper to make authenticated fetch calls
  const authFetch = useCallback(async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        credentials: 'include',
        ...options
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || errorData.error || `Request failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      throw error
    }
  }, [])

  const actions = {
    // Modal actions (simplified - in a full app these would update modal state)
    openModal: (type, props = {}) => {
      console.log('Opening modal:', type, props)
    },
    closeModal: () => {
      console.log('Closing modal')
    },
    toast: (message) => {
      const toast = {
        id: Date.now() + Math.random(),
        message,
      };
      setState(prev => ({
        ...prev,
        toasts: [...prev.toasts, toast],
      }));
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          toasts: prev.toasts.filter(t => t.id !== toast.id),
        }));
      }, 3000);
    },
    resetData() {
      // This clears the data collections (plants, tasks, journal, notifications, library, activity, adminReports, toasts)
      setState(prev => ({
        ...prev,
        plants: [],
        tasks: [],
        journal: [],
        notifications: [],
        library: [],
        activity: [],
        adminReports: [],
        toasts: [],
      }))
    },

    // Plant actions
    async listPlants() {
      try {
        const result = await authFetch('/plants')
        setState(prev => ({ ...prev, plants: result.data || [] }))
        return result.data || []
      } catch (error) {
        console.error('Failed to list plants:', error)
        throw error
      }
    },

    async getPlant(plantId) {
      try {
        const result = await authFetch(`/plants/${plantId}`)
        return result.data
      } catch (error) {
        console.error('Failed to get plant:', error)
        throw error
      }
    },

    async createPlant(payload) {
      try {
        const result = await authFetch('/plants', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        // Update the plants list
        setState(prev => ({
          ...prev,
          plants: [...prev.plants, result.data]
        }))

        // Create event notification for plant added
        try {
          const notificationPayload = {
            id: `event-plant-added-${Date.now()}`,
            text: `Added new plant: ${payload.name || 'Unknown Plant'}`,
            icon: locationIcon, // Using location icon for plant events
            notice_date: new Date().toISOString().slice(0, 10),
            is_read: false,
            page: 'plants',
            plantId: result.data.id
          }
          // We don't await this as it's not critical if it fails
          this.addNotification(notificationPayload).catch(err => console.error('Failed to add plant notification:', err))
        } catch (notificationError) {
          console.error('Failed to create plant event notification:', notificationError)
        }

        return result.data
      } catch (error) {
        console.error('Failed to create plant:', error)
        throw error
      }
    },

    async updatePlant(plantId, patch) {
      try {
        const result = await authFetch(`/plants/${plantId}`, {
          method: 'PATCH',
          body: JSON.stringify(patch)
        })
        // Update the specific plant in the list
        setState(prev => ({
          ...prev,
          plants: prev.plants.map(plant =>
            plant.id === plantId ? result.data : plant
          )
        }))
        return result.data
      } catch (error) {
        console.error('Failed to update plant:', error)
        throw error
      }
    },

    async archivePlant(plantId) {
      try {
        await authFetch(`/plants/${plantId}`, {
          method: 'DELETE'
        })
        // Remove from plants list
        setState(prev => ({
          ...prev,
          plants: prev.plants.filter(plant => plant.id !== plantId)
        }))
      } catch (error) {
        console.error('Failed to archive plant:', error)
        throw error
      }
    },

    // Task actions
    async listTasks() {
      try {
        const result = await authFetch('/tasks')
        const tasks = (result.data || []).map(toTask)
        setState(prev => ({ ...prev, tasks }))
        return tasks
      } catch (error) {
        console.error('Failed to list tasks:', error)
        throw error
      }
    },

    async createTask(payload) {
      try {
        const result = await authFetch('/tasks', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        setState(prev => ({
          ...prev,
          tasks: [...prev.tasks, toTask(result.data)]
        }))

        // Create event notification for task created
        try {
          const notificationPayload = {
            id: `event-task-created-${Date.now()}`,
            text: `New task created: ${payload.type || 'Task'} for plant`,
            icon: calendarIcon, // Using calendar icon for task events
            notice_date: new Date().toISOString().slice(0, 10),
            is_read: false,
            page: 'schedule'
          }
          // We don't await this as it's not critical if it fails
          this.addNotification(notificationPayload).catch(err => console.error('Failed to add task notification:', err))
        } catch (notificationError) {
          console.error('Failed to create task event notification:', notificationError)
        }

        return result.data
      } catch (error) {
        console.error('Failed to create task:', error)
        throw error
      }
    },

    async completeTask(taskId) {
      try {
        const result = await authFetch(`/tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'completed' })
        })
        // Update the specific task
        const updated = toTask(result.data)
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(task =>
            task.id === taskId ? updated : task
          )
        }))
        return updated
      } catch (error) {
        console.error('Failed to complete task:', error)
        throw error
      }
    },

    // Journal actions
    async listJournal() {
      try {
        const result = await authFetch('/journal')
        const journal = (result.data || []).map(toJournalEntry)
        setState(prev => ({ ...prev, journal }))
        return journal
      } catch (error) {
        console.error('Failed to list journal:', error)
        throw error
      }
    },

    async createJournalEntry(payload) {
      try {
        const result = await authFetch('/journal', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        const entry = toJournalEntry(result.data)
        setState(prev => ({
          ...prev,
          journal: [...prev.journal, entry]
        }))
        // Also update activity
        const newActivity = {
          text: payload.activity,
          time: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        }
        setState(prev => ({
          ...prev,
          activity: [newActivity, ...prev.activity].slice(0, 8)
        }))
        return result.data
      } catch (error) {
        console.error('Failed to create journal entry:', error)
        throw error
      }
    },

    // Notification actions
    async listNotifications() {
      try {
        const result = await authFetch('/notifications')
        setState(prev => ({ ...prev, notifications: result.data || [] }))
        return result.data || []
      } catch (error) {
        console.error('Failed to list notifications:', error)
        throw error
      }
    },

    async markNotificationRead(notificationId) {
      try {
        await authFetch(`/notifications/${notificationId}`, {
          method: 'PATCH',
          body: JSON.stringify({ is_read: true })
        })
        // Update the specific notification
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(notif =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        }))
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
        throw error
      }
    },

    // Library actions
    async listLibrary() {
      try {
        const result = await authFetch('/library')
        setState(prev => ({ ...prev, library: result.data || [] }))
        return result.data || []
      } catch (error) {
        console.error('Failed to list library:', error)
        throw error
      }
    },

    // Trefle actions
    async searchTreflePlants(params = {}) {
      try {
        // Default params for consistency with existing library browsing
        const defaultParams = {
          page: 1,
          perPage: 10,
          query: ''
        }
        const searchParams = { ...defaultParams, ...params }

        const result = await authFetch(`/trefle/search?page=${searchParams.page}&per_page=${searchParams.perPage}&q=${encodeURIComponent(searchParams.query)}`)
        return result.data || []
      } catch (error) {
        console.error('Failed to search Trefle plants:', error)
        throw error
      }
    },

    // Settings actions
    async updateSettings(settingsPatch) {
      // Update the specific settings in the state locally
      setState(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...settingsPatch
        }
      }))
      return settingsPatch
    },

    // Profile actions
    async updateProfile(profilePatch) {
      // Update the specific profile fields in the state locally
      // Handle case where profile might be null (when no auth user)
      setState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...profilePatch } : { ...profilePatch }
      }))
      console.log( profilePatch)
      return profilePatch
    },

    // Event notifications actions
    async addNotification(notification) {
      try {
        // Add notification to state
        setState(prev => ({
          ...prev,
          notifications: [...prev.notifications, notification]
        }))
        return notification
      } catch (error) {
        console.error('Failed to add notification:', error)
        throw error
      }
    },

    // Report actions
    async createReport(payload) {
      try {
        const result = await authFetch('/reports', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        // Optionally update adminReports state if we want to show them immediately
        // For now, we just return the result
        return result.data
      } catch (error) {
        console.error('Failed to create report:', error)
        throw error
      }
    }
  }

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('greencare-theme', state.settings.theme)
    }
  }, [state.settings.theme])

  const isAuthenticated = Boolean(authUser)

  return (
    <GreenCareContext
      value={{
        state,
        actions,
        isAuthenticated
      }}
    >
      {children}
    </GreenCareContext>
  )
}

export function useGreenCare() {
  const value = useContext(GreenCareContext)
  if (!value) throw new Error('useGreenCare must be used within GreenCareProvider')
  return value
}