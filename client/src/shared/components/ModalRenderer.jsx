import { useEffect, useState } from 'react'
import { goTo } from '../../app/routes.js'
import { useAuth } from '../../features/auth/AuthContext.jsx'
import { useGreenCare } from '../context/GreenCareContext.jsx'
import { todayISO } from '../utils/date.js'

const diagnosisResults = [
  { issue: 'Overwatering', confidence: 86, causes: ['Soil staying wet too long', 'Insufficient drainage'], actions: ['Let the soil dry before watering', 'Check drainage holes', 'Remove any mushy roots'] },
  { issue: 'Underwatering', confidence: 78, causes: ['Dry potting mix', 'Heat exposure'], actions: ['Water deeply', 'Move away from direct heat', 'Inspect roots for damage'] },
  { issue: 'Pest Activity', confidence: 71, causes: ['Poor air circulation', 'Nearby infested plants'], actions: ['Isolate the plant', 'Treat with diluted neem oil', 'Improve airflow'] },
  { issue: 'Nutrient Deficiency', confidence: 64, causes: ['Depleted soil', 'Irregular fertilizing schedule'], actions: ['Apply a balanced fertilizer', 'Check fertilizing frequency', 'Consider repotting with fresh soil'] },
]

export function ModalRenderer() {
  const { modal, actions, state } = useGreenCare()
  const { logout } = useAuth()

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') actions.closeModal()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [actions])

  if (!modal) return null

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) actions.closeModal()
    }}>
      {modal.type === 'addPlant' ? <AddPlantModal prefill={modal.props} /> : null}
      {modal.type === 'journal' ? <JournalModal preselectPlantId={modal.props.plantId} /> : null}
      {modal.type === 'species' ? <SpeciesModal speciesId={modal.props.speciesId} /> : null}
      {modal.type === 'editPlant' ? <EditPlantModal plantId={modal.props.plantId} /> : null}
      {modal.type === 'updateHealth' ? <UpdateHealthModal plantId={modal.props.plantId} /> : null}
      {modal.type === 'diagnosis' ? <DiagnosisModal /> : null}
      {modal.type === 'speciesAdmin' ? <SpeciesAdminModal speciesId={modal.props.speciesId} /> : null}
      {modal.type === 'confirmArchive' ? (
        <ConfirmModal
          title="Archive this plant?"
          message="It will be moved out of My Plants. You cannot undo this in the prototype."
          actionLabel="Archive"
          onConfirm={() => {
            actions.archivePlant(modal.props.plantId)
            goTo('plants')
          }}
        />
      ) : null}
      {modal.type === 'confirmDeleteSpecies' ? (
        <ConfirmModal
          title="Delete this species?"
          message="It will be removed from the Plant Library reference list."
          actionLabel="Delete"
          onConfirm={() => actions.deleteSpecies(modal.props.speciesId)}
        />
      ) : null}
      {modal.type === 'confirmReset' ? (
        <ConfirmModal
          title="Reset all prototype data?"
          message="This restores the original mock data and clears anything added in this browser."
          actionLabel="Reset"
          onConfirm={actions.resetData}
        />
      ) : null}
      {modal.type === 'confirmLogout' ? (
        <ConfirmModal
          title="Log out of GreenCare?"
          message="You will be returned to the login screen."
          actionLabel="Log out"
          onConfirm={() => {
            actions.closeModal()
            logout()
            window.location.hash = '#/dashboard'
          }}
        />
      ) : null}
      {modal.type === 'noop' ? (
        <ConfirmModal
          title="Prototype action"
          message={modal.props.message || 'This action is simulated in the frontend prototype.'}
          actionLabel="Okay"
          onConfirm={actions.closeModal}
        />
      ) : null}
      <datalist id="speciesOptions">
        {state.library.map((species) => <option value={species.common} key={species.id} />)}
      </datalist>
    </div>
  )
}

function ModalFrame({ title, children, small = false }) {
  const { actions } = useGreenCare()
  return (
    <div className={small ? 'modal modal--sm' : 'modal'}>
      <div className="modal-head">
        <h3>{title}</h3>
        <button className="icon-btn" type="button" onClick={actions.closeModal}>×</button>
      </div>
      {children}
    </div>
  )
}

