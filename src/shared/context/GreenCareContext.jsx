import { createContext, useContext, useEffect, useState } from 'react'
import { buildDefaultState } from '../../data/mockData.js'
import { currentTimeLabel, todayISO } from '../utils/date.js'
import { computeTaskStatus, uid, waterFrequencyDays } from '../utils/plants.js'

const STORAGE_KEY = 'greencare_state_v2'
const GreenCareContext = createContext(null)

export function GreenCareProvider({ children }) {
  const [state, setState] = useState(loadState)
  const [modal, setModal] = useState(null)
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    document.documentElement.setAttribute('data-theme', state.settings.theme)
  }, [state])

  function toast(message) {
    const id = uid('toast')
    setToasts((items) => [...items, { id, message }])
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id))
    }, 2800)
  }

  function changeState(recipe) {
    setState((current) => {
      const next = structuredClone(current)
      recipe(next)
      return next
    })
  }

  const actions = {
    openModal: (type, props = {}) => setModal({ type, props }),
    closeModal: () => setModal(null),
    toast,
    resetData() {
      setState(buildDefaultState())
      toast('Prototype data reset')
    },

    completeTask(taskId) {
      changeState((draft) => {
        const task = draft.tasks.find((item) => item.id === taskId)
        if (!task) return
        task.status = 'completed'
        const plant = draft.plants.find((item) => item.id === task.plantId)
        if (plant) {
          if (task.type === 'Water') plant.lastWatered = todayISO()
          draft.activity.unshift({
            text: `${task.type === 'Water' ? 'Watered' : `${task.type}d`} ${plant.name}`,
            time: `${todayISO()} · ${currentTimeLabel()}`,
          })
        }
      })
      toast('Task marked complete')
    },
    addPlant(payload) {
      const waterDays = waterFrequencyDays(payload.watering)
      const id = uid('p')
      changeState((draft) => {
        const plant = {
          id,
          name: payload.name,
          species: payload.species,
          location: payload.location || 'Unspecified',
          zone: /balcon|outdoor|garden|patio/i.test(payload.location || '') ? 'outdoor' : 'indoor',
          light: payload.light,
          watering: payload.watering,
          fertilizing: payload.fertilizing,
          health: 'Good',
          lastWatered: todayISO(),
          nextTask: { type: 'Water', date: todayISO(waterDays) },
          notes: payload.notes || '',
          photo: payload.photo || null,
          added: todayISO(),
          timeline: [{ label: 'Plant added', date: todayISO() }],
        }
        draft.plants.unshift(plant)
        draft.tasks.push({
          id: uid('t'),
          plantId: id,
          type: 'Water',
          date: todayISO(waterDays),
          time: draft.settings.reminderTime || '08:00',
          status: 'pending',
          priority: 'medium',
        })
        draft.activity.unshift({ text: `Added ${plant.name} to My Plants`, time: `${todayISO()} · ${currentTimeLabel()}` })
      })
      setModal(null)
      toast('Plant added successfully')
      return id
    },
    editPlant(payload) {
      changeState((draft) => {
        const plant = draft.plants.find((item) => item.id === payload.id)
        if (!plant) return
        plant.name = payload.name
        plant.species = payload.species
        plant.location = payload.location
        plant.health = payload.health
        plant.notes = payload.notes
      })
      setModal(null)
      toast('Plant details updated')
    },
    archivePlant(plantId) {
      changeState((draft) => {
        draft.plants = draft.plants.filter((plant) => plant.id !== plantId)
        draft.tasks = draft.tasks.filter((task) => task.plantId !== plantId)
      })
      setModal(null)
      toast('Plant archived')
    },
    quickCare(plantId, type) {
      changeState((draft) => {
        const plant = draft.plants.find((item) => item.id === plantId)
        if (!plant) return
        const nextDays = type === 'Water' ? 7 : 30
        if (type === 'Water') plant.lastWatered = todayISO()
        plant.nextTask = { type, date: todayISO(nextDays) }
        plant.timeline.push({ label: type === 'Water' ? 'Watered' : 'Fertilized', date: todayISO() })
        draft.journal.unshift({
          id: uid('j'),
          plantId,
          activity: type === 'Water' ? 'Watered' : 'Fertilized',
          date: todayISO(),
          notes: `${type} completed from plant details.`,
          photo: null,
        })
        draft.activity.unshift({ text: `${type === 'Water' ? 'Watered' : 'Fertilized'} ${plant.name}`, time: `${todayISO()} · ${currentTimeLabel()}` })
      })
      toast(`${type} logged`)
    },
    addJournal(payload) {
      changeState((draft) => {
        const plant = draft.plants.find((item) => item.id === payload.plantId)
        const entry = {
          id: uid('j'),
          plantId: payload.plantId,
          activity: payload.activity,
          date: payload.date || todayISO(),
          notes: payload.notes || '',
          photo: payload.photo || null,
        }
        draft.journal.unshift(entry)
        if (plant) {
          plant.timeline.push({ label: entry.activity, date: entry.date })
          draft.activity.unshift({ text: `${entry.activity} ${plant.name}`, time: `${entry.date} · ${currentTimeLabel()}` })
        }
      })
      setModal(null)
      toast('Journal entry added')
    },
    updateHealth(payload) {
      changeState((draft) => {
        const plant = draft.plants.find((item) => item.id === payload.id)
        if (!plant) return
        plant.health = payload.health
        plant.timeline.push({ label: 'Health updated', date: todayISO() })
        draft.activity.unshift({ text: `Updated ${plant.name} health`, time: `${todayISO()} · ${currentTimeLabel()}` })
        if (payload.note) {
          draft.journal.unshift({
            id: uid('j'),
            plantId: plant.id,
            activity: 'Checked Health',
            date: todayISO(),
            notes: payload.note,
            photo: null,
          })
        }
      })
      setModal(null)
      toast('Plant health updated')
    },
    updateSettings(patch) {
      changeState((draft) => {
        draft.settings = { ...draft.settings, ...patch }
      })
      toast('Settings updated')
    },
    updateProfile(patch) {
      changeState((draft) => {
        draft.profile = { ...draft.profile, ...patch }
      })
      toast('Profile saved')
    },
    markNotificationRead(id) {
      changeState((draft) => {
        const notice = draft.notifications.find((item) => item.id === id)
        if (notice) notice.read = true
      })
    },
    markAllRead() {
      changeState((draft) => {
        draft.notifications.forEach((notice) => {
          notice.read = true
        })
      })
      toast('All notifications marked as read')
    },
    clearNotifications() {
      changeState((draft) => {
        draft.notifications = []
      })
      toast('Notifications cleared')
    },
    saveSpecies(payload) {
      changeState((draft) => {
        if (payload.id) {
          const item = draft.library.find((species) => species.id === payload.id)
          if (item) Object.assign(item, payload)
        } else {
          draft.library.push({
            id: uid('s'),
            common: payload.common,
            scientific: payload.scientific,
            difficulty: payload.difficulty,
            light: payload.light,
            watering: payload.watering,
            fertilizing: 'Monthly',
            zone: 'indoor',
            lightLevel: 'medium',
            description: 'Added via the admin console.',
            problems: ['General care sensitivity'],
            tips: ['Follow the watering and light guidance above.'],
          })
        }
      })
      setModal(null)
      toast(payload.id ? 'Species updated' : 'Species added')
    },
    deleteSpecies(id) {
      changeState((draft) => {
        draft.library = draft.library.filter((species) => species.id !== id)
      })
      setModal(null)
      toast('Species deleted')
    },
    updateReport(id, status) {
      changeState((draft) => {
        const report = draft.adminReports.find((item) => item.id === id)
        if (report) report.status = status
      })
      toast(status === 'resolved' ? 'Report resolved' : 'Report dismissed')
    },
  }

  const unreadCount = state.notifications.filter((notice) => !notice.read).length
  const value = { state, actions, modal, toasts, unreadCount, computeTaskStatus }

  return <GreenCareContext value={value}>{children}</GreenCareContext>
}

export function useGreenCare() {
  const value = useContext(GreenCareContext)
  if (!value) throw new Error('useGreenCare must be used within GreenCareProvider')
  return value
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : buildDefaultState()
  } catch {
    return buildDefaultState()
  }
}
