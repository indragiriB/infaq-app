import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import InputPembayaran from './pages/InputPembayaran';
import Rekap from './pages/Rekap';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/input"
            element={
              <ProtectedRoute>
                <InputPembayaran />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rekap"
            element={
              <ProtectedRoute>
                <Rekap />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/rekap" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
