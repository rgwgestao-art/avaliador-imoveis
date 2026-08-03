export default function StarDisplay({ nota }) {
  if (nota === null || nota === undefined) {
    return <span className="text-xs text-slate-400">Sem avaliação</span>
  }

  const cheias = Math.round(nota)

  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-amber-400 text-sm leading-none">
        {'★'.repeat(cheias)}
        <span className="text-slate-300">{'★'.repeat(5 - cheias)}</span>
      </span>
      <span className="text-xs text-slate-500">{nota.toFixed(1)}</span>
    </span>
  )
}
