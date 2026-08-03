import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import SelectField from '../components/SelectField'
import StarRatingInput from '../components/StarRatingInput'
import { PERTO_MEDIO_LONGE, SEGURANCA_RUA, QUALIDADE_BAIRRO } from '../lib/opcoes'

const camposIniciais = {
  bairro_distancia_trabalho: null,
  bairro_proximidade_metro: null,
  bairro_seguranca_rua: null,
  bairro_qualidade: null,
  nota_estrelas_bairro: null,
}

export default function BairroPage() {
  const { id } = useParams()

  const [imovel, setImovel] = useState(null)
  const [campos, setCampos] = useState(camposIniciais)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const { data, error } = await supabase
        .from('imoveis')
        .select('id, endereco, ' + Object.keys(camposIniciais).join(', '))
        .eq('id', id)
        .single()

      if (error) {
        setErro(error.message)
      } else if (data) {
        setImovel(data)
        setCampos({ ...camposIniciais, ...data })
      }
      setCarregando(false)
    }
    carregar()
  }, [id])

  function handleCampoChange(campo, valor) {
    setCampos((prev) => ({ ...prev, [campo]: valor }))
    setSalvo(false)
  }

  async function salvar() {
    setSalvando(true)
    setErro('')
    setSalvo(false)

    const payload = Object.fromEntries(Object.keys(camposIniciais).map((campo) => [campo, campos[campo]]))

    const { error } = await supabase.from('imoveis').update(payload).eq('id', id)
    setSalvando(false)

    if (error) {
      setErro(error.message)
      return
    }
    setSalvo(true)
  }

  if (carregando) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Avaliação do bairro</h1>
            <p className="text-sm text-slate-500">{imovel?.endereco || 'Endereço não informado'}</p>
          </div>
          <Link to={`/imoveis/${id}`} className="text-sm text-slate-500 hover:text-slate-700">
            Voltar para o imóvel
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              id="bairro_distancia_trabalho"
              label="Distância do trabalho"
              value={campos.bairro_distancia_trabalho}
              onChange={(v) => handleCampoChange('bairro_distancia_trabalho', v)}
              options={PERTO_MEDIO_LONGE}
            />
            <SelectField
              id="bairro_proximidade_metro"
              label="Proximidade do metrô"
              value={campos.bairro_proximidade_metro}
              onChange={(v) => handleCampoChange('bairro_proximidade_metro', v)}
              options={PERTO_MEDIO_LONGE}
            />
            <SelectField
              id="bairro_seguranca_rua"
              label="Segurança da rua"
              value={campos.bairro_seguranca_rua}
              onChange={(v) => handleCampoChange('bairro_seguranca_rua', v)}
              options={SEGURANCA_RUA}
            />
            <SelectField
              id="bairro_qualidade"
              label="Qualidade do bairro"
              value={campos.bairro_qualidade}
              onChange={(v) => handleCampoChange('bairro_qualidade', v)}
              options={QUALIDADE_BAIRRO}
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <StarRatingInput
              label="Nota do bairro"
              value={campos.nota_estrelas_bairro}
              onChange={(v) => handleCampoChange('nota_estrelas_bairro', v)}
            />
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}
          {salvo && <p className="text-sm text-emerald-600">Avaliação salva.</p>}

          <div className="pt-2">
            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="rounded-md bg-slate-800 text-white text-sm font-medium px-4 py-2 hover:bg-slate-700 disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
