import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import CurrencyInput, { formatBRL } from '../components/CurrencyInput'

const camposIniciais = {
  endereco: '',
  metragem: '',
  quartos: '',
  suites: '',
  banheiros: '',
  vagas_garagem: '',
  idade_predio: '',
  andar: '',
  valor_anuncio: null,
  valor_condominio: null,
}

const paraNumeroOuNull = (valor) => (valor === '' || valor === null || valor === undefined ? null : Number(valor))

export default function ImovelFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const emEdicao = Boolean(id)

  const [campos, setCampos] = useState(camposIniciais)
  const [carregando, setCarregando] = useState(emEdicao)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!emEdicao) return

    async function carregarImovel() {
      setCarregando(true)
      const { data, error } = await supabase.from('imoveis').select('*').eq('id', id).single()

      if (error) {
        setErro(error.message)
      } else if (data) {
        setCampos({
          endereco: data.endereco ?? '',
          metragem: data.metragem ?? '',
          quartos: data.quartos ?? '',
          suites: data.suites ?? '',
          banheiros: data.banheiros ?? '',
          vagas_garagem: data.vagas_garagem ?? '',
          idade_predio: data.idade_predio ?? '',
          andar: data.andar ?? '',
          valor_anuncio: data.valor_anuncio,
          valor_condominio: data.valor_condominio,
        })
      }
      setCarregando(false)
    }

    carregarImovel()
  }, [id, emEdicao])

  function handleCampoChange(campo, valor) {
    setCampos((prev) => ({ ...prev, [campo]: valor }))
  }

  const metragemNum = paraNumeroOuNull(campos.metragem)
  const valorM2 =
    metragemNum && metragemNum > 0 && campos.valor_anuncio ? campos.valor_anuncio / metragemNum : null

  async function salvar(destinoAposSalvar) {
    setSalvando(true)
    setErro('')

    const payload = {
      endereco: campos.endereco || null,
      metragem: paraNumeroOuNull(campos.metragem),
      quartos: paraNumeroOuNull(campos.quartos),
      suites: paraNumeroOuNull(campos.suites),
      banheiros: paraNumeroOuNull(campos.banheiros),
      vagas_garagem: paraNumeroOuNull(campos.vagas_garagem),
      idade_predio: paraNumeroOuNull(campos.idade_predio),
      andar: campos.andar || null,
      valor_anuncio: campos.valor_anuncio,
      valor_condominio: campos.valor_condominio,
    }

    if (emEdicao) {
      const { error } = await supabase.from('imoveis').update(payload).eq('id', id)
      setSalvando(false)
      if (error) {
        setErro(error.message)
        return
      }
      destinoAposSalvar()
    } else {
      const { data, error } = await supabase.from('imoveis').insert(payload).select().single()
      setSalvando(false)
      if (error) {
        setErro(error.message)
        return
      }
      destinoAposSalvar(data.id)
    }
  }

  function handleSalvarEContinuarDepois() {
    salvar(() => navigate('/'))
  }

  function handleSalvarEContinuar() {
    salvar((novoId) => {
      if (novoId) navigate(`/imoveis/${novoId}`, { replace: true })
    })
  }

  if (carregando) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">
            {emEdicao ? 'Editar imóvel' : 'Novo imóvel'}
          </h1>
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
            Voltar para a lista
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {emEdicao && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-wrap gap-2">
            <Link
              to={`/imoveis/${id}/comodos`}
              className="rounded-md border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-50"
            >
              Avaliar cômodos
            </Link>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="endereco">
              Endereço
            </label>
            <input
              id="endereco"
              type="text"
              value={campos.endereco}
              onChange={(e) => handleCampoChange('endereco', e.target.value)}
              placeholder="Rua, número, bairro"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="metragem">
                Metragem (m²)
              </label>
              <input
                id="metragem"
                type="number"
                min="0"
                step="0.01"
                value={campos.metragem}
                onChange={(e) => handleCampoChange('metragem', e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="andar">
                Andar
              </label>
              <input
                id="andar"
                type="text"
                value={campos.andar}
                onChange={(e) => handleCampoChange('andar', e.target.value)}
                placeholder="Ex: 12º, Cobertura, Térreo"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="quartos">
                Quartos
              </label>
              <input
                id="quartos"
                type="number"
                min="0"
                value={campos.quartos}
                onChange={(e) => handleCampoChange('quartos', e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="suites">
                Suítes
              </label>
              <input
                id="suites"
                type="number"
                min="0"
                value={campos.suites}
                onChange={(e) => handleCampoChange('suites', e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="banheiros">
                Banheiros
              </label>
              <input
                id="banheiros"
                type="number"
                min="0"
                value={campos.banheiros}
                onChange={(e) => handleCampoChange('banheiros', e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="vagas_garagem">
                Vagas
              </label>
              <input
                id="vagas_garagem"
                type="number"
                min="0"
                value={campos.vagas_garagem}
                onChange={(e) => handleCampoChange('vagas_garagem', e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="idade_predio">
              Idade do prédio (anos)
            </label>
            <input
              id="idade_predio"
              type="number"
              min="0"
              value={campos.idade_predio}
              onChange={(e) => handleCampoChange('idade_predio', e.target.value)}
              className="w-full sm:w-40 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="valor_anuncio">
                Valor do anúncio
              </label>
              <CurrencyInput
                id="valor_anuncio"
                value={campos.valor_anuncio}
                onChange={(v) => handleCampoChange('valor_anuncio', v)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="valor_condominio">
                Valor do condomínio
              </label>
              <CurrencyInput
                id="valor_condominio"
                value={campos.valor_condominio}
                onChange={(v) => handleCampoChange('valor_condominio', v)}
              />
            </div>
          </div>

          <p className="text-sm text-slate-500">
            Valor por m²: <span className="font-medium text-slate-700">{valorM2 ? formatBRL(valorM2) : '—'}</span>
          </p>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={handleSalvarEContinuar}
              disabled={salvando}
              className="rounded-md bg-slate-800 text-white text-sm font-medium px-4 py-2 hover:bg-slate-700 disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={handleSalvarEContinuarDepois}
              disabled={salvando}
              className="rounded-md border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-50 disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Salvar e continuar depois'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
