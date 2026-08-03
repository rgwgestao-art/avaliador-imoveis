import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { BUCKET_FOTOS, getSignedUrls } from '../lib/storage'

export default function PhotoUploader({ bucketPath, fotos, onChange }) {
  const [urlsAssinadas, setUrlsAssinadas] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let cancelado = false

    getSignedUrls(fotos).then((urls) => {
      if (!cancelado) setUrlsAssinadas(urls)
    })

    return () => {
      cancelado = true
    }
  }, [fotos])

  async function handleFileChange(e) {
    const arquivos = Array.from(e.target.files ?? [])
    if (arquivos.length === 0) return

    setEnviando(true)
    setErro('')
    const novosCaminhos = []

    for (const arquivo of arquivos) {
      const nomeSanitizado = arquivo.name.replace(/[^\w.\-]/g, '_')
      const caminho = `${bucketPath}/${Date.now()}-${nomeSanitizado}`
      const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(caminho, arquivo)
      if (error) {
        setErro(error.message)
      } else {
        novosCaminhos.push(caminho)
      }
    }

    setEnviando(false)
    e.target.value = ''
    if (novosCaminhos.length > 0) {
      onChange([...(fotos ?? []), ...novosCaminhos])
    }
  }

  async function handleRemover(caminho) {
    setErro('')
    const { error } = await supabase.storage.from(BUCKET_FOTOS).remove([caminho])
    if (error) {
      setErro(error.message)
      return
    }
    onChange((fotos ?? []).filter((f) => f !== caminho))
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Fotos</label>

      <div className="flex flex-wrap gap-3 mb-2">
        {(fotos ?? []).map((caminho) => (
          <div key={caminho} className="relative w-24 h-24 rounded-md overflow-hidden bg-slate-100">
            {urlsAssinadas[caminho] ? (
              <img src={urlsAssinadas[caminho]} alt="Foto do cômodo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">...</div>
            )}
            <button
              type="button"
              onClick={() => handleRemover(caminho)}
              className="absolute top-1 right-1 bg-black/60 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/80"
              aria-label="Remover foto"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        disabled={enviando}
        className="text-sm text-slate-600"
      />
      {enviando && <p className="text-xs text-slate-400 mt-1">Enviando...</p>}
      {erro && <p className="text-xs text-red-600 mt-1">{erro}</p>}
    </div>
  )
}
