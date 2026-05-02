import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Search, X, Wrench, AlertCircle, Clock, CheckCircle } from 'lucide-react';

const statusConfig = {
  OPEN: { bg: 'rgba(239,68,68,0.15)', text: '#f87171', icon: AlertCircle },
  ASSIGNED: { bg: 'rgba(250,204,21,0.15)', text: '#fbbf24', icon: Clock },
  IN_PROGRESS: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', icon: Wrench },
  RESOLVED: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', icon: CheckCircle },
  CLOSED: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: CheckCircle },
};

const priorityColors = { LOW: '#94a3b8', MEDIUM: '#fbbf24', HIGH: '#fb923c', CRITICAL: '#f87171' };

export default function MaintenancePage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'machine', priority: 'MEDIUM', slaHours: '' });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/maintenance', { params: { status: statusFilter || undefined } });
      setTickets(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/maintenance', { ...form, slaHours: parseInt(form.slaHours || 0) || null });
      setShowForm(false);
      setForm({ title: '', description: '', category: 'machine', priority: 'MEDIUM', slaHours: '' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try { await api.put(`/maintenance/${id}`, { status }); fetchData(); } catch (err) { console.error(err); }
  };

  const stats = Object.keys(statusConfig).map(s => ({ status: s, count: tickets.filter(t => t.status === s).length }));

  const getSlaStatus = (ticket) => {
    if (!ticket.slaHours || ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return null;
    const elapsed = (Date.now() - new Date(ticket.createdAt).getTime()) / 3600000;
    if (elapsed > ticket.slaHours) return 'breached';
    if (elapsed > ticket.slaHours * 0.75) return 'warning';
    return 'ok';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Service & Maintenance</h1><p className="text-navy-400 text-sm mt-1">{tickets.length} tickets</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}><Plus size={16} /> Raise Ticket</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map(({ status, count }) => {
          const cfg = statusConfig[status];
          return (
            <button key={status} onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              className={`rounded-xl p-3 border text-center transition-all ${statusFilter === status ? 'ring-2 ring-amber-500/50' : ''}`}
              style={{ background: cfg.bg, borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-2xl font-bold" style={{ color: cfg.text }}>{count}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: cfg.text }}>{status.replace('_', ' ')}</p>
            </button>
          );
        })}
      </div>

      {/* Tickets */}
      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div> : (
        <div className="space-y-3">
          {tickets.length === 0 ? <p className="text-navy-500 text-center py-8">No tickets found</p> :
            tickets.map(t => {
              const sc = statusConfig[t.status] || statusConfig.OPEN;
              const Icon = sc.icon;
              const sla = getSlaStatus(t);
              return (
                <div key={t.id} className="rounded-2xl p-5 border transition-all hover:border-amber-500/20" style={{ background: 'rgba(16,42,67,0.6)', borderColor: sla === 'breached' ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)' }}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: sc.bg }}><Icon size={18} style={{ color: sc.text }} /></div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-semibold">{t.ticketNumber}</p>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium" style={{ background: sc.bg, color: sc.text }}>{t.status.replace('_', ' ')}</span>
                          <span className="w-2 h-2 rounded-full" style={{ background: priorityColors[t.priority] }} title={t.priority} />
                          {sla === 'breached' && <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-red-500/20 text-red-400">SLA BREACHED</span>}
                          {sla === 'warning' && <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-yellow-500/20 text-yellow-400">SLA WARNING</span>}
                        </div>
                        <p className="text-white mt-1">{t.title}</p>
                        {t.description && <p className="text-navy-400 text-sm mt-0.5">{t.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-navy-500">
                          <span>📁 {t.category}</span>
                          <span>⚡ {t.priority}</span>
                          {t.slaHours && <span>⏱️ SLA: {t.slaHours}h</span>}
                          <span>📅 {new Date(t.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                    <select value={t.status} onChange={e => updateStatus(t.id, e.target.value)}
                      className="text-xs rounded-lg px-2 py-1.5 text-white outline-none shrink-0" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6 border" style={{ background: '#102a43', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5"><h2 className="text-white font-bold text-lg">Raise Service Ticket</h2><button onClick={() => setShowForm(false)} className="text-navy-400 hover:text-white"><X size={20} /></button></div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div><label className="block text-sm text-navy-300 mb-1">Title</label><input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} /></div>
              <div><label className="block text-sm text-navy-300 mb-1">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none resize-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm text-navy-300 mb-1">Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>{['machine', 'utility', 'IT', 'other'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-sm text-navy-300 mb-1">Priority</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>{['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div><label className="block text-sm text-navy-300 mb-1">SLA (hrs)</label><input type="number" value={form.slaHours} onChange={e => setForm({ ...form, slaHours: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} /></div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>Raise Ticket</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