function AddPlantModal({ prefill }) {
  const { actions } = useGreenCare()
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    if (!data.name.trim() || !data.species.trim()) {
      setError('Please give your plant a name and a species before saving.')
      return
    }
    actions.addPlant({ ...data, photo })
  }

  return (
    <ModalFrame title="Add a Plant">
      <form className="modal-body" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Plant Name *"><input name="name" required placeholder="e.g. Luna" /></Field>
          <Field label="Species *"><input name="species" required placeholder="e.g. Monstera Deliciosa" list="speciesOptions" defaultValue={prefill.species || ''} /></Field>
          <Field label="Location"><input name="location" placeholder="e.g. Living Room Window" /></Field>
          <Field label="Light Condition"><Select name="light" options={['Bright Indirect', 'Low Light', 'Full Sun', 'Partial Shade', 'Medium Light']} value={prefill.light} /></Field>
          <Field label="Watering Frequency"><Select name="watering" options={['Every 3 days', 'Weekly', 'Every 10 days', 'Every 2 weeks']} value={prefill.watering} /></Field>
          <Field label="Fertilizing Frequency"><Select name="fertilizing" options={['Monthly', 'Every 2 weeks', 'Every 6 weeks', 'Seasonal']} value={prefill.fertilizing} /></Field>
        </div>
        <Field label="Notes"><textarea name="notes" rows="2" placeholder="Anything worth remembering about this plant"></textarea></Field>
        <PhotoInput label="Plant Photo" photo={photo} setPhoto={setPhoto} />
        {error ? <p className="form-error">{error}</p> : null}
        <ModalActions submitLabel="Add Plant" />
      </form>
    </ModalFrame>
  )
}

function JournalModal({ preselectPlantId }) {
  const { state, actions } = useGreenCare()
  const [photo, setPhoto] = useState(null)

  function submit(event) {
    event.preventDefault()
    actions.addJournal({ ...Object.fromEntries(new FormData(event.currentTarget)), photo })
  }

  return (
    <ModalFrame title="New Journal Entry">
      <form className="modal-body" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Plant *">
            <select name="plantId" required defaultValue={preselectPlantId || state.plants[0]?.id}>
              {state.plants.map((plant) => <option value={plant.id} key={plant.id}>{plant.name} - {plant.species}</option>)}
            </select>
          </Field>
          <Field label="Activity *">
            <Select name="activity" options={['Watered', 'Fertilized', 'Pruned', 'Repotted', 'Cleaned', 'Checked Health', 'Other']} />
          </Field>
          <Field label="Date"><input type="date" name="date" defaultValue={todayISO()} /></Field>
        </div>
        <Field label="Notes"><textarea name="notes" rows="3" placeholder="What did you notice?"></textarea></Field>
        <PhotoInput label="Photo" photo={photo} setPhoto={setPhoto} />
        <ModalActions submitLabel="Save Entry" />
      </form>
    </ModalFrame>
  )
}

function SpeciesModal({ speciesId }) {
  const { state, actions } = useGreenCare()
  const species = state.library.find((item) => item.id === speciesId)
  if (!species) return null

  return (
    <ModalFrame title={species.common}>
      <div className="modal-body">
        <div className="species-icon" style={{ fontSize: 36, width: 70, height: 70 }}>🌱</div>
        <p className="muted" style={{ fontStyle: 'italic', margin: '8px 0 12px' }}>{species.scientific}</p>
        <p style={{ fontSize: 14, marginBottom: 16 }}>{species.description}</p>
        <div className="care-info-grid" style={{ marginBottom: 16 }}>
          <CareInfo icon="☀" label="Light" value={species.light} />
          <CareInfo icon="💧" label="Watering" value={species.watering} />
          <CareInfo icon="🌿" label="Fertilizing" value={species.fertilizing} />
          <CareInfo icon="📈" label="Difficulty" value={species.difficulty} />
        </div>
        <h4 style={{ fontSize: 14, marginBottom: 6 }}>Common Problems</h4>
        <ul style={{ margin: '0 0 14px', paddingLeft: 18, fontSize: 13.5 }}>{species.problems.map((item) => <li key={item}>{item}</li>)}</ul>
        <h4 style={{ fontSize: 14, marginBottom: 6 }}>Basic Care Tips</h4>
        <ul style={{ margin: '0 0 18px', paddingLeft: 18, fontSize: 13.5 }}>{species.tips.map((item) => <li key={item}>{item}</li>)}</ul>
        <button className="btn btn-primary" type="button" onClick={() => actions.openModal('addPlant', { species: species.common, light: species.light, watering: species.watering, fertilizing: species.fertilizing })}>
          Add to My Plants
        </button>
      </div>
    </ModalFrame>
  )
}

