import { fmtDateShort } from '../utils/date.js'
import { computeTaskStatus, taskIcon } from '../utils/plants.js'
import { useGreenCare } from '../context/GreenCareContext.jsx'

export function TaskRow({ task, plant }) {
  const { actions } = useGreenCare()
  const status = computeTaskStatus(task)
  const badgeClass = status === 'overdue' ? 'badge-overdue' : status === 'today' ? 'badge-today' : status === 'completed' ? 'badge-done' : 'badge-upcoming'
  const badgeText = status === 'overdue' ? 'Overdue' : status === 'today' ? 'Today' : status === 'completed' ? 'Done' : fmtDateShort(task.date)

  return (
    <div className={task.status === 'completed' ? 'task-row done' : 'task-row'}>
      <span className="t-icon">{taskIcon(task.type)}</span>
      <div className="t-body">
        <div className="t-title">{task.type} {plant?.name || ''}</div>
        <div className="t-sub">{plant?.species || ''} · {task.time}</div>
      </div>
      <span className={`badge ${badgeClass}`}>{badgeText}</span>
      {task.status !== 'completed' ? <button className="btn btn-primary btn-sm" type="button" onClick={() => actions.completeTask(task.id)}>Complete</button> : null}
    </div>
  )
}
