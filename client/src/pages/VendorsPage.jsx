import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Search, X, Star, FileText, IndianRupee } from 'lucide-react';

const poStatusColors = {
  DRAFT: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
  PENDING_APPROVAL: { bg: 'rgba(250,204,21,0.15)', text: '#fbbf24' },
  APPROVED: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' },
  ORDERED: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  PARTIALLY_RECEIVED: { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
  RECEIVED: { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
  CANCELLED: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('vendors');
  const [search, setSearch] = useState('');
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showPoForm, setShowPoForm] = useState(false);
  const [vForm, setVForm] = useState({ name: '', code: '', gstNumber: '', contactName: '', email: '', phone: '', address: '', city: '', state: '' });
  const [poForm, setPoForm] = useState({ vendorId: '', totalAmount: '', gstAmount: '', notes: '' });

  const fetchData = async () => {
    try {
      const [vRes, poRes] = await Promise.all([api.get('/vendors', { params: { search: search || undefined } }), api.get('/vendors/purchase-orders')]);
      setVendors(vRes.data.data);
      setPos(poRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const createVendor = async (e) => {
    e.preventDefault();
    try { await api.post('/vendors', vForm); setShowVendorForm(false); setVForm({ name: '', code: '', gstNumber: '', contactName: '', email: '', phone: '', address: '', city: '', state: '' }); fetchData(); } catch (err) { console.error(err); }
  };

  const createPO = async (e) => {
    e.preventDefault();
    try { await api.post('/vendors/purchase-orders', { ...poForm, totalAmount: parseFloat(poForm.totalAmount || 0), gstAmount: parseFloat(poForm.gstAmount || 0) }); setShowPoForm(false); setPoForm({ vendorId: '', totalAmount: '', gstAmount: '', notes: '' }); fetchData(); } catch (err) { console.error(err); }
  };

  const updatePoStatus = async (id, status) => {
    try { await api.put(`/vendors/purchase-orders/${id}`, { status }); fetchData(); } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Vendor & Purchase</h1><p className="text-navy-400 text-sm mt-1">{vendors.length} vendors • {pos.length} POs</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowPoForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm border border-amber-500/30 hover:bg-amber-500/10"><FileText size={14} /> New PO</button>
          <button onClick={() => setShowVendorForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}><Plus size={16} /> Add Vendor</button>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(16,42,67,0.6)' }}>
        {['vendors', 'purchase-orders'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'text-amber-400' : 'text-navy-400 hover:text-white'}`} style={tab === t ? { background: 'rgba(245,158,11,0.1)' } : {}}>{t === 'vendors' ? 'Vendors' : 'Purchase Orders'}</button>
        ))}
      </div>

      {tab === 'vendors' && (
        <>
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..." className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(16,42,67,0.6)', border: '1px solid rgba(255,255,255,0.08)' }} onKeyDown={e => e.key === 'Enter' && fetchData()} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vendors.map(v => (
              <div key={v.id} className="rounded-2xl p-5 border transition-all hover:border-amber-500/20" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div><p className="text-white font-semibold">{v.name}</p><p className="text-navy-500 text-xs">{v.code}</p></div>
                  <div className="flex items-center gap-1">{[1,2,3,4,5].map(i => <Star key={i} size={12} className={i <= (v.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-navy-600'} />)}</div>
                </div>
                <div className="space-y-1.5 text-sm text-navy-300">
                  {v.gstNumber && <p className="font-mono text-xs">GST: {v.gstNumber}</p>}
                  {v.contactName && <p>👤 {v.contactName}</p>}
                  {v.phone && <p>📱 {v.phone}</p>}
                  {v.city && <p>📍 {v.city}, {v.state}</p>}
                </div>
              </div>
            ))}
            {vendors.length === 0 && <p className="text-navy-500 col-span-full text-center py-8">No vendors yet</p>}
          </div>
        </>
      )}

      {tab === 'purchase-orders' && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(10,25,41,0.5)' }}>
              {['PO #', 'Vendor', 'Amount', 'GST', 'Status', 'Action'].map(h => <th key={h} className="text-left px-4 py-3 text-navy-400 font-medium text-xs uppercase">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {pos.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-navy-500">No purchase orders</td></tr> :
                pos.map(po => {
                  const sc = poStatusColors[po.status] || poStatusColors.DRAFT;
                  return (
                    <tr key={po.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white font-medium">{po.poNumber}</td>
                      <td className="px-4 py-3 text-navy-300">{po.vendor?.name}</td>
                      <td className="px-4 py-3 text-white">₹{(po.totalAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-navy-400">₹{(po.gstAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: sc.bg, color: sc.text }}>{po.status.replace('_', ' ')}</span></td>
                      <td className="px-4 py-3"><select value={po.status} onChange={e => updatePoStatus(po.id, e.target.value)} className="text-xs rounded-lg px-2 py-1 text-white outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>{Object.keys(poStatusColors).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {showVendorForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl p-6 border my-4" style={{ background: '#102a43', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5"><h2 className="text-white font-bold text-lg">Add Vendor</h2><button onClick={() => setShowVendorForm(false)} className="text-navy-400 hover:text-white"><X size={20} /></button></div>
            <form onSubmit={createVendor} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[{l:'Vendor Name',k:'name',r:true},{l:'Vendor Code',k:'code',r:true}].map(f=><div key={f.k}><label className="block text-sm text-navy-300 mb-1">{f.l}</label><input type="text" value={vForm[f.k]} onChange={e=>setVForm({...vForm,[f.k]:e.target.value})} required={f.r} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{background:'rgba(10,25,41,0.8)',border:'1px solid rgba(255,255,255,0.1)'}}/></div>)}
              </div>
              {[{l:'GST Number',k:'gstNumber'},{l:'Contact Person',k:'contactName'},{l:'Email',k:'email'},{l:'Phone',k:'phone'},{l:'Address',k:'address'}].map(f=><div key={f.k}><label className="block text-sm text-navy-300 mb-1">{f.l}</label><input type="text" value={vForm[f.k]} onChange={e=>setVForm({...vForm,[f.k]:e.target.value})} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{background:'rgba(10,25,41,0.8)',border:'1px solid rgba(255,255,255,0.1)'}}/></div>)}
              <div className="grid grid-cols-2 gap-3">
                {[{l:'City',k:'city'},{l:'State',k:'state'}].map(f=><div key={f.k}><label className="block text-sm text-navy-300 mb-1">{f.l}</label><input type="text" value={vForm[f.k]} onChange={e=>setVForm({...vForm,[f.k]:e.target.value})} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{background:'rgba(10,25,41,0.8)',border:'1px solid rgba(255,255,255,0.1)'}}/></div>)}
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl font-semibold text-white text-sm" style={{background:'linear-gradient(135deg, #f59e0b, #d97706)'}}>Add Vendor</button>
            </form>
          </div>
        </div>
      )}

      {showPoForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6 border" style={{background:'#102a43',borderColor:'rgba(255,255,255,0.1)'}}>
            <div className="flex items-center justify-between mb-5"><h2 className="text-white font-bold text-lg">New Purchase Order</h2><button onClick={()=>setShowPoForm(false)} className="text-navy-400 hover:text-white"><X size={20}/></button></div>
            <form onSubmit={createPO} className="space-y-3">
              <div><label className="block text-sm text-navy-300 mb-1">Vendor</label><select value={poForm.vendorId} onChange={e=>setPoForm({...poForm,vendorId:e.target.value})} required className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{background:'rgba(10,25,41,0.8)',border:'1px solid rgba(255,255,255,0.1)'}}><option value="">Select vendor</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-navy-300 mb-1">Amount (₹)</label><input type="number" value={poForm.totalAmount} onChange={e=>setPoForm({...poForm,totalAmount:e.target.value})} required className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{background:'rgba(10,25,41,0.8)',border:'1px solid rgba(255,255,255,0.1)'}}/></div>
                <div><label className="block text-sm text-navy-300 mb-1">GST (₹)</label><input type="number" value={poForm.gstAmount} onChange={e=>setPoForm({...poForm,gstAmount:e.target.value})} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{background:'rgba(10,25,41,0.8)',border:'1px solid rgba(255,255,255,0.1)'}}/></div>
              </div>
              <div><label className="block text-sm text-navy-300 mb-1">Notes</label><input type="text" value={poForm.notes} onChange={e=>setPoForm({...poForm,notes:e.target.value})} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{background:'rgba(10,25,41,0.8)',border:'1px solid rgba(255,255,255,0.1)'}}/></div>
              <button type="submit" className="w-full py-2.5 rounded-xl font-semibold text-white text-sm" style={{background:'linear-gradient(135deg, #f59e0b, #d97706)'}}>Create PO</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
