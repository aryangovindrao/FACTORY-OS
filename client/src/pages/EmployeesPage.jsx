import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Search, X, Users, UserCheck, Clock, Calendar } from 'lucide-react';

const typeColors = {
  PERMANENT: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' },
  CONTRACT: { bg: 'rgba(250,204,21,0.15)', text: '#fbbf24' },
  TEMPORARY: { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
  TRAINEE: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('list'); // list, attendance, leaves
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', department: '', designation: '', employeeType: 'PERMANENT', salary: '' });

  const fetchData = async () => {
    try {
      const [empRes, attRes, leaveRes] = await Promise.all([
        api.get('/employees', { params: { search: search || undefined } }),
        api.get('/employees/attendance'),
        api.get('/employees/leaves')
      ]);
      setEmployees(empRes.data.data);
      setAttendance(attRes.data.data);
      setLeaves(leaveRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees', { ...form, salary: parseFloat(form.salary || 0) });
      setShowForm(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', department: '', designation: '', employeeType: 'PERMANENT', salary: '' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const approveLeave = async (id, status) => {
    try {
      await api.put(`/employees/leaves/${id}`, { status });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeCode?.toLowerCase().includes(search.toLowerCase())
  );

  const deptGroups = filtered.reduce((acc, e) => { const d = e.department || 'Unassigned'; (acc[d] = acc[d] || []).push(e); return acc; }, {});

  const tabs = [
    { id: 'list', label: 'Employee List', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'leaves', label: 'Leave Requests', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Management</h1>
          <p className="text-navy-400 text-sm mt-1">{employees.length} employees</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(16,42,67,0.6)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'text-amber-400' : 'text-navy-400 hover:text-white'}`}
            style={tab === t.id ? { background: 'rgba(245,158,11,0.1)' } : {}}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
              style={{ background: 'rgba(16,42,67,0.6)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>

          {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div> : (
            Object.entries(deptGroups).map(([dept, emps]) => (
              <div key={dept}>
                <h2 className="text-navy-300 font-semibold text-sm uppercase tracking-wider mb-3">{dept} ({emps.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {emps.map(e => {
                    const tc = typeColors[e.employeeType] || typeColors.PERMANENT;
                    return (
                      <div key={e.id} className="rounded-2xl p-4 border transition-all hover:border-amber-500/20" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            {e.firstName?.[0]}{e.lastName?.[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium">{e.firstName} {e.lastName}</p>
                            <p className="text-navy-500 text-xs">{e.employeeCode} • {e.designation || 'N/A'}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium" style={{ background: tc.bg, color: tc.text }}>{e.employeeType}</span>
                        </div>
                        <div className="mt-3 pt-3 grid grid-cols-2 gap-2 text-xs text-navy-400" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <span>📱 {e.phone || 'N/A'}</span>
                          <span>💰 ₹{(e.salary || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {tab === 'attendance' && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(10,25,41,0.5)' }}>
              {['Employee', 'Date', 'Check In', 'Check Out', 'Status', 'OT (hrs)'].map(h => <th key={h} className="text-left px-4 py-3 text-navy-400 font-medium text-xs uppercase">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {attendance.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-navy-500">No attendance records</td></tr> :
                attendance.map(a => (
                  <tr key={a.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white">{a.employee?.firstName} {a.employee?.lastName}</td>
                    <td className="px-4 py-3 text-navy-300">{new Date(a.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-navy-300">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-4 py-3 text-navy-300">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg text-xs font-medium" style={{ background: a.status === 'PRESENT' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: a.status === 'PRESENT' ? '#4ade80' : '#f87171' }}>{a.status}</span></td>
                    <td className="px-4 py-3 text-navy-300">{a.overtime || 0}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'leaves' && (
        <div className="space-y-3">
          {leaves.length === 0 ? <p className="text-navy-500 text-center py-8">No leave requests</p> :
            leaves.map(l => (
              <div key={l.id} className="rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="text-white font-medium">{l.employee?.firstName} {l.employee?.lastName} <span className="text-navy-500 text-xs">({l.employee?.employeeCode})</span></p>
                  <p className="text-navy-400 text-sm">{l.leaveType} • {l.days} day(s) • {new Date(l.startDate).toLocaleDateString('en-IN')} to {new Date(l.endDate).toLocaleDateString('en-IN')}</p>
                  {l.reason && <p className="text-navy-500 text-xs mt-1">"{l.reason}"</p>}
                </div>
                <div className="flex items-center gap-2">
                  {l.status === 'PENDING' ? <>
                    <button onClick={() => approveLeave(l.id, 'APPROVED')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: 'rgba(34,197,94,0.3)' }}>Approve</button>
                    <button onClick={() => approveLeave(l.id, 'REJECTED')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: 'rgba(239,68,68,0.3)' }}>Reject</button>
                  </> : <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: l.status === 'APPROVED' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: l.status === 'APPROVED' ? '#4ade80' : '#f87171' }}>{l.status}</span>}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl p-6 border my-4" style={{ background: '#102a43', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Add Employee</h2>
              <button onClick={() => setShowForm(false)} className="text-navy-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[{ label: 'First Name', key: 'firstName', required: true }, { label: 'Last Name', key: 'lastName', required: true }].map(f => (
                  <div key={f.key}><label className="block text-sm text-navy-300 mb-1">{f.label}</label>
                    <input type="text" value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={f.required}
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} /></div>
                ))}
              </div>
              {[{ label: 'Email', key: 'email', type: 'email' }, { label: 'Phone', key: 'phone' }, { label: 'Department', key: 'department' }, { label: 'Designation', key: 'designation' }, { label: 'Monthly Salary (₹)', key: 'salary', type: 'number' }].map(f => (
                <div key={f.key}><label className="block text-sm text-navy-300 mb-1">{f.label}</label>
                  <input type={f.type || 'text'} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} /></div>
              ))}
              <div><label className="block text-sm text-navy-300 mb-1">Employee Type</label>
                <select value={form.employeeType} onChange={e => setForm({ ...form, employeeType: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {Object.keys(typeColors).map(t => <option key={t} value={t}>{t}</option>)}
                </select></div>
              <button type="submit" className="w-full py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>Add Employee</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
