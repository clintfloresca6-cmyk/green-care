import { goTo } from '../../app/routes.js'
import { TaskRow } from '../../shared/components/TaskRow.jsx'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { daysBetween, fmtDate, fmtDateShort, todayISO } from '../../shared/utils/date.js'
import { computeTaskStatus, emojiFor, taskIcon } from '../../shared/utils/plants.js'

export function DashboardPage() {
  const { state } = useGreenCare()
  const dueToday = state.tasks.filter((task) => computeTaskStatus(task) === 'today').length
  const completedThisWeek = state.tasks.filter((task) => task.status === 'completed' && daysBetween(task.date, todayISO()) <= 7 && daysBetween(task.date, todayISO()) >= 0).length
  const needsAttention = state.plants.filter((plant) => plant.health === 'Needs Attention' || plant.health === 'Critical').length
  const todays = state.tasks.filter((task) => task.date === todayISO() || computeTaskStatus(task) === 'overdue').sort((a, b) => a.date.localeCompare(b.date))
  const attentionPlants = state.plants.filter((plant) => plant.health === 'Needs Attention' || plant.health === 'Critical')
  const upcoming = state.tasks.filter((task) => task.status === 'pending' && daysBetween(todayISO(), task.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6)
  const stats = [
    { label: 'Total Plants', value: state.plants.length, icon: '🪴', bg: 'var(--sage-100)' },
    { label: 'Tasks Due Today', value: dueToday, icon: '⏰', bg: 'var(--clay-100)' },
    { label: 'Completed This Week', value: completedThisWeek, icon: '✓', bg: 'var(--sage-100)' },
    { label: 'Needs Attention', value: needsAttention, icon: '⚠', bg: 'var(--brick-100)' },
  ]

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <h1>{greetingText(state.profile.name)}</h1>
          <p className="muted">Let's keep your plants happy and healthy today.</p>
        </div>
        <div className="today-chip">{fmtDate(todayISO())}</div>
      </div>

      <div className="stat-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-top"><span className="stat-icon" style={{ background: stat.bg }}>{stat.icon}</span></div>
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="card span-2">
          <div className="card-head">
            <h3>Today's Care Tasks</h3>
            <button className="text-btn" type="button" onClick={() => goTo('schedule')}>View schedule</button>
          </div>
          <div className="task-list">
            {todays.length ? todays.map((task) => <TaskRow task={task} plant={plantById(state, task.plantId)} key={task.id} />) : <Empty title="Nothing due today" text="Enjoy the calm; check back tomorrow." />}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Plants Needing Attention</h3></div>
          <div className="attention-list">
            {attentionPlants.length ? attentionPlants.map((plant) => (
              <div className="attn-row" key={plant.id}>
                <span className="attn-thumb">{emojiFor(plant.species)}</span>
                <div className="attn-body">
                  <div className="attn-title">{plant.name}</div>
                  <div className="attn-sub">{plant.species} - {plant.notes || plant.health}</div>
                </div>
                <button className="btn btn-secondary btn-sm" type="button" onClick={() => goTo('plants', plant.id)}>View Plant</button>
              </div>
            )) : <p className="muted">All plants look healthy right now.</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Recent Activity</h3></div>
          <div className="activity-list">
            {state.activity.slice(0, 6).map((activity) => (
              <div className="activity-row" key={`${activity.text}-${activity.time}`}>
                <span className="activity-dot"></span>
                <div><div>{activity.text}</div><span className="activity-time">{activity.time}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card span-2">
          <div className="card-head"><h3>Upcoming Schedule</h3></div>
          <div className="upcoming-list">
            {upcoming.length ? upcoming.map((task) => {
              const plant = plantById(state, task.plantId)
              return (
                <div className="upcoming-row" key={task.id}>
                  <span className="upcoming-date">{fmtDateShort(task.date)}</span>
                  <span style={{ fontSize: 18 }}>{taskIcon(task.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{task.type} {plant?.name || ''}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{task.time}</div>
                  </div>
                </div>
              )
            }) : <p className="muted">No upcoming tasks scheduled.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

function greetingText(name) {
  const hour = new Date().getHours()
  const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  return `Good ${period}, ${name.split(' ')[0]} 🌱`
}

function plantById(state, id) {
  return state.plants.find((plant) => plant.id === id)
}

function Empty({ title, text }) {
  return <div className="empty-state"><h3>{title}</h3><p>{text}</p></div>
}
