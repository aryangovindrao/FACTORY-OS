import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Search, Filter, ChevronDown, X } from 'lucide-react';

const statusColors = {
  DRAFT: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
  SCHEDULED: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  IN_PROGRESS: { bg: 'rgba(250,204,21,0.15)', text: '#fbbf24' },
  ON_HOLD: { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
  COMPLETED: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' },
  CANCELLED: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
};

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [machines, setMachines] = useState([]);
  const [form, setForm] = useState({ productName: '', productCode: '', targetQty: '', unit: 'meters', priority: 'MEDIUM', machineId: '', notes: '' });

  const fetchData = async () => {
    try {
      const [woRes, machRes] = await Promise.all([
        api.get('/production/work-orders', { params: { status: statusFilter || undefined } }),
        api.get('/production/machines')
      ]);
      setWorkOrders(woRes.data.data);
      setMachines(machRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/production/work-orders', { ...form, targetQty: parseInt(form.targetQty) });
      setShowForm(false);
      setForm({ productName: '', productCode: '', targetQty: '', unit: 'meters', priority: 'MEDIUM', machineId: '', notes: '' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try {
      const update = { status };
      if (status === 'IN_PROGRESS') update.actualStart = new Date().toISOString();
      if (status === 'COMPLETED') update.actualEnd = new Date().toISOString();
      await api.put(`/production/work-orders/${id}`, update);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const filtered = workOrders.filter(wo =>
    wo.productName?.toLowerCase().includes(search.toLowerCase()) ||
    wo.orderNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Work Orders</h1>
          <p className="text-navy-400 text-sm mt-1">{workOrders.length} total orders</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <Plus size={16} /> New Work Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
            style={{ background: 'rgba(16,42,67,0.6)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-white text-sm outline-none"
          style={{ background: 'rgba(16,42,67,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="">All Status</option>
          {Object.keys(statusColors).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(10,25,41,0.5)' }}>
                {['Order #', 'Product', 'Machine', 'Status', 'Priority', 'Progress', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-navy-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-navy-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-navy-500">No work orders found</td></tr>
              ) : filtered.map(wo => {
                const progress = wo.targetQty > 0 ? Math.round((wo.completedQty / wo.targetQty) * 100) : 0;
                const sc = statusColors[wo.status] || statusColors.DRAFT;
                return (
                  <tr key={wo.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{wo.orderNumber}</td>
                    <td className="px-4 py-3"><p className="text-white">{wo.productName}</p><p className="text-navy-500 text-xs">{wo.productCode}</p></td>
                    <td className="px-4 py-3 text-navy-300">{wo.machine?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: sc.bg, color: sc.text }}>{wo.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-navy-300">{wo.priority}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: progress >= 100 ? '#22c55e' : '#f59e0b' }} />
                        </div>
                        <span className="text-navy-300 text-xs w-12 text-right">{wo.completedQty}/{wo.targetQty}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select value={wo.status} onChange={e => updateStatus(wo.id, e.target.value)}
                        className="text-xs rounded-lg px-2 py-1 text-white outline-none"
                        style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {Object.keys(statusColors).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-2xl p-6 border" style={{ background: '#102a43', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">New Work Order</h2>
              <button onClick={() => setShowForm(false)} className="text-navy-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {[
                { label: 'Product Name', key: 'productName', type: 'text', required: true },
                { label: 'Product Code', key: 'productCode', type: 'text' },
                { label: 'Target Quantity', key: 'targetQty', type: 'number', required: true },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="block text-sm text-navy-300 mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required={required}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
                    style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-navy-300 mb-1">Machine</label>
                  <select value={form.machineId} onChange={e => setForm({ ...form, machineId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="">Select machine</option>
                    {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-navy-300 mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl font-semibold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>Create Work Order</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
