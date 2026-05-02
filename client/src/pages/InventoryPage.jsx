import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Search, X, Package, AlertTriangle, ArrowUpDown, Warehouse } from 'lucide-react';

const categoryColors = {
  RAW_MATERIAL: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', label: 'Raw Material' },
  WIP: { bg: 'rgba(250,204,21,0.15)', text: '#fbbf24', label: 'WIP' },
  FINISHED_GOODS: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', label: 'Finished Goods' },
  CONSUMABLE: { bg: 'rgba(168,85,247,0.15)', text: '#a78bfa', label: 'Consumable' },
  SPARE_PART: { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', label: 'Spare Part' },
};

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showTxn, setShowTxn] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', category: 'RAW_MATERIAL', quantity: '', unit: 'kg', unitCost: '', reorderLevel: '', warehouseId: '' });
  const [txnForm, setTxnForm] = useState({ type: 'INWARD', quantity: '', notes: '' });

  const fetchData = async () => {
    try {
      const [itemsRes, whRes] = await Promise.all([
        api.get('/inventory/items', { params: { category: catFilter || undefined, search: search || undefined } }),
        api.get('/inventory/warehouses')
      ]);
      setItems(itemsRes.data.data);
      setLowStockCount(itemsRes.data.lowStockCount || 0);
      setWarehouses(whRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [catFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/items', { ...form, quantity: parseFloat(form.quantity || 0), unitCost: parseFloat(form.unitCost || 0), reorderLevel: parseFloat(form.reorderLevel || 0) });
      setShowForm(false);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleTxn = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/transactions', { stockItemId: showTxn, ...txnForm, quantity: parseFloat(txnForm.quantity) });
      setShowTxn(null);
      setTxnForm({ type: 'INWARD', quantity: '', notes: '' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory & Store</h1>
          <p className="text-navy-400 text-sm mt-1">{items.length} items • Total value: ₹{totalValue.toLocaleString('en-IN')}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <Plus size={16} /> Add Stock Item
        </button>
      </div>

      {/* Alerts */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={18} className="text-red-400" />
          <p className="text-red-300 text-sm font-medium">{lowStockCount} item(s) below reorder level</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); }} placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(16,42,67,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
            onKeyDown={e => e.key === 'Enter' && fetchData()} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(16,42,67,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="">All Categories</option>
          {Object.entries(categoryColors).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(10,25,41,0.5)' }}>
              {['Item', 'SKU', 'Category', 'Qty', 'Unit Cost', 'Value', 'Reorder', 'Action'].map(h => <th key={h} className="text-left px-4 py-3 text-navy-400 font-medium text-xs uppercase">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {loading ? <tr><td colSpan={8} className="text-center py-12 text-navy-500">Loading...</td></tr> :
                items.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-navy-500">No stock items</td></tr> :
                items.map(item => {
                  const isLow = item.reorderLevel > 0 && item.quantity <= item.reorderLevel;
                  const cc = categoryColors[item.category] || categoryColors.RAW_MATERIAL;
                  return (
                    <tr key={item.id} className={`hover:bg-white/[0.02] ${isLow ? 'bg-red-500/5' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-navy-500 text-xs">{item.warehouse?.name}</p>
                      </td>
                      <td className="px-4 py-3 text-navy-300 font-mono text-xs">{item.sku}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg text-xs font-medium" style={{ background: cc.bg, color: cc.text }}>{cc.label}</span></td>
                      <td className={`px-4 py-3 font-medium ${isLow ? 'text-red-400' : 'text-white'}`}>{item.quantity} {item.unit}</td>
                      <td className="px-4 py-3 text-navy-300">₹{item.unitCost.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-white">₹{(item.quantity * item.unitCost).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-navy-400">{item.reorderLevel || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setShowTxn(item.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-amber-400 hover:bg-amber-500/10">
                          <ArrowUpDown size={12} /> Transact
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl p-6 border my-4" style={{ background: '#102a43', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Add Stock Item</h2>
              <button onClick={() => setShowForm(false)} className="text-navy-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-navy-300 mb-1">Item Name</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} /></div>
                <div><label className="block text-sm text-navy-300 mb-1">SKU</label><input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-navy-300 mb-1">Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>{Object.entries(categoryColors).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                <div><label className="block text-sm text-navy-300 mb-1">Warehouse</label><select value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })} required className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}><option value="">Select</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm text-navy-300 mb-1">Quantity</label><input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} /></div>
                <div><label className="block text-sm text-navy-300 mb-1">Unit Cost (₹)</label><input type="number" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} /></div>
                <div><label className="block text-sm text-navy-300 mb-1">Reorder Level</label><input type="number" value={form.reorderLevel} onChange={e => setForm({ ...form, reorderLevel: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} /></div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>Add Item</button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTxn && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm rounded-2xl p-6 border" style={{ background: '#102a43', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Stock Transaction</h2>
              <button onClick={() => setShowTxn(null)} className="text-navy-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleTxn} className="space-y-3">
              <div><label className="block text-sm text-navy-300 mb-1">Type</label><select value={txnForm.type} onChange={e => setTxnForm({ ...txnForm, type: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>{['INWARD', 'OUTWARD', 'ADJUSTMENT', 'SCRAP', 'RETURN'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="block text-sm text-navy-300 mb-1">Quantity</label><input type="number" value={txnForm.quantity} onChange={e => setTxnForm({ ...txnForm, quantity: e.target.value })} required className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} /></div>
              <div><label className="block text-sm text-navy-300 mb-1">Notes</label><input type="text" value={txnForm.notes} onChange={e => setTxnForm({ ...txnForm, notes: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} /></div>
              <button type="submit" className="w-full py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>Record Transaction</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
