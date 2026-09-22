import { useState } from 'react'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { emojiFor, statusDotClass } from '../../shared/utils/plants.js'

export function HealthPage() {
  const { state, actions } = useGreenCare()
  const issueNames = Object.keys(state.healthIssues)
  const [issue, setIssue] = useState(issueNames[0])
  const selected = state.healthIssues[issue]

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <h1>Plant Health</h1>
          <p className="muted">Monitor conditions and get quick guidance on common issues.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => actions.openModal('diagnosis')}>📷 Diagnose a Plant</button>
      </div>

      <div className="health-grid">
        {state.plants.map((plant) => (
          <div className="health-card" key={plant.id}>
            <div style={{ fontSize: 30 }}>{plant.photo ? <img src={plant.photo} alt="" className='plant-photo' /> : emojiFor(plant.species)}</div>
            <div style={{ fontWeight: 600 }}>{plant.name}</div>
            <div className="muted" style={{ fontSize: 12.5 }}>{plant.species}</div>
            <div><span className={`health-status-dot ${statusDotClass(plant.health)}`}></span>{plant.health}</div>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => actions.openModal('updateHealth', { plantId: plant.id })}>Update Health</button>
          </div>
        ))}
      </div>

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
