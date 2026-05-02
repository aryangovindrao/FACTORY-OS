import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data.data.user);
          setTenant(data.data.tenant);
        })
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, tenantSlug) => {
    const { data } = await api.post('/auth/login', { email, password, tenantSlug });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    setTenant(data.data.tenant);
    return data.data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }); } catch {}
    localStorage.clear();
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