function EditPlantModal({ plantId }) {
  const { state, actions } = useGreenCare()
  const plant = state.plants.find((item) => item.id === plantId)
  if (!plant) return null

  function submit(event) {
    event.preventDefault()
    actions.editPlant({ id: plantId, ...Object.fromEntries(new FormData(event.currentTarget)) })
  }

  return (
    <ModalFrame title="Edit Plant">
      <form className="modal-body" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Plant Name"><input name="name" required defaultValue={plant.name} /></Field>
          <Field label="Species"><input name="species" required defaultValue={plant.species} /></Field>
          <Field label="Location"><input name="location" defaultValue={plant.location} /></Field>
          <Field label="Health Status"><Select name="health" options={['Healthy', 'Good', 'Needs Attention', 'Critical']} value={plant.health} /></Field>
        </div>
        <Field label="Notes"><textarea name="notes" rows="2" defaultValue={plant.notes}></textarea></Field>
        <ModalActions submitLabel="Save Changes" />
      </form>
    </ModalFrame>
  )
}

function UpdateHealthModal({ plantId }) {
  const { state, actions } = useGreenCare()
  const plant = state.plants.find((item) => item.id === plantId)
  if (!plant) return null

  function submit(event) {
    event.preventDefault()
    actions.updateHealth({ id: plantId, ...Object.fromEntries(new FormData(event.currentTarget)) })
  }

  return (
    <ModalFrame title="Update Health">
      <form className="modal-body" onSubmit={submit}>
        <Field label="Health Status"><Select name="health" options={['Healthy', 'Good', 'Needs Attention', 'Critical']} value={plant.health} /></Field>
        <Field label="Observation Note"><textarea name="note" rows="3" placeholder="e.g. New leaf unfurling, soil still moist"></textarea></Field>
        <ModalActions submitLabel="Update" />
      </form>
    </ModalFrame>
  )
}

function DiagnosisModal() {
  const [photo, setPhoto] = useState(null)
  const [phase, setPhase] = useState('idle')
  const [result, setResult] = useState(null)
  const [barWidth, setBarWidth] = useState(0)

  function analyze() {
    setPhase('loading')
    setBarWidth(0)
    window.setTimeout(() => setBarWidth(100), 50)
    window.setTimeout(() => {
      setResult(diagnosisResults[Math.floor(Math.random() * diagnosisResults.length)])
      setPhase('done')
    }, 1100)
  }

  return (
    <ModalFrame title="Plant Diagnosis">
      <div className="modal-body">
        {phase === 'idle' ? (
          <>
            <label className="dropzone">
              {photo ? <><img src={photo} alt="Uploaded plant" /><p className="muted" style={{ marginTop: 8 }}>Photo ready; click Analyze Plant.</p></> : <><strong>Drag &amp; drop a photo here</strong><p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>This is a simulated prototype; no image is actually analyzed by AI.</p></>}
              <input type="file" accept="image/*" hidden onChange={(event) => readFile(event.currentTarget.files?.[0]).then(setPhoto)} />
            </label>
            <button className="btn btn-primary" type="button" disabled={!photo} onClick={analyze}>Analyze Plant</button>
          </>
        ) : null}
        {phase === 'loading' ? (
          <>
            <p style={{ textAlign: 'center', fontWeight: 600 }}>Analyzing your plant photo...</p>
            <div className="loading-bar"><div className="loading-bar-fill" style={{ width: `${barWidth}%` }}></div></div>
            <p className="muted" style={{ textAlign: 'center', fontSize: 12.5 }}>Simulated analysis; this takes just a moment.</p>
          </>
        ) : null}
        {phase === 'done' && result ? (
          <>
            <div className="diag-result">
              <p style={{ fontSize: 15 }}><strong>Possible Issue: {result.issue}</strong><span className="confidence-badge">Confidence: {result.confidence}%</span></p>
              <strong style={{ fontSize: 12.5, color: 'var(--ink-600)', display: 'block', marginTop: 12 }}>Possible Causes</strong>
              <ul>{result.causes.map((item) => <li key={item}>{item}</li>)}</ul>
              <strong style={{ fontSize: 12.5, color: 'var(--ink-600)', display: 'block' }}>Recommended Actions</strong>
              <ul>{result.actions.map((item) => <li key={item}>{item}</li>)}</ul>
              <p className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>This is a simulated result for prototype purposes and does not reflect real AI diagnosis.</p>
            </div>
            <div className="modal-actions"><button className="btn btn-secondary" type="button" onClick={() => { setPhoto(null); setPhase('idle'); setResult(null); setBarWidth(0) }}>Try Another Photo</button></div>
          </>
        ) : null}
      </div>
    </ModalFrame>
  )
}

