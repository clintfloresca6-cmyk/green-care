import { useState } from 'react'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { emojiFor, statusDotClass } from '../../shared/utils/plants.js'
import { Modal } from './Modal.jsx'
import { DiagnosisModal } from './DiagnosisModal.jsx'

export function HealthPage() {
  const { state } = useGreenCare()
  const issueNames = Object.keys(state.healthIssues)
  const [issue, setIssue] = useState(issueNames[0])
  const selected = state.healthIssues[issue]
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [modalPlantId, setModalPlantId] = useState(null)
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false)

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <h1>Plant Health</h1>
          <p className="muted">Monitor conditions and get quick guidance on common issues.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => {
          setShowDiagnosisModal(true)
        }}>📷 Diagnose a Plant</button>
      </div>

      {state.plants.length === 0 ? (
        <div className="empty-state">
          <p>You don't have any plants yet. Add your first plant to start tracking their health!</p>
          <button className="btn btn-primary" type="button" onClick={() => {
            // Navigate to plants page or show add plant modal
            // This would need to be implemented based on your routing
          }}>Add Your First Plant</button>
        </div>
      ) : (
        <div className="health-grid">
          {state.plants.map((plant) => (
            <div className="health-card" key={plant.id}>
              <div style={{ fontSize: 30, width: '70px', height: '70px', borderRadius: '8px' }}>{plant.photo_url ? <img src={plant.photo_url} alt="" className='plant-photo' /> : emojiFor(plant.species)}</div>
              <div style={{ fontWeight: 600 }}>{plant.name}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>{plant.species}</div>
              <div><span className={`health-status-dot ${statusDotClass(plant.health)}`}></span>{plant.health}</div>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => {
                setModalPlantId(plant.id)
                setShowHealthModal(true)
              }}>Update Health</button>
            </div>
          ))}
        </div>
      )}

      {showHealthModal && (
        <Modal preselectPlantId={modalPlantId} onClose={() => {
          setShowHealthModal(false)
          setModalPlantId(null)
        }} />
      )}

      {showDiagnosisModal && (
        <DiagnosisModal preselectPlantId={state.plants[0]?.id ?? null} onClose={() => {
          setShowDiagnosisModal(false)
        }} />
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-head"><h3>Common Issues</h3></div>
        <div className="issue-pills">
          {issueNames.map((name) => <button className={issue === name ? 'pill active' : 'pill'} type="button" key={name} onClick={() => setIssue(name)}>{name}</button>)}
        </div>
        {selected ? (
          <div className="issue-detail show">
            <h4 style={{ fontSize: 15, marginBottom: 6 }}>{issue}</h4>
            <strong style={{ fontSize: 12.5, color: 'var(--ink-600)' }}>Possible causes</strong>
            <ul>{selected.causes.map((item) => <li key={item}>{item}</li>)}</ul>
            <strong style={{ fontSize: 12.5, color: 'var(--ink-600)' }}>Basic recommendations</strong>
            <ul>{selected.tips.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
