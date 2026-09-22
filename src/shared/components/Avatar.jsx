import { avatarInitials } from '../utils/plants.js'

export function Avatar({ name, photo, size = '' }) {
  const className = size ? `avatar avatar--${size}` : 'avatar'

  return (
    <span className={className}>
      {photo ? <img src={photo} alt="" /> : avatarInitials(name)}
    </span>
  )
}
