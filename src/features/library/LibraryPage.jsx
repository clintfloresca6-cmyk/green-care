import { useState } from 'react'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { emojiFor } from '../../shared/utils/plants.js'

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
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  let species = [...state.library]

  if (filter === 'indoor') species = species.filter((item) => item.zone === 'indoor')
  if (filter === 'outdoor') species = species.filter((item) => item.zone === 'outdoor')
  if (filter === 'low') species = species.filter((item) => item.lightLevel === 'low')
  if (filter === 'medium') species = species.filter((item) => item.lightLevel === 'medium')
  if (filter === 'beginner') species = species.filter((item) => item.difficulty === 'Beginner')
  if (query) species = species.filter((item) => item.common.toLowerCase().includes(query) || item.scientific.toLowerCase().includes(query))

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <h1>Plant Library</h1>
          <p className="muted">Browse species and their care requirements.</p>
        </div>
      </div>

      <div className="toolbar">
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

      {species.length ? (
        <div className="library-grid">
          {species.map((item) => (
            <button className="species-card" type="button" key={item.id} onClick={() => actions.openModal('species', { speciesId: item.id })}>
              <div className="species-icon">{emojiFor(item.common)}</div>
              <div className="species-name">{item.common}</div>
              <div className="species-sci">{item.scientific}</div>
              <div className="species-tags">
                <span className="tag">{item.difficulty}</span>
                <span className="tag">{item.light}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state"><h3>No species match</h3><p>Try a different search or filter.</p></div>
      )}
    </section>
  )
}
