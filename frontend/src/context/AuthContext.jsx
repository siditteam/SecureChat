import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { generateKeyPair } from '../utils/crypto';

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    axios
      .get(`${API}/auth/me`)
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('privateKey');
        delete axios.defaults.headers.common['Authorization'];
      })
      .finally(() => setLoading(false));
  }, []);

  // Step 1: request OTP
  const sendOtp = async (phone) => {
    const res = await axios.post(`${API}/auth/send-otp`, { phone });
    return res.data; // { message, devOtp?, devMode? }
  };

  // Step 2: verify OTP → get verifiedToken
  const verifyOtp = async (phone, otp) => {
    const res = await axios.post(`${API}/auth/verify-otp`, { phone, otp });
    return res.data; // { verifiedToken, isRegistered }
  };

  // Step 3a: complete registration (generates E2EE key pair)
  const register = async (phone, verifiedToken, username, inviteCode) => {
    const { publicKeyJwk, privateKeyJwk } = await generateKeyPair();

    const res = await axios.post(`${API}/auth/register`, {
      phone,
      verifiedToken,
      username,
      publicKey: JSON.stringify(publicKeyJwk),
      ...(inviteCode && { inviteCode }),
    });

    const { token, user: newUser } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('privateKey', JSON.stringify(privateKeyJwk));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(newUser);
    return newUser;
  };

  // Step 3b: complete login (reuses or regenerates key pair)
  const login = async (phone, verifiedToken) => {
    let storedPrivate = JSON.parse(localStorage.getItem('privateKey') || 'null');
    let newPublicKeyJwk = null;

    if (!storedPrivate) {
      const keys = await generateKeyPair();
      storedPrivate = keys.privateKeyJwk;
      newPublicKeyJwk = keys.publicKeyJwk;
      localStorage.setItem('privateKey', JSON.stringify(storedPrivate));
    }

    const res = await axios.post(`${API}/auth/login`, {
      phone,
      verifiedToken,
      ...(newPublicKeyJwk && { publicKey: JSON.stringify(newPublicKeyJwk) }),
    });

    const { token, user: loggedIn } = res.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(loggedIn);
    return loggedIn;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('privateKey');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => prev ? { ...prev, ...updatedFields } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, loading, sendOtp, verifyOtp, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
