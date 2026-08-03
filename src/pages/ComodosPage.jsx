import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import SelectField from '../components/SelectField'
import StarRatingInput from '../components/StarRatingInput'
import PhotoUploader from '../components/PhotoUploader'
import {
  TIPO_COMODO,
  AR_CONDICIONADO,
  ARMARIO_STATUS,
  QUALIDADE_BMR,
  PISO_TIPO,
  CONSERVACAO_BNR,
  DIVISORIA_TIPO,
  TETO_ACABAMENTO,
  TAMANHO_COZINHA,
  TAMANHO_PMG,
  TIPO_CHUVEIRO,
  FACE_SOL,
} from '../lib/opcoes'

const formIniciais = {
  identificador: '',
  ar_condicionado: null,
  armario_status: null,
  armario_qualidade: null,
  piso_tipo: null,
  piso_conservacao: null,
  piso_necessita_troca: false,
  divisoria_tipo: null,
  teto_acabamento: null,
  fotos: [],
  nota_estrelas: null,
  cozinha_tamanho: null,
  possui_dispensa: false,
  tamanho_dispensa: null,
  piso_azulejo_conservacao: null,
  piso_azulejo_necessita_troca: false,
  tipo_chuveiro: null,
  face_sol: null,
  varanda_tamanho: null,
  fechamento_vidro: false,
  possui_churrasqueira: false,
}

function comodoParaForm(comodo) {
  return { ...formIniciais, ...comodo }
}

