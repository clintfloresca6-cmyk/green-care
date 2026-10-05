import { useState, useEffect } from 'react'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { emojiFor } from '../../shared/utils/plants.js'
import { Modal } from './Modal.jsx'


export function LibraryPage() {
  const { state, actions } = useGreenCare()
  const [treflePlants, setTreflePlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPlantData, setModalPlantData] = useState(null)

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
  }, [offset, search])

  // Reset to beginning when search changes
  useEffect(() => {
    setOffset(0)
    setHasMore(true)
  }, [search])

  // Filter and search plants
  let plants = [...treflePlants]
  if (search) plants = plants.filter((item) => item.common_name.toLowerCase().includes(search) || item.scientific_name.toLowerCase().includes(search))

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
                <button className="species-card" type="button" key={plant.id} onClick={async () => {
                  try {
                    // Fetch specific species data using the new endpoint
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/trefle/species/${plant.id}`, {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      credentials: 'include',
                    })

                    if (!response.ok) {
                      throw new Error(`Failed to fetch species data: ${response.status}`)
                    }

                    const data = await response.json()
                    setModalPlantData(data.data || null)
                    setModalOpen(true)
                  } catch (err) {
                    console.error('Error fetching species data:', err)
                    // Fallback to pre-fetched data if API call fails
                    setModalPlantData(plant)
                    setModalOpen(true)
                  }
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
      {modalOpen && <Modal
        plantData={modalPlantData}
        onClose={() => {
          setModalOpen(false);
          setModalPlantData(null);
        }}
        onAddPlant={async (plantData) => {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/plants`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(plantData), // { name, speciesName, location, light, ... }
            });

            if (!response.ok) {
              const body = await response.json().catch(() => ({}));
              throw new Error(body.error || `Failed to add plant: ${response.status}`);
            }

            setModalOpen(false);
            setModalPlantData(null);
          } catch (err) {
            console.error('Failed to add plant:', err);
            throw err; // rethrow so AddPlantModal shows its error message
          }
        }}
        showAddPlantButton={true}
      />}
    </section>
  );
}