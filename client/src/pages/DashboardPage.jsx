import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { io } from 'socket.io-client';
import {
  Activity, Package, CheckCircle2, AlertTriangle,
  Gauge, TrendingUp, Zap, Clock
} from 'lucide-react';

const statusColors = {
  RUNNING: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', dot: '#22c55e' },
  IDLE: { bg: 'rgba(250,204,21,0.15)', text: '#facc15', dot: '#eab308' },
  MAINTENANCE: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', dot: '#3b82f6' },
  BREAKDOWN: { bg: 'rgba(239,68,68,0.15)', text: '#f87171', dot: '#ef4444' },
  OFF: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', dot: '#64748b' },
};

export default function DashboardPage() {
  const { tenant } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const { data: res } = await api.get('/dashboard/production');
      setData(res.data);
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const socket = io({ transports: ['websocket'] });
    socket.emit('join-tenant', tenant?.id);
    socket.on('workorder:created', fetchDashboard);
    socket.on('workorder:updated', fetchDashboard);
    socket.on('machine:updated', fetchDashboard);
    const interval = setInterval(fetchDashboard, 30000);
    return () => { socket.disconnect(); clearInterval(interval); };
  }, [tenant?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const { kpis = {}, machines = [], recentBatches = [], workOrdersByStatus = [], recentQc = [] } = data || {};

  const kpiCards = [
    { label: 'Active Work Orders', value: kpis.activeWorkOrders || 0, icon: Activity, color: '#f59e0b', change: '+3 today' },
    { label: 'Completed Today', value: kpis.completedToday || 0, icon: CheckCircle2, color: '#22c55e', change: 'on track' },
    { label: 'Machine Utilization', value: `${kpis.machineUtilization || 0}%`, icon: Gauge, color: '#3b82f6', change: `${kpis.runningMachines}/${kpis.totalMachines} running` },
    { label: 'Yield Rate', value: `${kpis.yieldRate || 0}%`, icon: TrendingUp, color: '#8b5cf6', change: 'production yield' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Production Dashboard</h1>
          <p className="text-navy-400 text-sm mt-1">Real-time overview • {tenant?.name}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="rounded-2xl p-5 border transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}20` }}>
                <kpi.icon size={20} style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-navy-400 text-sm mt-0.5">{kpi.label}</p>
            <p className="text-xs mt-2" style={{ color: kpi.color }}>{kpi.change}</p>
          </div>
        ))}
      </div>

      {/* Machine Status Grid */}
      <div className="rounded-2xl border p-5" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Zap size={18} className="text-amber-500" /> Machine Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {machines.map((m) => {
            const colors = statusColors[m.status] || statusColors.OFF;
            return (
              <div key={m.id} className="rounded-xl p-4 border transition-all hover:border-amber-500/30"
                style={{ background: colors.bg, borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">{m.name}</span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: colors.dot }} />
                </div>
                <p className="text-xs" style={{ color: colors.text }}>{m.status}</p>
                <p className="text-navy-500 text-xs mt-1">{m.department} • {m.code}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Batches */}
        <div className="rounded-2xl border p-5" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Package size={18} className="text-amber-500" /> Recent Batches</h2>
          <div className="space-y-2">
            {recentBatches.length === 0 ? <p className="text-navy-500 text-sm">No batches yet</p> :
              recentBatches.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(10,25,41,0.5)' }}>
                  <div>
                    <p className="text-white text-sm font-medium">{b.batchNumber}</p>
                    <p className="text-navy-500 text-xs">{b.workOrder?.productName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium" style={{ color: b.status === 'COMPLETED' ? '#4ade80' : '#fbbf24' }}>
                      {b.outputQty}/{b.inputQty}
                    </p>
                    <p className="text-navy-500 text-xs">{b.status}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* QC Inspections */}
        <div className="rounded-2xl border p-5" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><CheckCircle2 size={18} className="text-amber-500" /> QC Inspections</h2>
          <div className="space-y-2">
            {recentQc.length === 0 ? <p className="text-navy-500 text-sm">No inspections yet</p> :
              recentQc.map((qc) => (
                <div key={qc.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(10,25,41,0.5)' }}>
                  <div>
                    <p className="text-white text-sm font-medium">{qc.gateName}</p>
                    <p className="text-navy-500 text-xs">{qc.workOrder?.orderNumber}</p>
                  </div>
                  <span className="px-2 py-1 rounded-lg text-xs font-medium"
                    style={{ background: qc.result === 'PASS' ? 'rgba(34,197,94,0.15)' : qc.result === 'FAIL' ? 'rgba(239,68,68,0.15)' : 'rgba(250,204,21,0.15)',
                      color: qc.result === 'PASS' ? '#4ade80' : qc.result === 'FAIL' ? '#f87171' : '#facc15' }}>
                    {qc.result}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Work Order Status Distribution */}
      <div className="rounded-2xl border p-5" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Clock size={18} className="text-amber-500" /> Work Order Status</h2>
        <div className="flex flex-wrap gap-4">
          {workOrdersByStatus.map((s) => {
            const colors = {
              DRAFT: '#94a3b8', SCHEDULED: '#60a5fa', IN_PROGRESS: '#fbbf24',
              ON_HOLD: '#f97316', COMPLETED: '#4ade80', CANCELLED: '#f87171'
            };
            return (
              <div key={s.status} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(10,25,41,0.5)' }}>
                <span className="w-3 h-3 rounded-full" style={{ background: colors[s.status] || '#64748b' }} />
                <div>
                  <p className="text-white font-bold text-lg">{s._count.status}</p>
                  <p className="text-navy-500 text-xs">{s.status.replace('_', ' ')}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
