import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { CallProvider } from './context/CallContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import AddFriend from './pages/AddFriend';
import InviteLanding from './pages/InviteLanding';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Manual from './pages/Manual';
import LandingPage from './pages/LandingPage';
import Apply from './pages/Apply';
import IncomingCallModal from './components/IncomingCallModal';
import ActiveCallOverlay from './components/ActiveCallOverlay';

function Spinner() {
  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-3 border-primary-800 border-t-primary-400 rounded-full animate-spin" />
        <p className="text-primary-300 font-medium">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to="/" replace /> : children;
}

// Root: marketing page for guests, chat for logged-in users
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Chat /> : <LandingPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <CallProvider>
            <ToastProvider>
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/add/:username" element={<AddFriend />} />
              <Route path="/invite/:code" element={<InviteLanding />} />
              <Route path="/manual" element={<Manual />} />
              <Route path="/apply" element={<Apply />} />
              <Route path="/" element={<RootRoute />} />
              <Route path="/about" element={<LandingPage />} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            </Routes>
            <IncomingCallModal />
            <ActiveCallOverlay />
            </ToastProvider>
          </CallProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
