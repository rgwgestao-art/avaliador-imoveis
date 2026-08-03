import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import StarDisplay from '../components/StarDisplay'

const formatBRL = (valor) =>
  valor === null || valor === undefined
    ? '—'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

const filtrosIniciais = {
  valorMin: '',
  valorMax: '',
  valorM2Min: '',
  valorM2Max: '',
  quartos: '',
  notaMin: '',
  busca: '',
}

export default function ImoveisListPage() {
  const { signOut } = useAuth()
  const [imoveis, setImoveis] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [filtros, setFiltros] = useState(filtrosIniciais)

  useEffect(() => {
    carregarImoveis()
  }, [])

  async function carregarImoveis() {
    setCarregando(true)
    setErro('')

    const { data, error } = await supabase
      .from('imoveis_com_nota')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) {
      setErro(error.message)
    } else {
      setImoveis(data ?? [])
    }
    setCarregando(false)
  }

  function handleFiltroChange(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }))
  }

  const imoveisFiltrados = imoveis.filter((imovel) => {
    if (filtros.valorMin && (imovel.valor_anuncio ?? -Infinity) < Number(filtros.valorMin)) return false
    if (filtros.valorMax && (imovel.valor_anuncio ?? Infinity) > Number(filtros.valorMax)) return false
    if (filtros.valorM2Min && (imovel.valor_m2 ?? -Infinity) < Number(filtros.valorM2Min)) return false
    if (filtros.valorM2Max && (imovel.valor_m2 ?? Infinity) > Number(filtros.valorM2Max)) return false
    if (filtros.quartos && Number(imovel.quartos) !== Number(filtros.quartos)) return false
    if (filtros.notaMin && (imovel.nota_geral ?? 0) < Number(filtros.notaMin)) return false
    if (
      filtros.busca &&
      !(imovel.endereco ?? '').toLowerCase().includes(filtros.busca.toLowerCase())
    )
      return false
    return true
  })

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">Meus Imóveis</h1>
          <div className="flex items-center gap-3">
            <Link
              to="/imoveis/novo"
              className="rounded-md bg-slate-800 text-white text-sm font-medium px-4 py-2 hover:bg-slate-700"
            >
              + Novo imóvel
            </Link>
            <button
              onClick={signOut}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <section className="bg-white rounded-lg shadow-sm p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Buscar por endereço/bairro"
            value={filtros.busca}
            onChange={(e) => handleFiltroChange('busca', e.target.value)}
            className="col-span-2 md:col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Valor mín. (R$)"
            value={filtros.valorMin}
            onChange={(e) => handleFiltroChange('valorMin', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Valor máx. (R$)"
            value={filtros.valorMax}
            onChange={(e) => handleFiltroChange('valorMax', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="R$/m² mín."
            value={filtros.valorM2Min}
            onChange={(e) => handleFiltroChange('valorM2Min', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="R$/m² máx."
            value={filtros.valorM2Max}
            onChange={(e) => handleFiltroChange('valorM2Max', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Nº de quartos"
            value={filtros.quartos}
            onChange={(e) => handleFiltroChange('quartos', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            placeholder="Nota mínima"
            value={filtros.notaMin}
            onChange={(e) => handleFiltroChange('notaMin', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </section>

        {erro && <p className="text-sm text-red-600 mb-4">{erro}</p>}

        {carregando ? (
          <p className="text-sm text-slate-500">Carregando imóveis...</p>
        ) : imoveisFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <p className="text-slate-500 mb-4">
              {imoveis.length === 0
                ? 'Nenhum imóvel cadastrado ainda.'
                : 'Nenhum imóvel corresponde aos filtros aplicados.'}
            </p>
            {imoveis.length === 0 && (
              <Link
                to="/imoveis/novo"
                className="inline-block rounded-md bg-slate-800 text-white text-sm font-medium px-4 py-2 hover:bg-slate-700"
              >
                Cadastrar primeiro imóvel
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {imoveisFiltrados.map((imovel) => (
              <Link
                key={imovel.id}
                to={`/imoveis/${imovel.id}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-36 bg-slate-200 flex items-center justify-center text-slate-400 text-xs">
                  {imovel.foto_capa_url ? (
                    <img
                      src={imovel.foto_capa_url}
                      alt={imovel.endereco ?? 'Imóvel'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    'Sem foto'
                  )}
                </div>
                <div className="p-4">
                  <p className="font-medium text-slate-800 truncate">
                    {imovel.endereco || 'Endereço não informado'}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{formatBRL(imovel.valor_anuncio)}</p>
                  <p className="text-xs text-slate-400">
                    {imovel.valor_m2 ? `${formatBRL(imovel.valor_m2)}/m²` : 'Valor/m² —'}
                  </p>
                  <div className="mt-2">
                    <StarDisplay nota={imovel.nota_geral} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
