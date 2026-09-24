import { useState } from 'react'
import { Avatar } from '../../shared/components/Avatar.jsx'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { useAuth } from '../../features/auth/AuthContext.jsx'

export function ProfilePage() {
  const { state, actions } = useGreenCare()
  const { currentUser, updateUserProfile: updateAuthUser } = useAuth()
  const [form, setForm] = useState(currentUser ? currentUser : state.profile)

  function save() {
    // Update auth user
    updateAuthUser({
      name: form.name,
      email: form.email,
      location: form.location,
      photo: form.photo,
    })
    // Update GreenCare state's profile
    actions.updateProfile({
      name: form.name.trim() || state.profile.name,
      email: form.email.trim(),
      location: form.location.trim(),
      photo: form.photo,
    })
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <section className="page active">
      <div className="page-head"><div><h1>Your Profile</h1><p className="muted">Keep your details up to date.</p></div></div>
      <div className="card profile-card">
        <div className="profile-photo-row">
          <Avatar name={form.name} photo={form.photo} size="lg" />
          <div>
            <label className="btn btn-secondary">
              Change photo
              <input type="file" accept="image/*" hidden onChange={(event) => readFile(event.currentTarget.files?.[0]).then((photo) => update('photo', photo))} />
            </label>
          </div>
        </div>
        <div className="form-grid">
          <div className="form-row"><label htmlFor="profName">Name</label><input id="profName" value={form.name} onChange={(event) => update('name', event.target.value)} /></div>
          <div className="form-row"><label htmlFor="profEmail">Email</label><input id="profEmail" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></div>
          <div className="form-row"><label htmlFor="profLocation">Location</label><input id="profLocation" value={form.location} onChange={(event) => update('location', event.target.value)} /></div>
        </div>
        <button className="btn btn-primary" type="button" onClick={save}>Save changes</button>
      </div>
    </section>
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
