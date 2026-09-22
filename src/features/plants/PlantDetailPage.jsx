import { goTo } from '../../app/routes.js'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { daysBetween, fmtDate, todayISO } from '../../shared/utils/date.js'
import { emojiFor, healthClass } from '../../shared/utils/plants.js'

export function PlantDetailPage({ plantId }) {
  const { state, actions } = useGreenCare()
  const plant = state.plants.find((item) => item.id === plantId)

  if (!plant) {
    return (
      <section className="page active">
        <button className="back-link" type="button" onClick={() => goTo('plants')}>← Back to My Plants</button>
        <p className="muted">This plant could not be found.</p>
      </section>
    )
  }

  const daysUntilCare = daysBetween(todayISO(), plant.nextTask.date)
  const progress = Math.max(4, Math.min(100, 100 - daysUntilCare * 20))
  const notes = state.journal.filter((entry) => entry.plantId === plant.id).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <section className="page active">
      <button className="back-link" type="button" onClick={() => goTo('plants')}>← Back to My Plants</button>
      <div className="detail-header">
        <div className="detail-photo">{plant.photo ? <img src={plant.photo} alt="" /> : emojiFor(plant.species)}</div>
        <div className="detail-info">
          <h1>{plant.name}</h1>
          <p className="muted">{plant.species} · 📍 {plant.location}</p>
          <span className={`badge badge-${healthClass(plant.health)}`} style={{ width: 'fit-content' }}>{plant.health}</span>
          <div className="detail-actions">
            <button className="btn btn-primary btn-sm" type="button" onClick={() => actions.quickCare(plant.id, 'Water')}>Water Plant</button>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => actions.quickCare(plant.id, 'Fertilize')}>Fertilize</button>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => actions.openModal('journal', { plantId: plant.id })}>Add Journal Entry</button>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => actions.openModal('updateHealth', { plantId: plant.id })}>Update Health</button>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => actions.openModal('editPlant', { plantId: plant.id })}>Edit Plant</button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => actions.openModal('confirmArchive', { plantId: plant.id })}>Archive Plant</button>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card">
            <div className="card-head"><h3>Care Information</h3></div>
            <div className="care-info-grid">
              <CareItem icon="💧" label="Watering" value={plant.watering} />
              <CareItem icon="☀" label="Light" value={plant.light} />
              <CareItem icon="🌡" label="Temperature" value="18-27°C ideal" />
              <CareItem icon="🌿" label="Fertilizing" value={plant.fertilizing} />
              <CareItem icon="🪴" label="Repotting" value="Every 1-2 years" />
              <CareItem icon="📍" label="Location" value={plant.location} />
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Plant Growth Timeline</h3></div>
            <div className="timeline">
              {plant.timeline.map((item, index) => (
                <div className="timeline-item" key={`${item.label}-${index}`}>
                  <span className="timeline-dot"></span>
                  <div className="timeline-body"><div>{item.label}</div><div className="timeline-date">{fmtDate(item.date)}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Notes</h3></div>
            {notes.length ? notes.map((note) => (
              <div className="note-item" key={note.id}>
                {note.notes || note.activity}
                <div className="note-meta">{note.activity} · {fmtDate(note.date)}</div>
              </div>
            )) : <p className="muted">No journal notes yet for this plant.</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Next Care</h3></div>
          <p style={{ fontSize: 14, marginBottom: 6 }}>
            {daysUntilCare < 0 ? <strong style={{ color: 'var(--brick-500)' }}>{plant.nextTask.type} overdue</strong> : daysUntilCare === 0 ? <strong>{plant.nextTask.type} due today</strong> : `${plant.nextTask.type} in ${daysUntilCare} day${daysUntilCare === 1 ? '' : 's'}`}
          </p>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>
          <p className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>Last watered {fmtDate(plant.lastWatered)}</p>
        </div>
      </div>
    </section>
  )
}

function CareItem({ icon, label, value }) {
  return (
    <div className="care-info-item">
      <span className="ci-icon">{icon}</span>
      <div><div className="ci-label">{label}</div><div className="ci-value">{value}</div></div>
    </div>
  )
}
