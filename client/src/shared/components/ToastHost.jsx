import { useGreenCare } from '../context/GreenCareContext.jsx'

export function ToastHost() {
  const { toasts } = useGreenCare()

  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((toast) => (
        <div className="toast" key={toast.id}>
          <span>✓</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
