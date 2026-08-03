import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import SelectField from '../components/SelectField'
import StarRatingInput from '../components/StarRatingInput'
import PhotoUploader from '../components/PhotoUploader'
import { VAGAS_TIPO, QUALIDADE_BMR, BELEZA_CONDOMINIO, ITEM_AREA_COMUM, PORTARIA_TIPO, CONSERVACAO_BNR } from '../lib/opcoes'

const camposIniciais = {
  condominio_vagas_tipo: null,
  condominio_vaga_qualidade: null,
  condominio_beleza: null,
  condominio_itens_area_comum: [],
  condominio_itens_area_comum_outro: '',
  condominio_elevador_qualidade: null,
  condominio_portaria_tipo: null,
  condominio_fotos: [],
  nota_estrelas_condominio: null,
}

function toggleItem(lista, item) {
  return lista.includes(item) ? lista.filter((i) => i !== item) : [...lista, item]
}

export default function CondominioPage() {
  const { id } = useParams()
  const { user } = useAuth()

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
        setCampos({
          ...camposIniciais,
          ...data,
          condominio_itens_area_comum: data.condominio_itens_area_comum ?? [],
          condominio_itens_area_comum_outro: data.condominio_itens_area_comum_outro ?? '',
          condominio_fotos: data.condominio_fotos ?? [],
        })
      }
      setCarregando(false)
    }
    carregar()
  }, [id])

  function handleCampoChange(campo, valor) {
    setCampos((prev) => ({ ...prev, [campo]: valor }))
    setSalvo(false)
  }

  async function handleFotosChange(novasFotos) {
    handleCampoChange('condominio_fotos', novasFotos)
    const { error } = await supabase.from('imoveis').update({ condominio_fotos: novasFotos }).eq('id', id)
    if (error) setErro(error.message)
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

  const bucketPath = user ? `${user.id}/${id}/condominio` : null

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Avaliação do condomínio</h1>
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
              id="condominio_vagas_tipo"
              label="Vagas de garagem"
              value={campos.condominio_vagas_tipo}
              onChange={(v) => handleCampoChange('condominio_vagas_tipo', v)}
              options={VAGAS_TIPO}
            />
            <SelectField
              id="condominio_vaga_qualidade"
              label="Qualidade da vaga"
              value={campos.condominio_vaga_qualidade}
              onChange={(v) => handleCampoChange('condominio_vaga_qualidade', v)}
              options={QUALIDADE_BMR}
            />
            <SelectField
              id="condominio_beleza"
              label="Beleza do condomínio"
              value={campos.condominio_beleza}
              onChange={(v) => handleCampoChange('condominio_beleza', v)}
              options={BELEZA_CONDOMINIO}
            />
            <SelectField
              id="condominio_elevador_qualidade"
              label="Qualidade do elevador"
              value={campos.condominio_elevador_qualidade}
              onChange={(v) => handleCampoChange('condominio_elevador_qualidade', v)}
              options={CONSERVACAO_BNR}
            />
            <SelectField
              id="condominio_portaria_tipo"
              label="Tipo de portaria"
              value={campos.condominio_portaria_tipo}
              onChange={(v) => handleCampoChange('condominio_portaria_tipo', v)}
              options={PORTARIA_TIPO}
            />
          </div>

          <div>
            <p className="block text-sm font-medium text-slate-700 mb-2">Itens da área comum</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ITEM_AREA_COMUM.map((item) => (
                <label key={item.value} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={campos.condominio_itens_area_comum.includes(item.value)}
                    onChange={() =>
                      handleCampoChange(
                        'condominio_itens_area_comum',
                        toggleItem(campos.condominio_itens_area_comum, item.value)
                      )
                    }
                  />
                  {item.label}
                </label>
              ))}
            </div>
            {campos.condominio_itens_area_comum.includes('outro') && (
              <input
                type="text"
                placeholder="Descreva o item"
                value={campos.condominio_itens_area_comum_outro}
                onChange={(e) => handleCampoChange('condominio_itens_area_comum_outro', e.target.value)}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            )}
          </div>

          <div className="border-t border-slate-200 pt-4">
            {bucketPath && (
              <PhotoUploader bucketPath={bucketPath} fotos={campos.condominio_fotos} onChange={handleFotosChange} />
            )}
          </div>

          <div className="border-t border-slate-200 pt-4">
            <StarRatingInput
              label="Nota do condomínio"
              value={campos.nota_estrelas_condominio}
              onChange={(v) => handleCampoChange('nota_estrelas_condominio', v)}
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
