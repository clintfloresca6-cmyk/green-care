import { useState } from 'react'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { todayISO } from '../../shared/utils/date.js'

function inferRepeat(days) {
  if (!days || days <= 0) return { interval: '', unit: 'days' }
  if (days % 30 === 0) return { interval: days / 30, unit: 'months' }
  if (days % 7 === 0) return { interval: days / 7, unit: 'weeks' }
  return { interval: days, unit: 'days' }
}

export function ScheduleModal({ task, onClose }) {
  const { state, actions } = useGreenCare()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const initialRepeat = inferRepeat(task?.is_repeating)

  async function submit(event) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')

    try {
      const formData = Object.fromEntries(new FormData(event.currentTarget))

      const intervalNum = parseInt(formData.repeatInterval, 10)
      let repeatDays = 0
      if (!isNaN(intervalNum) && intervalNum > 0) {
        if (formData.repeatUnit === 'days') repeatDays = intervalNum
        else if (formData.repeatUnit === 'weeks') repeatDays = intervalNum * 7
        else if (formData.repeatUnit === 'months') repeatDays = intervalNum * 30
      }

      const payload = {
        plant_id: formData.plantId,
        type: formData.type,
        task_date: formData.date,
        task_time: formData.time || 'Anytime',
        priority: formData.priority,
        status: formData.status,
        is_repeating: repeatDays,
      }

      await actions.updateTask(task.id, payload)
      onClose && onClose()
    } catch (err) {
      console.error('Failed to update task:', err)
      setError(err.message || 'Failed to update task. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose && onClose()
      }}
    >
      <div className="modal">
        <div className="modal-head">
          <h3>Edit Task</h3>
          <button
            className="icon-btn"
            type="button"
            onClick={() => {
              actions.closeModal()
              if (onClose) onClose()
            }}
          >
            ×
          </button>
        </div>

        <form className="modal-body" onSubmit={submit}>
          <div className="form-grid">
            <div className="form-row">
              <label>Plant *</label>
              <select
                name="plantId"
                required
                defaultValue={task?.plantId || state.plants[0]?.id}
                disabled={submitting}
                style={{ width: '100%' }}
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
                defaultValue={task?.type || 'Water'}
                disabled={submitting}
                style={{ width: '100%' }}
              >
                <option value="Water">Water</option>
                <option value="Fertilize">Fertilize</option>
                <option value="Prune">Prune</option>
                <option value="Repot">Repot</option>
                <option value="Clean">Clean</option>
                <option value="Check">Check Health</option>
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
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-row">
              <label>Time</label>
              <input
                type="time"
                name="time"
                defaultValue={
                  task?.time && task.time !== 'Anytime' ? task.time : ''
                }
                disabled={submitting}
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-row">
              <label>Priority</label>
              <select
                name="priority"
                defaultValue={task?.priority || 'medium'}
                disabled={submitting}
                style={{ width: '100%' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-row">
              <label>Status</label>
              <select
                name="status"
                defaultValue={task?.status || 'pending'}
                disabled={submitting}
                style={{ width: '100%' }}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="skipped">Skipped</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <label>Repeat</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                name="repeatInterval"
                min="0"
                placeholder="Every (0 to disable)"
                defaultValue={initialRepeat.interval}
                style={{ width: '80px', minWidth: '80px' }}
                disabled={submitting}
              />
              <select
                name="repeatUnit"
                defaultValue={initialRepeat.unit}
                style={{ width: '100%' }}
                disabled={submitting}
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                actions.closeModal()
                if (onClose) onClose()
              }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}