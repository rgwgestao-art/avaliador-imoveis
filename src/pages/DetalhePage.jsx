import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getSignedUrls } from '../lib/storage'
import { formatBRL } from '../components/CurrencyInput'
import StarDisplay from '../components/StarDisplay'
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
  VAGAS_TIPO,
  BELEZA_CONDOMINIO,
  ITEM_AREA_COMUM,
  PORTARIA_TIPO,
  PERTO_MEDIO_LONGE,
  SEGURANCA_RUA,
  QUALIDADE_BAIRRO,
} from '../lib/opcoes'

const labelDe = (options, valor) => options.find((o) => o.value === valor)?.label ?? null

function Campo({ label, valor }) {
  if (valor === null || valor === undefined || valor === '') return null
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm text-slate-700">{valor}</p>
    </div>
  )
}

function criteriosComodo(comodo) {
  const campos = [
    { label: 'Ar-condicionado', valor: labelDe(AR_CONDICIONADO, comodo.ar_condicionado) },
    { label: 'Armário', valor: labelDe(ARMARIO_STATUS, comodo.armario_status) },
    { label: 'Qualidade do armário', valor: labelDe(QUALIDADE_BMR, comodo.armario_qualidade) },
    { label: 'Tipo de piso', valor: labelDe(PISO_TIPO, comodo.piso_tipo) },
    { label: 'Conservação do piso', valor: labelDe(CONSERVACAO_BNR, comodo.piso_conservacao) },
    { label: 'Piso necessita troca', valor: comodo.piso_necessita_troca ? 'Sim' : null },
    { label: 'Tipo de divisória', valor: labelDe(DIVISORIA_TIPO, comodo.divisoria_tipo) },
    { label: 'Acabamento do teto', valor: labelDe(TETO_ACABAMENTO, comodo.teto_acabamento) },
  ]

  if (comodo.tipo_comodo === 'cozinha') {
    campos.push(
      { label: 'Tamanho da cozinha', valor: labelDe(TAMANHO_COZINHA, comodo.cozinha_tamanho) },
      { label: 'Possui dispensa', valor: comodo.possui_dispensa ? 'Sim' : null },
      { label: 'Tamanho da dispensa', valor: labelDe(TAMANHO_PMG, comodo.tamanho_dispensa) },
      { label: 'Conservação do azulejo', valor: labelDe(CONSERVACAO_BNR, comodo.piso_azulejo_conservacao) },
      { label: 'Azulejo necessita troca', valor: comodo.piso_azulejo_necessita_troca ? 'Sim' : null }
    )
  }
  if (comodo.tipo_comodo === 'banheiro') {
    campos.push(
      { label: 'Tipo de chuveiro', valor: labelDe(TIPO_CHUVEIRO, comodo.tipo_chuveiro) },
      { label: 'Conservação do azulejo', valor: labelDe(CONSERVACAO_BNR, comodo.piso_azulejo_conservacao) },
      { label: 'Azulejo necessita troca', valor: comodo.piso_azulejo_necessita_troca ? 'Sim' : null }
    )
  }
  if (comodo.tipo_comodo === 'sala') {
    campos.push({ label: 'Face do sol', valor: labelDe(FACE_SOL, comodo.face_sol) })
  }
  if (comodo.tipo_comodo === 'varanda') {
    campos.push(
      { label: 'Tamanho da varanda', valor: labelDe(TAMANHO_PMG, comodo.varanda_tamanho) },
      { label: 'Fechamento em vidro', valor: comodo.fechamento_vidro ? 'Sim' : null },
      { label: 'Possui churrasqueira', valor: comodo.possui_churrasqueira ? 'Sim' : null }
    )
  }

  return campos.filter((c) => c.valor !== null)
}

