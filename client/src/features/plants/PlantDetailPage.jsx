import { goTo } from '../../app/routes.js'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { daysBetween, fmtDate, fmtDateShort, todayISO } from '../../shared/utils/date.js'
import { emojiFor, healthClass, computeTaskStatus, taskIcon } from '../../shared/utils/plants.js'
import { Modal } from './Modal.jsx'
import { useState } from 'react'
import locationIcon from '../../assets/location.svg'
import waterIcon from '../../assets/water.svg'
import lightIcon from '../../assets/light.svg'
import fertilizerIcon from '../../assets/fertilize.svg'

export function PlantDetailPage({ plantId }) {
  const { state, actions } = useGreenCare()
  const [modalOpen, setModalOpen] = useState(false)
  const plant = state.plants.find((item) => item.id === plantId)

  if (!plant) {
    return (
      <section className="page active">
        <button className="back-link" type="button" onClick={() => goTo('plants')}>← Back to My Plants</button>
        <p className="muted">This plant could not be found.</p>
      </section>
    )
  }

  // Calculate days until next task and progress from tasks
  const today = todayISO()
  const upcomingTasks = state.tasks
    .filter(task => task.plantId === plant.id && task.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const nextTask = upcomingTasks[0] || null
  let daysUntilCare = 0
  let progress = 0
  let nextTaskType = ''
  if (nextTask) {
    daysUntilCare = daysBetween(today, nextTask.date)
    progress = Math.max(4, Math.min(100, 100 - daysUntilCare * 20))
    nextTaskType = nextTask.type
  }
  // Get all tasks for this plant, sorted by date and time
  const plantTasks = state.tasks
    .filter(task => task.plantId === plant.id)
    .sort((a, b) => {
      // Sort by date first, then by time (treating 'Anytime' as latest)
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;
      // Handle time: 'Anytime' should be considered later than specific times
      if (a.time === 'Anytime') return 1;
      if (b.time === 'Anytime') return -1;
      return a.time.localeCompare(b.time);
    })

  const notes = state.journal.filter((entry) => entry.plantId === plant.id).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <section className="page active">
      <button className="back-link" type="button" onClick={() => goTo('plants')}>← Back to My Plants</button>
      <div className="detail-header">
        <div className="detail-photo">{plant.photo_url ? <img src={plant.photo_url} alt="" /> : emojiFor(plant.species_name)}</div>
        <div className="detail-info">
          <h1>{plant.name}</h1>
          <p className="muted">{plant.species_name} · <img src={locationIcon} alt="Location" className="detail-icon" style={{ width: '15px'}}/> {plant.location}</p>
          <span className={`badge badge-${healthClass(plant.health)}`} style={{ width: 'fit-content' }}>{plant.health}</span>
          <div className="detail-actions">
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setModalOpen(true)}>Add Journal Entry</button>
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
              <CareItem icon={waterIcon} label="Watering" value={plant.watering} />
              <CareItem icon={lightIcon} label="Light" value={plant.light} />
              <CareItem icon={fertilizerIcon} label="Fertilizing" value={plant.fertilizing} />
              <CareItem icon={locationIcon} label="Location" value={plant.location} />
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Plant Growth Timeline</h3></div>
            <div className="timeline">
              {(plant.timeline || []).map((item, index) => (
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

        {/* Next Care section - only show if nextTask exists */}
        {nextTask ? (
          <div className="card">
            <div className="card-head"><h3>Next Care</h3></div>
            <div className="task-info">
            <p style={{ fontSize: 14, marginBottom: 6 }}>
              {daysUntilCare < 0 ? <strong style={{ color: 'var(--brick-500)' }}>{nextTaskType} overdue</strong> : daysUntilCare === 0 ? <strong>{nextTaskType} due today</strong> : `${nextTaskType} in ${daysUntilCare} day${daysUntilCare === 1 ? '' : 's'}`}
            </p>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>
            <p className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>Last watered {fmtDate(plant.lastWatered)}</p>
          </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-head"><h3>Next Care</h3></div>
            <p className="muted">No upcoming tasks scheduled for this plant.</p>
          </div>
        )}
      </div>

      {
        modalOpen && (
          <Modal
            preselectPlantId={plant.id}
            onClose={() => setModalOpen(false)}
          />
        )
      }
      
    </section>
  )
}

function CareItem({ icon, label, value }) {
  return (
    <div className="care-info-item">
      <img src={icon} alt={label} className="ci-icon" />
      <div><div className="ci-label">{label}</div><div className="ci-value">{value}</div></div>
    </div>
  )
}