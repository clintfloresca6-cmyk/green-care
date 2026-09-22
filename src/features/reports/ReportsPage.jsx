import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { daysBetween, fmtDate, todayISO } from '../../shared/utils/date.js'
import { computeTaskStatus } from '../../shared/utils/plants.js'

const activityTypes = ['Watered', 'Fertilized', 'Pruned', 'Repotted', 'Cleaned', 'Checked Health']

export function ReportsPage() {
  const { state } = useGreenCare()
  const completed = state.tasks.filter((task) => task.status === 'completed').length
  const overdue = state.tasks.filter((task) => computeTaskStatus(task) === 'overdue').length
  const pending = Math.max(state.tasks.filter((task) => task.status === 'pending').length - overdue, 0)
  const totalTasks = state.tasks.length || 1
  const healthCounts = { Healthy: 0, Good: 0, 'Needs Attention': 0, Critical: 0 }
  state.plants.forEach((plant) => {
    healthCounts[plant.health] = (healthCounts[plant.health] || 0) + 1
  })
  const counts = activityTypes.map((type) => state.journal.filter((entry) => entry.activity === type && daysBetween(entry.date, todayISO()) <= 30).length)
  const maxCount = Math.max(1, ...counts)

  return (
    <section className="page active">
      <div className="page-head"><div><h1>Reports</h1><p className="muted">A look at how your plant care is trending.</p></div></div>
      <div className="reports-grid">
        <div className="card">
          <div className="card-head"><h3>Monthly Care Activity</h3></div>
          <div className="bar-chart">
            {activityTypes.map((type, index) => (
              <div className="bar-wrap" key={type}>
                <div className="bar" style={{ height: `${(counts[index] / maxCount) * 100 || 2}%` }} title={`${counts[index]}`}></div>
                <span className="bar-label">{type.slice(0, 4)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Task Completion</h3></div>
          <Horizontal label="Completed" value={completed} total={totalTasks} color="var(--moss-500)" />
          <Horizontal label="Pending" value={pending} total={totalTasks} color="var(--clay-500)" />
          <Horizontal label="Overdue" value={overdue} total={totalTasks} color="var(--brick-500)" />
        </div>

        <div className="card">
          <div className="card-head"><h3>Plant Health Overview</h3></div>
          <CountBar label="Healthy" value={healthCounts.Healthy} total={state.plants.length} color="#2E7D46" />
          <CountBar label="Good" value={healthCounts.Good} total={state.plants.length} color="var(--moss-500)" />
          <CountBar label="Needs Attention" value={healthCounts['Needs Attention']} total={state.plants.length} color="var(--clay-500)" />
          <CountBar label="Critical" value={healthCounts.Critical} total={state.plants.length} color="var(--brick-500)" />
        </div>

        <div className="card">
          <div className="card-head"><h3>Plant Growth Timeline</h3></div>
          <div className="timeline">
            {state.plants.slice(0, 5).map((plant) => (
              <div className="timeline-item" key={plant.id}>
                <span className="timeline-dot"></span>
                <div className="timeline-body"><div>{plant.name} added to collection</div><div className="timeline-date">{fmtDate(plant.added)}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Horizontal({ label, value, total, color }) {
  const pct = Math.round((value / total) * 100)
  return (
    <div className="h-bar-row">
      <span className="h-bar-label">{label}</span>
      <div className="h-bar-track"><div className="h-bar-fill" style={{ width: `${pct}%`, background: color }}></div></div>
      <span className="h-bar-value">{pct}%</span>
    </div>
  )
}

function CountBar({ label, value, total, color }) {
  const pct = total ? (value / total) * 100 : 0
  return (
    <div className="h-bar-row">
      <span className="h-bar-label">{label}</span>
      <div className="h-bar-track"><div className="h-bar-fill" style={{ width: `${pct}%`, background: color }}></div></div>
      <span className="h-bar-value">{value}</span>
    </div>
  )
}
