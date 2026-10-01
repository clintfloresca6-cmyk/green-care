import { useState, useEffect } from 'react'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { emojiFor } from '../../shared/utils/plants.js'
import { ModalRenderer } from '../../shared/components/ModalRenderer.jsx'
import { Modal } from './Modal.jsx'

const filters = [
  ['all', 'All'],
  ['indoor', 'Indoor'],
  ['outdoor', 'Outdoor'],
  ['low', 'Low Light'],
  ['medium', 'Medium Light'],
  ['beginner', 'Beginner Friendly'],
]

export function LibraryPage() {
  const { state, actions } = useGreenCare()
  const [treflePlants, setTreflePlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPlantData, setModalPlantData] = useState(null)
  const query = search.trim().toLowerCase()

  // Fetch Trefle plants on mount or when filter/search changes
  useEffect(() => {
    const fetchTreflePlants = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${import.meta.env.VITE_API_URL}/trefle/plants?page=${Math.floor(offset / 10) + 1}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch Trefle plants: ${response.status}`)
        }

        const data = await response.json()
        const newPlants = data.data || []

        // If we're at the beginning (offset 0), replace the list; otherwise, append
        if (offset === 0) {
          setTreflePlants(newPlants)
        } else {
          setTreflePlants(prev => [...prev, ...newPlants])
        }

        // Check if there are more plants to load
        setHasMore(newPlants.length >= 10) // Assuming 10 per page
      } catch (err) {
        setError(err.message)
        setTreflePlants([])
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    }

    fetchTreflePlants()
  }, [offset, filter, search])

  // Reset to beginning when filter or search changes
  useEffect(() => {
    setOffset(0)
    setHasMore(true)
  }, [filter, search])

  // Filter and search plants
  let plants = [...treflePlants]

  if (filter === 'indoor') plants = plants.filter((item) => item.zone === 'indoor')
  if (filter === 'outdoor') plants = plants.filter((item) => item.zone === 'outdoor')
  if (filter === 'low') plants = plants.filter((item) => item.light === 'low')
  if (filter === 'medium') plants = plants.filter((item) => item.light === 'medium')
  if (filter === 'beginner') plants = plants.filter((item) => item.difficulty === 'Beginner')
  if (query) plants = plants.filter((item) => item.common_name.toLowerCase().includes(query) || item.scientific_name.toLowerCase().includes(query))

  return (
    <section className="page active" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="page-head">
        <div>
          <h1>Plant Library</h1>
          <p className="muted">Browse species from the Trefle plant database.</p>
        </div>
      </div>

      {error ? (
        <div className="toolbar" style={{ flexShrink: 0 }}>
          <div className="empty-state"><h3>Error loading data</h3><p>{error}</p></div>
        </div>
      ) : (
        <>
          <div className="toolbar" style={{ flexShrink: 0 }}>
            <div className="filter-pills">
              {filters.map(([id, label]) => (
                <button className={filter === id ? 'pill active' : 'pill'} type="button" key={id} onClick={() => setFilter(id)}>{label}</button>
              ))}
            </div>
            <div className="search-box">
              <span data-icon="search"></span>
              <input type="search" placeholder="Search species..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
          </div>

          {/* Scrollable library grid */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 28px'
          }}>
            <div className="library-grid">
              {plants.map((plant) => (
                <button className="species-card" type="button" key={plant.id} onClick={() => {
                  setModalPlantData(plant);
                  setModalOpen(true);
                }}>
                  {plant.photo_url ? (
                    <img
                      src={plant.photo_url}
                      alt={`${plant.common_name || 'Plant'} photo`}
                      className="species-icon"
                    />
                  ) : (
                    <div className="species-icon">{emojiFor(plant.common_name || '')}</div>
                  )}
                  <div className="species-name">{plant.common_name || 'Unknown'}</div>
                  <div className="species-sci">{plant.scientific_name || ''}</div>
                  <div className="species-tags">
                    <span className="tag">{plant.difficulty || 'Beginner'}</span>
                    <span className="tag">{plant.light || 'Unknown'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Show More Button - Centered */}
          {hasMore && (
            <div style={{
              textAlign: 'center',
              padding: '28px',
              flexShrink: 0
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => setOffset(prev => prev + 10)}
                disabled={loading}
                style={{
                  padding: '9px 18px',
                  fontSize: '13.5px',
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Loading...' : 'Show More'}
              </button>
            </div>
          )}
        </>
      )}
      {modalOpen && <Modal plantData={modalPlantData} onClose={() => {
        setModalOpen(false);
        setModalPlantData(null);
      }} />}
    </section>
  );
}