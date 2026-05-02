import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Factory, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('owner@surattextile.com');
  const [password, setPassword] = useState('Password@123');
  const [tenantSlug, setTenantSlug] = useState('surat-textile-mill');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, tenantSlug);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #102a43 50%, #1a365d 100%)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-5" style={{
            width: `${200 + i * 100}px`, height: `${200 + i * 100}px`,
            background: 'radial-gradient(circle, #f59e0b, transparent)',
            top: `${10 + i * 15}%`, left: `${5 + i * 20}%`,
            animation: `pulse ${3 + i}s infinite alternate`
          }} />
        ))}
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Factory className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">FactoryOS</h1>
          <p className="text-navy-400 mt-1">Factory Management Platform</p>
        </div>

        <div className="rounded-2xl p-8 border" style={{ background: 'rgba(16, 42, 67, 0.8)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.1)' }}>
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm font-medium" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-navy-300 mb-1.5">Factory ID</label>
              <input type="text" value={tenantSlug} onChange={e => setTenantSlug(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-navy-500 outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
                style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                placeholder="factory-slug" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-300 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-navy-500 outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
                style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                placeholder="you@factory.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl text-white placeholder-navy-500 outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
                  style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-white transition-colors">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>
        </div>

        <p className="text-center text-navy-500 text-xs mt-6">© 2026 FactoryOS. Industrial Management Platform.</p>
      </div>
    </div>
  );
}
