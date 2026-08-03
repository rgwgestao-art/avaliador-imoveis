import { supabase } from './supabaseClient'

export const BUCKET_FOTOS = 'imoveis-fotos'
const URL_EXPIRA_SEGUNDOS = 3600

export async function getSignedUrls(caminhos) {
  const entradas = await Promise.all(
    (caminhos ?? []).map(async (caminho) => {
      const { data } = await supabase.storage.from(BUCKET_FOTOS).createSignedUrl(caminho, URL_EXPIRA_SEGUNDOS)
      return [caminho, data?.signedUrl]
    })
  )
  return Object.fromEntries(entradas)
}
