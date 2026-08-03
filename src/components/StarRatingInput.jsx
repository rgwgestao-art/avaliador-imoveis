export default function StarRatingInput({ value, onChange, label }) {
  return (
    <div>
      {label && <p className="block text-sm font-medium text-slate-700 mb-1">{label}</p>}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((estrela) => (
            <button
              key={estrela}
              type="button"
              onClick={() => onChange(estrela)}
              aria-label={`${estrela} estrela${estrela > 1 ? 's' : ''}`}
              className="text-2xl leading-none"
            >
              <span className={estrela <= (value ?? 0) ? 'text-amber-400' : 'text-slate-300'}>★</span>
            </button>
          ))}
        </div>
        {value != null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            limpar
          </button>
        )}
      </div>
    </div>
  )
}
