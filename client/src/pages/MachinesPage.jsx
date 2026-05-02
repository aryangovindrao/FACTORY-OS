import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Cog, X } from 'lucide-react';

const statusConfig = {
  RUNNING: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', dot: '#22c55e', label: 'Running' },
  IDLE: { bg: 'rgba(250,204,21,0.15)', text: '#facc15', dot: '#eab308', label: 'Idle' },
  MAINTENANCE: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', dot: '#3b82f6', label: 'Maintenance' },
  BREAKDOWN: { bg: 'rgba(239,68,68,0.15)', text: '#f87171', dot: '#ef4444', label: 'Breakdown' },
  OFF: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', dot: '#64748b', label: 'Off' },
};

export default function MachinesPage() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', type: '', department: '', location: '' });

  const fetchMachines = async () => {
    try {
      const { data } = await api.get('/production/machines');
      setMachines(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMachines(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/production/machines', form);
      setShowForm(false);
      setForm({ name: '', code: '', type: '', department: '', location: '' });
      fetchMachines();
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/production/machines/${id}`, { status });
      fetchMachines();
    } catch (err) { console.error(err); }
  };

  const grouped = machines.reduce((acc, m) => {
    const dept = m.department || 'Unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Machines</h1>
          <p className="text-navy-400 text-sm mt-1">{machines.length} machines • {machines.filter(m => m.status === 'RUNNING').length} running</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <Plus size={16} /> Add Machine
        </button>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const count = machines.filter(m => m.status === key).length;
          return (
            <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: cfg.bg }}>
              <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
              <span className="text-sm font-medium" style={{ color: cfg.text }}>{count} {cfg.label}</span>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>
      ) : (
        Object.entries(grouped).map(([dept, deptMachines]) => (
          <div key={dept}>
            <h2 className="text-navy-300 font-semibold text-sm uppercase tracking-wider mb-3">{dept}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {deptMachines.map(m => {
                const cfg = statusConfig[m.status] || statusConfig.OFF;
                return (
                  <div key={m.id} className="rounded-2xl p-4 border transition-all hover:border-amber-500/30 hover:scale-[1.01]"
                    style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                        <Cog size={18} style={{ color: cfg.text }} />
                      </div>
                      <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: cfg.bg, color: cfg.text }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} /> {cfg.label}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold">{m.name}</h3>
                    <p className="text-navy-500 text-xs mt-0.5">{m.code} • {m.type}</p>
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <select value={m.status} onChange={e => updateStatus(m.id, e.target.value)}
                        className="w-full text-xs rounded-lg px-2 py-1.5 text-white outline-none"
                        style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {Object.keys(statusConfig).map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6 border" style={{ background: '#102a43', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Add Machine</h2>
              <button onClick={() => setShowForm(false)} className="text-navy-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {['name', 'code', 'type', 'department', 'location'].map(key => (
                <div key={key}>
                  <label className="block text-sm text-navy-300 mb-1 capitalize">{key}</label>
                  <input type="text" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required={key === 'name' || key === 'code'}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
                    style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              ))}
              <button type="submit" className="w-full py-2.5 rounded-xl font-semibold text-white text-sm mt-2"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>Add Machine</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
