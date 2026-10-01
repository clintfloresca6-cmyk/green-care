import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from '../../features/auth/AuthContext'

// ─── Static Data (equivalent to mock data healthIssues) ────────────────────────
const HEALTH_ISSUES = {
  'Yellow Leaves': { causes: ['Overwatering', 'Insufficient light', 'Nutrient deficiency'], tips: ['Check soil moisture before watering again', 'Review watering frequency', 'Move the plant to appropriate lighting'] },
  Wilting: { causes: ['Underwatering', 'Root stress', 'Heat exposure'], tips: ['Water thoroughly and check drainage', 'Move away from direct heat sources', "Check roots aren't bound or rotting"] },
  Pests: { causes: ['Poor air circulation', 'Overwatering', 'Nearby infested plants'], tips: ['Isolate the affected plant', 'Wipe leaves with diluted neem oil', 'Improve airflow around the plant'] },
  'Brown Leaves': { causes: ['Low humidity', 'Mineral buildup from tap water', 'Sunburn'], tips: ['Increase humidity with a tray or misting', 'Use filtered or rested water', 'Move out of direct harsh sun'] },
  Overwatering: { causes: ['Watering on a fixed schedule', 'Poor drainage', 'Pot without drainage holes'], tips: ['Let soil dry before watering again', 'Ensure pots have drainage holes', 'Repot in well-draining soil if needed'] },
  Underwatering: { causes: ['Forgetting scheduled waterings', 'Fast-draining soil mix', 'Low humidity environment'], tips: ['Set reminders for consistent watering', 'Water deeply until it drains out the bottom', 'Group plants to raise local humidity'] },
}

// ─── Context ──────────────────────────────────────────────────────────────────
const GreenCareContext = createContext(null)

export function GreenCareProvider({ children }) {
  const { currentUser: authUser } = useAuth()
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
        settings: { careReminders: true, overdueReminders: true, healthAlerts: true, browserNotifs: false, theme: 'light', reminderTime: '08:00', weekStart: 'mon' },
        activity: [],
        adminReports: [],
        modal: null,
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
      settings: { careReminders: true, overdueReminders: true, healthAlerts: true, browserNotifs: false, theme: 'light', reminderTime: '08:00', weekStart: 'mon' },
      activity: [],
      adminReports: [],
      toasts: [],
      modal: null, // { type: string, props: object } | null
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
        const tasks = tasksData.data || []

        // Fetch journal entries
        const journalData = await authFetch('/journal')
        const journal = journalData.data || []

        // Fetch notifications
        const notificationsData = await authFetch('/notifications')
        const notifications = notificationsData.data || []

        // Fetch library species
        const libraryData = await authFetch('/library')
        const library = libraryData.data || []

        // Fetch admin reports (only for admins)
        let adminReports = []
        if (authUser.role === 'admin') {
          const adminData = await authFetch('/admin')
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
            time: new Date(entry.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          })),
          ...recentTasks.map(task => ({
            text: `${task.type} ${task.plant_id ? '(for plant)' : ''}`,
            time: new Date(task.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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
        throw new Error(errorData.error || `Request failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      throw error
    }
  }, [])

  const actions = {
    // Modal actions
    openModal: (type, props = {}) => {
      setState(prev => ({
        ...prev,
        modal: { type, props }
      }));
    },
    closeModal: () => {
      setState(prev => ({
        ...prev,
        modal: null
      }));
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
        setState(prev => ({ ...prev, tasks: result.data || [] }))
        return result.data || []
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
          tasks: [...prev.tasks, result.data]
        }))
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
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(task =>
            task.id === taskId ? result.data : task
          )
        }))
        return result.data
      } catch (error) {
        console.error('Failed to complete task:', error)
        throw error
      }
    },

    // Journal actions
    async listJournal() {
      try {
        const result = await authFetch('/journal')
        setState(prev => ({ ...prev, journal: result.data || [] }))
        return result.data || []
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
        setState(prev => ({
          ...prev,
          journal: [...prev.journal, result.data]
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
    }
  }

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