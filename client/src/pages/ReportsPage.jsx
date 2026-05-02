import { useState, useEffect } from 'react';
import api from '../api';
import { BarChart3, TrendingUp, Package, Users, Wrench, Truck, Factory, Gauge } from 'lucide-react';

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="rounded-2xl p-4 border" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
    <div className="flex items-center justify-between mb-2">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>
    <p className="text-xl font-bold text-white">{value}</p>
    <p className="text-navy-400 text-xs mt-0.5">{label}</p>
    {sub && <p className="text-navy-500 text-[10px] mt-1">{sub}</p>}
  </div>
);

const BarSimple = ({ label, value, max, color }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs mb-1"><span className="text-navy-300">{label}</span><span className="text-white font-medium">{value}%</span></div>
    <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
    </div>
  </div>
);

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/reports');
        setData(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>;
  if (!data) return <p className="text-navy-500 text-center py-20">Failed to load reports</p>;

  const { production, oee, inventory, employees, vendors, maintenance, dispatch, machines } = data;
  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Planning & MIS Reports</h1><p className="text-navy-400 text-sm mt-1">Factory-wide performance analytics</p></div>

      {/* OEE Gauge */}
      <div className="rounded-2xl p-6 border" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-4"><Gauge size={18} className="text-amber-400" /><h2 className="text-white font-bold">Overall Equipment Effectiveness (OEE)</h2></div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={oee.overall >= 70 ? '#4ade80' : oee.overall >= 40 ? '#fbbf24' : '#f87171'} strokeWidth="8" strokeDasharray={`${oee.overall * 2.64} 264`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">{oee.overall}%</span>
            </div>
            <p className="text-navy-400 text-xs mt-2">OEE Score</p>
          </div>
          <div><BarSimple label="Availability" value={oee.availability} color="#60a5fa" /><BarSimple label="Performance" value={oee.performance} color="#fbbf24" /><BarSimple label="Quality" value={oee.quality} color="#4ade80" /></div>
          <div className="sm:col-span-2 grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: 'rgba(10,25,41,0.5)' }}><p className="text-navy-500 text-xs">Work Orders</p><p className="text-white font-bold text-lg">{production.totalWorkOrders}</p><p className="text-green-400 text-xs">{production.completedWO} completed</p></div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(10,25,41,0.5)' }}><p className="text-navy-500 text-xs">Fulfillment</p><p className="text-white font-bold text-lg">{production.fulfillmentRate}%</p><p className="text-navy-400 text-xs">{production.totalCompleted}/{production.totalTarget}</p></div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(10,25,41,0.5)' }}><p className="text-navy-500 text-xs">Machines Running</p><p className="text-white font-bold text-lg">{machines.running}/{machines.total}</p></div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(10,25,41,0.5)' }}><p className="text-navy-500 text-xs">Rejected</p><p className="text-red-400 font-bold text-lg">{production.totalRejected}</p></div>
          </div>
        </div>
      </div>

      {/* Module KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Inventory Items" value={inventory.totalItems} sub={`Value: ${fmt(inventory.totalValue)}`} icon={Package} color="#a78bfa" />
        <StatCard label="Low Stock Items" value={inventory.lowStockItems} icon={Package} color="#f87171" />
        <StatCard label="Employees" value={employees.total} sub={`Payroll: ${fmt(employees.totalMonthlySalary)}`} icon={Users} color="#60a5fa" />
        <StatCard label="Open Tickets" value={maintenance.open} sub={`${maintenance.resolved} resolved`} icon={Wrench} color="#fb923c" />
        <StatCard label="Vendors" value={vendors.total} icon={Factory} color="#34d399" />
        <StatCard label="Dispatches" value={dispatch.total} sub={`${dispatch.delivered} delivered`} icon={Truck} color="#fbbf24" />
      </div>

      {/* Department Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 border" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Users size={16} className="text-blue-400" /> Workforce by Department</h3>
          {Object.entries(employees.deptDistribution || {}).sort((a, b) => b[1] - a[1]).map(([dept, count]) => {
            const pct = Math.round((count / employees.total) * 100);
            return <BarSimple key={dept} label={dept} value={pct} color="#60a5fa" />;
          })}
        </div>
        <div className="rounded-2xl p-5 border" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-amber-400" /> Work Order Status</h3>
          {Object.entries(production.woStatusDist || {}).map(([status, count]) => {
            const pct = Math.round((count / production.totalWorkOrders) * 100);
            const colors = { DRAFT: '#94a3b8', SCHEDULED: '#60a5fa', IN_PROGRESS: '#fbbf24', COMPLETED: '#4ade80', ON_HOLD: '#fb923c', CANCELLED: '#f87171' };
            return <BarSimple key={status} label={status.replace('_', ' ')} value={pct} color={colors[status] || '#94a3b8'} />;
          })}
        </div>
      </div>
    </div>
  );
}
