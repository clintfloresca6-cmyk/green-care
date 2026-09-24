import { useState } from 'react'
import { TaskRow } from '../../shared/components/TaskRow.jsx'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { fmtDate, fmtDateShort, todayISO } from '../../shared/utils/date.js'
import { computeTaskStatus, taskIcon } from '../../shared/utils/plants.js'

const taskFilters = ['all', 'today', 'upcoming', 'overdue', 'completed']

export function SchedulePage() {
  const { state, actions } = useGreenCare()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [selectedDate, setSelectedDate] = useState(null)
  const [filter, setFilter] = useState('all')
  const weekStart = state.settings.weekStart === 'sun' ? 0 : 1
  const weekdayNames = weekStart === 0 ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const firstDay = new Date(year, month, 1)
  let startOffset = firstDay.getDay() - weekStart
  if (startOffset < 0) startOffset += 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]
  const dayTasks = selectedDate ? state.tasks.filter((task) => task.date === selectedDate) : []
  let tasks = [...state.tasks].sort((a, b) => a.date.localeCompare(b.date))
  if (filter !== 'all') tasks = tasks.filter((task) => computeTaskStatus(task) === filter)

  function changeMonth(delta) {
    const next = new Date(year, month + delta, 1)
    setMonth(next.getMonth())
    setYear(next.getFullYear())
  }

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <h1>Care Schedule</h1>
          <p className="muted">Plan ahead and never miss a task.</p>
        </div>
      </div>

      <div className="schedule-grid">
        <div className="card calendar-card">
          <div className="calendar-head">
            <button className="icon-btn" type="button" onClick={() => changeMonth(-1)}>‹</button>
            <h3>{new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
            <button className="icon-btn" type="button" onClick={() => changeMonth(1)}>›</button>
          </div>
          <div className="calendar-weekdays">{weekdayNames.map((day) => <div key={day}>{day}</div>)}</div>
          <div className="calendar-grid">
            {cells.map((day, index) => {
              if (!day) return <div className="cal-cell empty" key={`empty-${index}`}></div>
              const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const tasksForDay = state.tasks.filter((task) => task.date === iso)
              return (
                <button className={`cal-cell ${iso === todayISO() ? 'today' : ''} ${iso === selectedDate ? 'selected' : ''}`} type="button" key={iso} onClick={() => setSelectedDate(iso)}>
                  <span className="cal-num">{day}</span>
                  <span className="cal-tasks">{tasksForDay.slice(0, 4).map((task) => taskIcon(task.type)).join('')}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>{selectedDate ? fmtDate(selectedDate) : 'Select a date'}</h3></div>
          <div className="task-list">
            {selectedDate ? dayTasks.length ? dayTasks.map((task) => <TaskRow task={task} plant={plantById(state, task.plantId)} key={task.id} />) : <p className="muted">No tasks scheduled for this date.</p> : <p className="muted">Pick a calendar date to inspect its care tasks.</p>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h3>Upcoming Tasks</h3>
          <div className="filter-pills">
            {taskFilters.map((item) => <button className={filter === item ? 'pill active' : 'pill'} type="button" key={item} onClick={() => setFilter(item)}>{label(item)}</button>)}
          </div>
        </div>
        <div className="task-table">
          <div className="task-table-row head"><div>Plant</div><div>Task</div><div>Date</div><div>Priority</div><div>Status</div><div></div></div>
          {tasks.map((task) => {
            const status = computeTaskStatus(task)
            const badgeClass = status === 'overdue' ? 'badge-overdue' : status === 'today' ? 'badge-today' : status === 'completed' ? 'badge-done' : 'badge-upcoming'
            return (
              <div className="task-table-row" key={task.id}>
                <div>{plantById(state, task.plantId)?.name || ''}</div>
                <div>{taskIcon(task.type)} {task.type}</div>
                <div>{fmtDateShort(task.date)}</div>
                <div><span className={`priority-dot priority-${task.priority}`}></span>{task.priority}</div>
                <div><span className={`badge ${badgeClass}`}>{label(status)}</span></div>
                <div>{task.status !== 'completed' ? <button className="btn btn-secondary btn-sm" type="button" onClick={() => actions.completeTask(task.id)}>Complete</button> : null}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function plantById(state, id) {
  return state.plants.find((plant) => plant.id === id)
}

function label(value) {
  return value[0].toUpperCase() + value.slice(1)
}
