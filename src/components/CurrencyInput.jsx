const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBRL(valor) {
  return valor === null || valor === undefined || Number.isNaN(valor) ? '' : formatador.format(valor)
}

// Máscara baseada em dígitos: o usuário digita apenas números e eles são
// interpretados da direita para a esquerda como centavos, evitando problemas
// de posição de cursor comuns em máscaras de moeda.
export default function CurrencyInput({ id, value, onChange, placeholder }) {
  function handleChange(e) {
    const digitos = e.target.value.replace(/\D/g, '')
    if (!digitos) {
      onChange(null)
      return
    }
    onChange(parseInt(digitos, 10) / 100)
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={formatBRL(value)}
      onChange={handleChange}
      placeholder={placeholder ?? 'R$ 0,00'}
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
    />
  )
}
