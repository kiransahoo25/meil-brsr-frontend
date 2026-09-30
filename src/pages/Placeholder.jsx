export default function Placeholder({ title }) {
  return (
    <div className="text-center py-24">
      <div className="text-4xl mb-3">🚧</div>
      <h2 className="text-xl font-bold text-slate-700">{title}</h2>
      <p className="text-sm text-slate-500 mt-2">
        This page will be built next.
      </p>
    </div>
  )
}