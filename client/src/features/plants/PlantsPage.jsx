import { useState } from 'react'
import { goTo } from '../../app/routes.js'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { fmtDateShort } from '../../shared/utils/date.js'
import { emojiFor, healthClass, taskIcon } from '../../shared/utils/plants.js'

const filters = [
  ['all', 'All'],
  ['healthy', 'Healthy'],
  ['attention', 'Needs Attention'],
  ['indoor', 'Indoor'],
  ['outdoor', 'Outdoor'],
]

export function PlantsPage() {
  const { state, actions } = useGreenCare()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  let plants = [...state.plants]

  if (filter === 'healthy') plants = plants.filter((plant) => plant.health === 'Healthy' || plant.health === 'Good')
  if (filter === 'attention') plants = plants.filter((plant) => plant.health === 'Needs Attention' || plant.health === 'Critical')
  if (filter === 'indoor') plants = plants.filter((plant) => plant.zone === 'indoor')
  if (filter === 'outdoor') plants = plants.filter((plant) => plant.zone === 'outdoor')
  if (query) plants = plants.filter((plant) => [plant.name, plant.species, plant.location].some((value) => value.toLowerCase().includes(query)))

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <h1>My Plants</h1>
          <p className="muted">Your personal plant collection, all in one place.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => actions.openModal('addPlant')}>+ Add Plant</button>
      </div>

      <div className="toolbar">
        <div className="filter-pills">
          {filters.map(([id, label]) => (
            <button className={filter === id ? 'pill active' : 'pill'} key={id} type="button" onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>
        <div className="search-box">
          <span data-icon="search"></span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your plants..." />
        </div>
      </div>

      {plants.length ? (
        <div className="plant-grid">
          {plants.map((plant) => (
            <button className="plant-card" type="button" key={plant.id} onClick={() => goTo('plants', plant.id)}>
              <div className="plant-thumb" style={{ background: 'var(--sage-100)' }}>
                {plant.photo ? <img src={plant.photo} alt={plant.name} /> : emojiFor(plant.species)}
              </div>
              <div className="plant-card-body">
                <div className="plant-card-top">
                  <span className="plant-name">{plant.name}</span>
                  <span className={`badge badge-${healthClass(plant.health)}`}>{plant.health}</span>
                </div>
                <span className="plant-species">{plant.species}</span>
                <div className="plant-meta">
                  <span>📍 {plant.location}</span>
                  <span>{taskIcon(plant.nextTask.type)} Next: {plant.nextTask.type} · {fmtDateShort(plant.nextTask.date)}</span>
                  <span>💧 Last watered: {fmtDateShort(plant.lastWatered)}</span>
                </div>
                <div className="plant-card-actions">
                  <span className="btn btn-secondary btn-sm">View Details</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state"><h3>No plants match this view</h3><p>Try a different filter or search term, or add a new plant.</p></div>
      )}
    </section>
  )
}