function SpeciesAdminModal({ speciesId }) {
  const { state, actions } = useGreenCare()
  const species = state.library.find((item) => item.id === speciesId)

  function submit(event) {
    event.preventDefault()
    actions.saveSpecies({ id: speciesId, ...Object.fromEntries(new FormData(event.currentTarget)) })
  }

  return (
    <ModalFrame title={species ? 'Edit Species' : 'Add Species'}>
      <form className="modal-body" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Common Name"><input name="common" required defaultValue={species?.common || ''} /></Field>
          <Field label="Scientific Name"><input name="scientific" required defaultValue={species?.scientific || ''} /></Field>
          <Field label="Difficulty"><Select name="difficulty" options={['Beginner', 'Intermediate', 'Advanced']} value={species?.difficulty} /></Field>
          <Field label="Light"><input name="light" placeholder="e.g. Bright Indirect" defaultValue={species?.light || ''} /></Field>
          <Field label="Watering"><input name="watering" placeholder="e.g. Weekly" defaultValue={species?.watering || ''} /></Field>
        </div>
        <ModalActions submitLabel="Save Species" />
      </form>
    </ModalFrame>
  )
}

function ConfirmModal({ title, message, actionLabel, onConfirm }) {
  const { actions } = useGreenCare()
  return (
    <ModalFrame title={title} small>
      <div className="modal-body">
        <p className="muted">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" type="button" onClick={actions.closeModal}>Cancel</button>
          <button className="btn btn-danger" type="button" onClick={onConfirm}>{actionLabel}</button>
        </div>
      </div>
    </ModalFrame>
  )
}

function Field({ label, children }) {
  return (
    <div className="form-row">
      <label>{label}</label>
      {children}
    </div>
  )
}

function Select({ name, options, value }) {
  return (
    <select name={name} defaultValue={value || options[0]}>
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  )
}

function ModalActions({ submitLabel }) {
  const { actions } = useGreenCare()
  return (
    <div className="modal-actions">
      <button className="btn btn-secondary" type="button" onClick={actions.closeModal}>Cancel</button>
      <button className="btn btn-primary" type="submit">{submitLabel}</button>
    </div>
  )
}

function CareInfo({ icon, label, value }) {
  return (
    <div className="care-info-item">
      <span className="ci-icon">{icon}</span>
      <div><div className="ci-label">{label}</div><div className="ci-value">{value}</div></div>
    </div>
  )
}

function PhotoInput({ label, photo, setPhoto }) {
  return (
    <Field label={label}>
      <input type="file" accept="image/*" onChange={(event) => readFile(event.currentTarget.files?.[0]).then(setPhoto)} />
      {photo ? <div className="photo-preview"><img src={photo} alt="" /></div> : null}
    </Field>
  )
}

function readFile(file) {
  if (!file) return Promise.resolve(null)
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}
