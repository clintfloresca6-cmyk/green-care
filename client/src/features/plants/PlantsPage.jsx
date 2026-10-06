import { useState } from 'react'
import { goTo } from '../../app/routes.js'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { fmtDateShort, todayISO } from '../../shared/utils/date.js'
import { emojiFor, healthClass, taskIcon } from '../../shared/utils/plants.js'
import { Modal } from '../../features/library/Modal.jsx'
import locationIcon from '../../assets/location.svg'

const filters = [
  ['all', 'All'],
  ['healthy', 'Healthy'],
  ['attention', 'Needs Attention'],
]

export function PlantsPage() {
  const { state, actions } = useGreenCare()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  let plants = Array.isArray(state.plants) ? state.plants.filter(plant => plant && plant.id) : []
  const [showAddPlantModal, setShowAddPlantModal] = useState(false)
  const [addPlantError, setAddPlantError] = useState('')
  const [addPlantProcessing, setAddPlantProcessing] = useState(false)

  const handleAddPlant = async (plantData) => {
    setAddPlantProcessing(true)
    setAddPlantError('')
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/plants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(plantData), // { name, speciesName, location, light, ... }
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to add plant: ${response.status}`)
      }

      // Reset form and close modal on success
      setShowAddPlantModal(false)
      setAddPlantError('')
      setAddPlantProcessing(false)
    } catch (err) {
      setAddPlantError('Failed to add plant. Please try again.')
      setAddPlantProcessing(false)
    }
  }

  if (filter === 'healthy') plants = plants.filter((plant) => plant.health === 'Healthy' || plant.health === 'Good')
  if (filter === 'attention') plants = plants.filter((plant) => plant.health === 'Needs Attention' || plant.health === 'Critical')
  if (query) plants = plants.filter((plant) => [plant.name, plant.species_name, plant.location].some((value) => value.toLowerCase().includes(query)))

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <h1>My Plants</h1>
          <p className="muted">Your personal plant collection, all in one place.</p>
        </div>
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
                {plant.photo_url ? <img src={plant.photo_url} alt={plant.name || 'Plant'} /> : emojiFor(plant.common_name || plant.species_name || '')}
              </div>
              <div className="plant-card-body">
                <div className="plant-card-top">
                  <span className="plant-name">{plant.name || 'Unnamed Plant'}</span>
                  <span className={`badge badge-${healthClass(plant.health || 'Good')}`}>
                    {plant.health || 'Good'}
                  </span>
                </div>
                <span className="plant-species">{plant.common_name || plant.species_name || 'Unknown Species'}</span>
                <div className="plant-meta">
                  <span className="plant-info">
                    <img src={locationIcon} alt="Location" className="plant-icon" />
                    {plant.location || 'Unknown location'}
                  </span>
                  <span className="plant-info">
                    {(() => {
                      const today = todayISO()
                      const upcomingTasks = state.tasks
                        .filter(task => task.plantId === plant.id && task.date >= today)
                        .sort((a, b) => a.date.localeCompare(b.date))
                      const nextTask = upcomingTasks[0]
                      return nextTask ? (
                        <>
                          {<img src={taskIcon(nextTask.type || 'Check')} alt={nextTask.type || 'Check'} className="plant-icon" />} Next: {nextTask.type || 'Check'} ·
                          {fmtDateShort(nextTask.date || todayISO())}
                        </>
                      ) : 'No upcoming tasks'
                    })()}
                  </span>
                  {/* <span>
                    💧 Last watered: {plant.lastWatered ? fmtDateShort(plant.lastWatered) : 'Never'}
                  </span> */}
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
      {showAddPlantModal && <Modal
        onAddPlant={handleAddPlant}
        onClose={() => {
          setShowAddPlantModal(false);
          setAddPlantError('');
          setAddPlantProcessing(false);
        }}
      />}
    </section>
  );
}