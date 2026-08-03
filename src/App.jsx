import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ImoveisListPage from './pages/ImoveisListPage'
import ImovelFormPage from './pages/ImovelFormPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ImoveisListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/imoveis/novo"
            element={
              <ProtectedRoute>
                <ImovelFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/imoveis/:id"
            element={
              <ProtectedRoute>
                <ImovelFormPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