export default function DetalhePage() {
  const { id } = useParams()

  const [imovel, setImovel] = useState(null)
  const [comodos, setComodos] = useState([])
  const [urlsGaleria, setUrlsGaleria] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      setErro('')

      const [{ data: imovelData, error: erroImovel }, { data: comodosData, error: erroComodos }] = await Promise.all([
        supabase.from('imoveis_com_nota').select('*').eq('id', id).single(),
        supabase.from('comodos_avaliacao').select('*').eq('imovel_id', id).order('criado_em', { ascending: true }),
      ])

      if (erroImovel) {
        setErro(erroImovel.message)
        setCarregando(false)
        return
      }
      if (erroComodos) {
        setErro(erroComodos.message)
        setCarregando(false)
        return
      }

      setImovel(imovelData)
      setComodos(comodosData ?? [])

      const todasFotos = [
        ...(imovelData.condominio_fotos ?? []),
        ...(comodosData ?? []).flatMap((c) => c.fotos ?? []),
      ]
      setUrlsGaleria(await getSignedUrls(todasFotos))

      setCarregando(false)
    }

    carregar()
  }, [id])

  if (carregando) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">Carregando...</div>
  }

  if (erro) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-sm">{erro}</div>
  }

  const galeria = Object.entries(urlsGaleria).filter(([, url]) => url)

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">{imovel.endereco || 'Endereço não informado'}</h1>
            <div className="mt-1 flex items-center gap-3">
              <StarDisplay nota={imovel.nota_geral} />
              {imovel.link_anuncio && (
                <a
                  href={imovel.link_anuncio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ver anúncio ↗
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/imoveis/${id}/editar`} className="text-sm text-slate-500 hover:text-slate-700">
              Editar
            </Link>
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
              Voltar para a lista
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <section className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Campo label="Valor do anúncio" valor={formatBRL(imovel.valor_anuncio)} />
            <Campo label="Valor por m²" valor={imovel.valor_m2 ? `${formatBRL(imovel.valor_m2)}/m²` : null} />
            <Campo label="Valor do condomínio" valor={formatBRL(imovel.valor_condominio)} />
            <Campo label="Metragem" valor={imovel.metragem ? `${imovel.metragem} m²` : null} />
            <Campo label="Quartos" valor={imovel.quartos} />
            <Campo label="Suítes" valor={imovel.suites} />
            <Campo label="Banheiros" valor={imovel.banheiros} />
            <Campo label="Vagas" valor={imovel.vagas_garagem} />
            <Campo label="Andar" valor={imovel.andar} />
            <Campo label="Idade do prédio" valor={imovel.idade_predio ? `${imovel.idade_predio} anos` : null} />
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-600">Condomínio</h2>
            <StarDisplay nota={imovel.nota_estrelas_condominio} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Campo label="Vagas" valor={labelDe(VAGAS_TIPO, imovel.condominio_vagas_tipo)} />
            <Campo label="Qualidade da vaga" valor={labelDe(QUALIDADE_BMR, imovel.condominio_vaga_qualidade)} />
            <Campo label="Beleza" valor={labelDe(BELEZA_CONDOMINIO, imovel.condominio_beleza)} />
            <Campo label="Elevador" valor={labelDe(CONSERVACAO_BNR, imovel.condominio_elevador_qualidade)} />
            <Campo label="Portaria" valor={labelDe(PORTARIA_TIPO, imovel.condominio_portaria_tipo)} />
            <Campo
              label="Itens da área comum"
              valor={
                imovel.condominio_itens_area_comum?.length
                  ? imovel.condominio_itens_area_comum
                      .map((v) => (v === 'outro' ? imovel.condominio_itens_area_comum_outro || 'Outro' : labelDe(ITEM_AREA_COMUM, v)))
                      .join(', ')
                  : null
              }
            />
          </div>
          {!imovel.condominio_vagas_tipo &&
            !imovel.condominio_vaga_qualidade &&
            !imovel.condominio_beleza &&
            !imovel.condominio_elevador_qualidade &&
            !imovel.condominio_portaria_tipo &&
            !imovel.condominio_itens_area_comum?.length && <p className="text-sm text-slate-400">Não avaliado.</p>}
        </section>

        <section className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-600">Bairro</h2>
            <StarDisplay nota={imovel.nota_estrelas_bairro} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Campo label="Distância do trabalho" valor={labelDe(PERTO_MEDIO_LONGE, imovel.bairro_distancia_trabalho)} />
            <Campo label="Proximidade do metrô" valor={labelDe(PERTO_MEDIO_LONGE, imovel.bairro_proximidade_metro)} />
            <Campo label="Segurança da rua" valor={labelDe(SEGURANCA_RUA, imovel.bairro_seguranca_rua)} />
            <Campo label="Qualidade do bairro" valor={labelDe(QUALIDADE_BAIRRO, imovel.bairro_qualidade)} />
          </div>
          {!imovel.bairro_distancia_trabalho &&
            !imovel.bairro_proximidade_metro &&
            !imovel.bairro_seguranca_rua &&
            !imovel.bairro_qualidade && <p className="text-sm text-slate-400">Não avaliado.</p>}
        </section>

        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Cômodos</h2>
          {comodos.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum cômodo avaliado ainda.</p>
          ) : (
            <div className="space-y-4">
              {comodos.map((comodo) => (
                <div key={comodo.id} className="border border-slate-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700">
                      {comodo.identificador || labelDe(TIPO_COMODO, comodo.tipo_comodo)}
                    </p>
                    <StarDisplay nota={comodo.nota_estrelas} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {criteriosComodo(comodo).map((c) => (
                      <Campo key={c.label} label={c.label} valor={c.valor} />
                    ))}
                  </div>
                  {criteriosComodo(comodo).length === 0 && <p className="text-sm text-slate-400">Não avaliado.</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Galeria de fotos</h2>
          {galeria.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma foto cadastrada ainda.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {galeria.map(([caminho, url]) => (
                <img key={caminho} src={url} alt="Foto do imóvel" className="w-full h-28 object-cover rounded-md" />
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap gap-2">
          <Link
            to={`/imoveis/${id}/comodos`}
            className="rounded-md border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-50"
          >
            Avaliar cômodos
          </Link>
          <Link
            to={`/imoveis/${id}/condominio`}
            className="rounded-md border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-50"
          >
            Avaliar condomínio
          </Link>
          <Link
            to={`/imoveis/${id}/bairro`}
            className="rounded-md border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-50"
          >
            Avaliar bairro
          </Link>
        </section>
      </main>
    </div>
  )
}
