export default function SelectField({ id, label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        <option value="">—</option>
        {options.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>
            {opcao.label}
          </option>
        ))}
      </select>
    </div>
  )
}
