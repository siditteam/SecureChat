import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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

import LoadingOverlay from './components/LoadingOverlay';

function AuthLoader() {
  const { loading } = useAuth();
  return <LoadingOverlay show={loading} />;
}

const F = "'Space Grotesk', sans-serif";

function SessionReplacedScreen() {
  const { clearSessionReplaced } = useAuth();
  const navigate = useNavigate();

  const signInAgain = () => {
    clearSessionReplaced();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: F }}>
      <div style={{ maxWidth: 380, width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: 20, padding: '40px 32px', textAlign: 'center', boxShadow: '0 4px 40px rgba(15,23,36,0.08)' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(10,163,163,0.08)', border: '2px solid rgba(10,163,163,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg style={{ width: 24, height: 24, color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 10 }}>
          Signed in elsewhere
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 32 }}>
          Someone signed in to your UNDDR account on another device. This session has ended for your security.
        </p>
        <button
          onClick={signInAgain}
          style={{ width: '100%', background: 'var(--accent)', color: '#fff', fontFamily: F, fontWeight: 700, fontSize: 15, padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer' }}
        >
          Sign in on this device →
        </button>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 16, opacity: 0.6 }}>
          If this wasn't you, change your phone's SIM security immediately.
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

// Root: marketing page for guests, chat for logged-in users
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Chat /> : <LandingPage />;
}

function AppRoutes() {
  const { sessionReplaced } = useAuth();
  if (sessionReplaced) return <SessionReplacedScreen />;
  return (
    <>
      <AuthLoader />
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
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <CallProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </CallProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
