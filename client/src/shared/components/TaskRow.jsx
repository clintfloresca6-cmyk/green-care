import { fmtDateShort } from '../utils/date.js'
import { computeTaskStatus, taskIcon } from '../utils/plants.js'
import { useGreenCare } from '../context/GreenCareContext.jsx'

export function TaskRow({ task, plant, onEdit }) {
  const { actions } = useGreenCare()
  const status = computeTaskStatus(task)
  const badgeClass = status === 'overdue' ? 'badge-overdue' : status === 'today' ? 'badge-today' : status === 'completed' ? 'badge-done' : 'badge-upcoming'
  const badgeText = status === 'overdue' ? 'Overdue' : status === 'today' ? 'Today' : status === 'completed' ? 'Done' : (task.date && /^\d{4}-\d{2}-\d{2}$/.test(task.date) ? fmtDateShort(task.date) : 'Invalid Date')

  const handleCompleteTask = async () => {
    // First complete the current task
    await actions.completeTask(task.id)

    // If task is repeating, create a new instance
    if (task.is_repeating && task.is_repeating > 0) {
      // Calculate new date by adding repeatDays to current task date
      const currentDate = new Date(task.date)
      const newDate = new Date(currentDate.getTime() + (task.is_repeating * 24 * 60 * 60 * 1000))
      const newDateISO = newDate.toISOString().slice(0, 10)

      // Create new task with same properties but new date
      const newTask = {
        plant_id: task.plantId,
        type: task.type,
        task_date: newDateISO,
        task_time: task.task_time,
        priority: task.priority,
        status: 'pending', // New task starts as pending
        is_repeating: task.is_repeating
      }

      await actions.createTask(newTask)
    }

    // Create journal entry for task completion
    try {
      const journalPayload = {
        plant_id: task.plantId,
        entry_date: task.date,
        activity: `${task.type}ed`,
        notes: `Task "${task.type}" for plant "${plant?.name || ''}" completed on ${task.date}.`
      }
      await actions.createJournalEntry(journalPayload)
      console.log('Journal entry created for task completion:', journalPayload)
    } catch (journalError) {
      console.error('Failed to create journal entry:', journalError)
      // Don't throw - we still want the task to be marked as complete even if journal fails
    }
  }

  return (
    <div className={status === 'completed' ? 'task-row done' : 'task-row'}>
      <span className="t-icon"><img src={taskIcon(task.type)} /></span>
      <div className="t-body">
        <div className="t-title">{task.type} {plant?.name || ''}</div>
        <div className="t-sub">{plant?.species || ''} · {task.time}</div>
      </div>
      <span className={`badge ${badgeClass}`}>{badgeText}</span>
      {status !== 'completed' ? (
        <>
          <button className="btn btn-primary btn-sm me-2" type="button" onClick={handleCompleteTask}>
            Complete
          </button>
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => onEdit && onEdit(task)}>
            Edit
          </button>
        </>
      ) : null}
    </div>
  )
}
