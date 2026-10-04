import { useAuth } from '../context/AuthContext'

/**
 * Renders a subtle, tiled watermark to identify the current user.
 * This makes any captured screenshot traceable.
 */
export default function Watermark() {
  const { user } = useAuth()
  if (!user) return null

  const watermarkText = `${user.name} · ${user.code}`
  const opacity = 0.08 // Subtle but visible upon close inspection
  const color = 'rgba(100, 116, 139, 0.8)' // Slate-500 with opacity

  return (
    <div
      className="fixed inset-0 z-[9998] pointer-events-none select-none"
      aria-hidden="true"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='350' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='system-ui, sans-serif' font-size='18' font-weight='600' fill='${encodeURIComponent(
          color,
        )}' fill-opacity='${opacity}' transform='rotate(-30 175 90)' text-anchor='middle'%3E${encodeURIComponent(
          watermarkText,
        )}%3C/text%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      }}
    />
  )
}