export default function ComodosPage() {
  const { imovelId } = useParams()
  const { user } = useAuth()

  const [imovel, setImovel] = useState(null)
  const [comodos, setComodos] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [form, setForm] = useState(formIniciais)
  const [novoTipo, setNovoTipo] = useState(TIPO_COMODO[0].value)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregarTudo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imovelId])

  async function carregarTudo() {
    setCarregando(true)
    setErro('')

    const [{ data: imovelData, error: erroImovel }, { data: comodosData, error: erroComodos }] = await Promise.all([
      supabase.from('imoveis').select('id, endereco').eq('id', imovelId).single(),
      supabase.from('comodos_avaliacao').select('*').eq('imovel_id', imovelId).order('criado_em', { ascending: true }),
    ])

    if (erroImovel) setErro(erroImovel.message)
    else setImovel(imovelData)

    if (erroComodos) {
      setErro(erroComodos.message)
    } else {
      setComodos(comodosData ?? [])
      if (comodosData?.length) {
        const primeiro = activeId ? comodosData.find((c) => c.id === activeId) ?? comodosData[0] : comodosData[0]
        setActiveId(primeiro.id)
        setForm(comodoParaForm(primeiro))
      }
    }

    setCarregando(false)
  }

  function selecionarComodo(comodo) {
    setActiveId(comodo.id)
    setForm(comodoParaForm(comodo))
    setSalvo(false)
    setErro('')
  }

  function handleCampoChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function adicionarComodo() {
    setErro('')
    const labelTipo = TIPO_COMODO.find((t) => t.value === novoTipo)?.label ?? novoTipo
    const quantidadeMesmoTipo = comodos.filter((c) => c.tipo_comodo === novoTipo).length
    const identificador = `${labelTipo} ${quantidadeMesmoTipo + 1}`

    const { data, error } = await supabase
      .from('comodos_avaliacao')
      .insert({ imovel_id: imovelId, tipo_comodo: novoTipo, identificador })
      .select()
      .single()

    if (error) {
      setErro(error.message)
      return
    }

    const novaLista = [...comodos, data]
    setComodos(novaLista)
    selecionarComodo(data)
  }

  async function excluirComodo(comodo) {
    if (!window.confirm(`Excluir "${comodo.identificador}"? Essa ação não pode ser desfeita.`)) return

    setErro('')
    if (comodo.fotos?.length) {
      await supabase.storage.from('imoveis-fotos').remove(comodo.fotos)
    }
    const { error } = await supabase.from('comodos_avaliacao').delete().eq('id', comodo.id)
    if (error) {
      setErro(error.message)
      return
    }

    const novaLista = comodos.filter((c) => c.id !== comodo.id)
    setComodos(novaLista)
    if (activeId === comodo.id) {
      if (novaLista.length) selecionarComodo(novaLista[0])
      else {
        setActiveId(null)
        setForm(formIniciais)
      }
    }
  }

  async function handleFotosChange(novasFotos) {
    handleCampoChange('fotos', novasFotos)
    const { error } = await supabase.from('comodos_avaliacao').update({ fotos: novasFotos }).eq('id', activeId)
    if (error) {
      setErro(error.message)
      return
    }
    setComodos((prev) => prev.map((c) => (c.id === activeId ? { ...c, fotos: novasFotos } : c)))
  }

  async function salvarComodo() {
    setSalvando(true)
    setErro('')
    setSalvo(false)

    const payload = Object.fromEntries(Object.keys(formIniciais).map((campo) => [campo, form[campo]]))

    const { error } = await supabase.from('comodos_avaliacao').update(payload).eq('id', activeId)
    setSalvando(false)

    if (error) {
      setErro(error.message)
      return
    }

    setComodos((prev) => prev.map((c) => (c.id === activeId ? { ...c, ...payload } : c)))
    setSalvo(true)
  }

  if (carregando) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">Carregando...</div>
  }

  const comodoAtivo = comodos.find((c) => c.id === activeId)
  const bucketPath = user && activeId ? `${user.id}/${imovelId}/comodos/${activeId}` : null

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Avaliação por cômodo</h1>
            <p className="text-sm text-slate-500">{imovel?.endereco || 'Endereço não informado'}</p>
          </div>
          <Link to={`/imoveis/${imovelId}`} className="text-sm text-slate-500 hover:text-slate-700">
            Voltar para o imóvel
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <section className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {comodos.map((comodo) => (
              <button
                key={comodo.id}
                onClick={() => selecionarComodo(comodo)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
                  comodo.id === activeId
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {comodo.identificador || comodo.tipo_comodo}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={novoTipo}
              onChange={(e) => setNovoTipo(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              {TIPO_COMODO.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={adicionarComodo}
              className="rounded-md bg-slate-800 text-white text-sm font-medium px-4 py-2 hover:bg-slate-700"
            >
              + Adicionar cômodo
            </button>
          </div>
        </section>

        {erro && <p className="text-sm text-red-600 mb-4">{erro}</p>}

        {!comodoAtivo ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm text-slate-500">
            Nenhum cômodo cadastrado ainda. Escolha um tipo acima e clique em "Adicionar cômodo".
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-5">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="identificador">
                  Nome do cômodo
                </label>
                <input
                  id="identificador"
                  type="text"
                  value={form.identificador ?? ''}
                  onChange={(e) => handleCampoChange('identificador', e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={() => excluirComodo(comodoAtivo)}
                className="text-sm text-red-600 hover:text-red-700 pb-2"
              >
                Excluir cômodo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                id="ar_condicionado"
                label="Ar-condicionado"
                value={form.ar_condicionado}
                onChange={(v) => handleCampoChange('ar_condicionado', v)}
                options={AR_CONDICIONADO}
              />
              <SelectField
                id="armario_status"
                label="Armário"
                value={form.armario_status}
                onChange={(v) => handleCampoChange('armario_status', v)}
                options={ARMARIO_STATUS}
              />
              <SelectField
                id="armario_qualidade"
                label="Qualidade do armário"
                value={form.armario_qualidade}
                onChange={(v) => handleCampoChange('armario_qualidade', v)}
                options={QUALIDADE_BMR}
              />
              <SelectField
                id="piso_tipo"
                label="Tipo de piso"
                value={form.piso_tipo}
                onChange={(v) => handleCampoChange('piso_tipo', v)}
                options={PISO_TIPO}
              />
              <SelectField
                id="piso_conservacao"
                label="Conservação do piso"
                value={form.piso_conservacao}
                onChange={(v) => handleCampoChange('piso_conservacao', v)}
                options={CONSERVACAO_BNR}
              />
              <SelectField
                id="divisoria_tipo"
                label="Tipo de divisória"
                value={form.divisoria_tipo}
                onChange={(v) => handleCampoChange('divisoria_tipo', v)}
                options={DIVISORIA_TIPO}
              />
              <SelectField
                id="teto_acabamento"
                label="Acabamento do teto"
                value={form.teto_acabamento}
                onChange={(v) => handleCampoChange('teto_acabamento', v)}
                options={TETO_ACABAMENTO}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.piso_necessita_troca ?? false}
                onChange={(e) => handleCampoChange('piso_necessita_troca', e.target.checked)}
              />
              Piso necessita troca
            </label>

            {comodoAtivo.tipo_comodo === 'cozinha' && (
              <div className="border-t border-slate-200 pt-4 space-y-4">
                <p className="text-sm font-semibold text-slate-600">Específico de cozinha</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    id="cozinha_tamanho"
                    label="Tamanho da cozinha"
                    value={form.cozinha_tamanho}
                    onChange={(v) => handleCampoChange('cozinha_tamanho', v)}
                    options={TAMANHO_COZINHA}
                  />
                  <SelectField
                    id="piso_azulejo_conservacao"
                    label="Conservação do azulejo"
                    value={form.piso_azulejo_conservacao}
                    onChange={(v) => handleCampoChange('piso_azulejo_conservacao', v)}
                    options={CONSERVACAO_BNR}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.possui_dispensa ?? false}
                    onChange={(e) => handleCampoChange('possui_dispensa', e.target.checked)}
                  />
                  Possui dispensa
                </label>
                {form.possui_dispensa && (
                  <SelectField
                    id="tamanho_dispensa"
                    label="Tamanho da dispensa"
                    value={form.tamanho_dispensa}
                    onChange={(v) => handleCampoChange('tamanho_dispensa', v)}
                    options={TAMANHO_PMG}
                  />
                )}
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.piso_azulejo_necessita_troca ?? false}
                    onChange={(e) => handleCampoChange('piso_azulejo_necessita_troca', e.target.checked)}
                  />
                  Piso de azulejo necessita troca
                </label>
              </div>
            )}

            {comodoAtivo.tipo_comodo === 'banheiro' && (
              <div className="border-t border-slate-200 pt-4 space-y-4">
                <p className="text-sm font-semibold text-slate-600">Específico de banheiro</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    id="tipo_chuveiro"
                    label="Tipo de chuveiro"
                    value={form.tipo_chuveiro}
                    onChange={(v) => handleCampoChange('tipo_chuveiro', v)}
                    options={TIPO_CHUVEIRO}
                  />
                  <SelectField
                    id="piso_azulejo_conservacao"
                    label="Conservação do azulejo"
                    value={form.piso_azulejo_conservacao}
                    onChange={(v) => handleCampoChange('piso_azulejo_conservacao', v)}
                    options={CONSERVACAO_BNR}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.piso_azulejo_necessita_troca ?? false}
                    onChange={(e) => handleCampoChange('piso_azulejo_necessita_troca', e.target.checked)}
                  />
                  Piso de azulejo necessita troca
                </label>
              </div>
            )}

            {comodoAtivo.tipo_comodo === 'sala' && (
              <div className="border-t border-slate-200 pt-4 space-y-4">
                <p className="text-sm font-semibold text-slate-600">Específico de sala</p>
                <SelectField
                  id="face_sol"
                  label="Face do sol"
                  value={form.face_sol}
                  onChange={(v) => handleCampoChange('face_sol', v)}
                  options={FACE_SOL}
                />
              </div>
            )}

            {comodoAtivo.tipo_comodo === 'varanda' && (
              <div className="border-t border-slate-200 pt-4 space-y-4">
                <p className="text-sm font-semibold text-slate-600">Específico de varanda</p>
                <SelectField
                  id="varanda_tamanho"
                  label="Tamanho da varanda"
                  value={form.varanda_tamanho}
                  onChange={(v) => handleCampoChange('varanda_tamanho', v)}
                  options={TAMANHO_PMG}
                />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.fechamento_vidro ?? false}
                    onChange={(e) => handleCampoChange('fechamento_vidro', e.target.checked)}
                  />
                  Fechamento em vidro
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.possui_churrasqueira ?? false}
                    onChange={(e) => handleCampoChange('possui_churrasqueira', e.target.checked)}
                  />
                  Possui churrasqueira
                </label>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4">
              {bucketPath && (
                <PhotoUploader bucketPath={bucketPath} fotos={form.fotos} onChange={handleFotosChange} />
              )}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <StarRatingInput
                label="Nota do cômodo"
                value={form.nota_estrelas}
                onChange={(v) => handleCampoChange('nota_estrelas', v)}
              />
            </div>

            {salvo && <p className="text-sm text-emerald-600">Cômodo salvo.</p>}

            <div className="pt-2">
              <button
                type="button"
                onClick={salvarComodo}
                disabled={salvando}
                className="rounded-md bg-slate-800 text-white text-sm font-medium px-4 py-2 hover:bg-slate-700 disabled:opacity-60"
              >
                {salvando ? 'Salvando...' : 'Salvar cômodo'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
