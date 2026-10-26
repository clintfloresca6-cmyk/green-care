import { useState } from 'react'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { todayISO } from '../../shared/utils/date.js'

// Helper to convert stored repeating days back into a readable interval/unit
function inferRepeat(days) {
  if (!days || days <= 0) return { interval: '', unit: 'days' }
  if (days % 30 === 0) return { interval: days / 30, unit: 'months' }
  if (days % 7 === 0) return { interval: days / 7, unit: 'weeks' }
  return { interval: days, unit: 'days' }
}

export function ScheduleModal({ preselectPlantId, task, onClose }) {
  const { state, actions } = useGreenCare()
  const isEdit = Boolean(task)
  const initialRepeat = inferRepeat(task?.is_repeating)

  // Initialize with task data if editing, otherwise use preselect or first plant
  const [plantId, setPlantId] = useState(task?.plantId || preselectPlantId || state.plants[0]?.id || '')
  const [type, setType] = useState(task?.type || 'Water')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Find selected plant for recommendation text
  const selectedPlant = state.plants.find(p => p.id === plantId)

  let recommendationText = null
  if (selectedPlant) {
    if (type === 'Water' && selectedPlant.watering) {
      recommendationText = `Water ${selectedPlant.watering.toLowerCase()}`
    } else if (type === 'Fertilize' && selectedPlant.fertilizing) {
      recommendationText = `Fertilize ${selectedPlant.fertilizing.toLowerCase()}`
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')

    try {
      const formData = Object.fromEntries(new FormData(event.currentTarget))
      const repeatInterval = formData.repeatInterval
      const repeatUnit = formData.repeatUnit
      let repeatDays = 0

      if (repeatInterval) {
        const intervalNum = parseInt(repeatInterval, 10)
        if (!isNaN(intervalNum) && intervalNum > 0) {
          if (repeatUnit === 'days') {
            repeatDays = intervalNum
          } else if (repeatUnit === 'weeks') {
            repeatDays = intervalNum * 7
          } else if (repeatUnit === 'months') {
            repeatDays = intervalNum * 30
          }
        }
      }

      const payload = {
        plant_id: formData.plantId,
        type: formData.type,
        task_date: formData.date,
        task_time: formData.time || 'Anytime',
        priority: formData.priority,
        status: formData.status,
        is_repeating: repeatDays
      }

      // Call update if editing, create if new
      if (isEdit) {
        await actions.updateTask(task.id, payload)
      } else {
        await actions.createTask(payload)
      }

      if (onClose) onClose()
    } catch (err) {
      console.error('Failed to save task:', err)
      setError(err.message || 'Failed to save task. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) onClose && onClose()
    }}>
      <div className="modal">
        <div className="modal-head">
          <h3>{isEdit ? 'Edit Task' : 'New Task'}</h3>
          <button className="icon-btn" type="button" onClick={() => {
            actions.closeModal()
            if (onClose) onClose()
          }}>×</button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div className="form-grid">
            <div className="form-row">
              <label>Plant *</label>
              <select
                name="plantId"
                required
                value={plantId}
                onChange={(e) => setPlantId(e.target.value)}
                disabled={submitting}
              >
                {state.plants.map((plant) => (
                  <option value={plant.id} key={plant.id}>
                    {plant.name} - {plant.species_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Task Type *</label>
              <select
                name="type"
                required
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={submitting}
              >
                <option value="Water">Water</option>
                <option value="Fertilize">Fertilize</option>
                <option value="Prune">Prune</option>
                <option value="Repot">Repot</option>
                <option value="Clean">Clean</option>
                <option value="Rotate">Rotate</option>
              </select>
            </div>
            <div className="form-row">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                required
                defaultValue={task?.date || todayISO()}
                disabled={submitting}
              />
            </div>
            <div className="form-row">
              <label>Time</label>
              <input
                type="time"
                name="time"
                defaultValue={task?.time && task.time !== 'Anytime' ? task.time : ''}
                disabled={submitting}
              />
            </div>
            <div className="form-row">
              <label>Priority</label>
              <select name="priority" defaultValue={task?.priority || 'medium'} disabled={submitting}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-row">
              <label>Status</label>
              <select name="status" defaultValue={task?.status || 'pending'} disabled={submitting}>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="skipped">Skipped</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <label>Repeat</label>
            {/* Recommendation Text */}
            {recommendationText && (
              <div style={{
                fontSize: '12.5px',
                color: 'var(--moss-500)',
                marginTop: '4px',
                fontStyle: 'italic'
              }}>
                Recommended: {recommendationText}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                name="repeatInterval"
                min="0"
                placeholder="Every (0 to disable)"
                style={{ width: '80px' }}
                defaultValue={initialRepeat.interval}
                disabled={submitting}
              />
              <select name="repeatUnit" defaultValue={initialRepeat.unit} style={{ width: '100%' }} disabled={submitting}>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => {
              actions.closeModal()
              if (onClose) onClose()
            }} disabled={submitting}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Save Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}