import { Link } from 'react-router-dom'

export default function EmConstrucaoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-500">
      <p>Esta tela ainda será construída na próxima etapa.</p>
      <Link to="/" className="text-sm text-slate-700 underline">
        Voltar para a lista
      </Link>
    </div>
  )
}
