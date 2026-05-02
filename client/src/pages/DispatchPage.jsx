import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Truck, Search, X, MapPin, FileText } from 'lucide-react';

const statusConfig = {
  PENDING: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
  PACKED: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  DISPATCHED: { bg: 'rgba(250,204,21,0.15)', text: '#fbbf24' },
  IN_TRANSIT: { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
  DELIVERED: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' },
  RETURNED: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
};

export default function DispatchPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerName: '', totalQty: '', transporterName: '', vehicleNumber: '' });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/dispatch');
      setOrders(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/dispatch', { ...form, totalQty: parseInt(form.totalQty) });
      setShowForm(false);
      setForm({ customerName: '', totalQty: '', transporterName: '', vehicleNumber: '' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/dispatch/${id}`, { status });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const filtered = orders.filter(o =>
    o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    o.orderNumber?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const stats = Object.keys(statusConfig).map(s => ({ status: s, count: orders.filter(o => o.status === s).length })).filter(s => s.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dispatch & Logistics</h1>
          <p className="text-navy-400 text-sm mt-1">{orders.length} dispatch orders</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <Plus size={16} /> New Dispatch
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        {stats.map(({ status, count }) => {
          const cfg = statusConfig[status];
          return (
            <div key={status} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: cfg.bg }}>
              <Truck size={14} style={{ color: cfg.text }} />
              <span className="text-sm font-medium" style={{ color: cfg.text }}>{count} {status.replace('_', ' ')}</span>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
          style={{ background: 'rgba(16,42,67,0.6)', border: '1px solid rgba(255,255,255,0.08)' }} />
      </div>

      {/* Cards */}
      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(o => {
            const sc = statusConfig[o.status] || statusConfig.PENDING;
            return (
              <div key={o.id} className="rounded-2xl p-5 border transition-all hover:border-amber-500/20" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold">{o.orderNumber}</p>
                    <p className="text-navy-400 text-xs mt-0.5">{o.customerName}</p>
                  </div>
                  <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: sc.bg, color: sc.text }}>{o.status.replace('_', ' ')}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-navy-300"><Package2 size={14} /> {o.totalQty} units</div>
                  {o.transporterName && <div className="flex items-center gap-2 text-navy-300"><Truck size={14} /> {o.transporterName}</div>}
                  {o.vehicleNumber && <div className="flex items-center gap-2 text-navy-300"><MapPin size={14} /> {o.vehicleNumber}</div>}
                  {o.challanNumber && <div className="flex items-center gap-2 text-navy-300"><FileText size={14} /> Challan: {o.challanNumber}</div>}
                </div>
                <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                    className="flex-1 text-xs rounded-lg px-2 py-1.5 text-white outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-navy-500 col-span-full text-center py-8">No dispatch orders yet</p>}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6 border" style={{ background: '#102a43', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">New Dispatch Order</h2>
              <button onClick={() => setShowForm(false)} className="text-navy-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {[{ label: 'Customer Name', key: 'customerName', required: true }, { label: 'Total Quantity', key: 'totalQty', type: 'number', required: true }, { label: 'Transporter', key: 'transporterName' }, { label: 'Vehicle Number', key: 'vehicleNumber' }].map(({ label, key, type = 'text', required }) => (
                <div key={key}>
                  <label className="block text-sm text-navy-300 mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required={required}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-amber-500/50" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              ))}
              <button type="submit" className="w-full py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>Create Dispatch Order</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Package2(props) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>;
}
