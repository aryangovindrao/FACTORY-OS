import { useState, useEffect } from 'react';
import api from '../api';
import { IndianRupee, Download, ChevronDown, ChevronUp, X } from 'lucide-react';

export default function PayrollPage() {
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [payslip, setPayslip] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/payroll');
        setEmployees(data.data);
        setSummary(data.summary);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const viewPayslip = async (id) => {
    try {
      const { data } = await api.get(`/payroll/payslip/${id}`);
      setPayslip(data.data);
    } catch (err) { console.error(err); }
  };

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Payroll & Salary</h1>
        <p className="text-navy-400 text-sm mt-1">Monthly payroll with PF, ESIC, PT & TDS computation</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: summary.totalEmployees || 0, color: '#60a5fa' },
          { label: 'Gross Payroll', value: fmt(summary.totalGross), color: '#f59e0b' },
          { label: 'Total Deductions', value: fmt(summary.totalDeductions), color: '#f87171' },
          { label: 'Net Payable', value: fmt(summary.totalNet), color: '#4ade80' },
        ].map(c => (
          <div key={c.label} className="rounded-2xl p-4 border" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-navy-400 text-xs font-medium">{c.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Employee Payroll Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(10,25,41,0.5)' }}>
              {['', 'Employee', 'Dept', 'Type', 'Gross', 'PF', 'ESIC', 'PT', 'TDS', 'Deductions', 'Net Pay', ''].map((h, i) =>
                <th key={i} className="text-left px-3 py-3 text-navy-400 font-medium text-xs uppercase whitespace-nowrap">{h}</th>
              )}
            </tr></thead>
            <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {loading ? <tr><td colSpan={12} className="text-center py-12 text-navy-500">Loading payroll data...</td></tr> :
                employees.map(e => (
                  <>
                    <tr key={e.id} className="hover:bg-white/[0.02]">
                      <td className="px-3 py-3">
                        <button onClick={() => setExpanded(expanded === e.id ? null : e.id)} className="text-navy-400 hover:text-white">
                          {expanded === e.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-white font-medium">{e.firstName} {e.lastName}</p>
                        <p className="text-navy-500 text-xs">{e.employeeCode}</p>
                      </td>
                      <td className="px-3 py-3 text-navy-300 text-xs">{e.department}</td>
                      <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-lg text-[10px] font-medium" style={{ background: e.employeeType === 'PERMANENT' ? 'rgba(34,197,94,0.15)' : 'rgba(250,204,21,0.15)', color: e.employeeType === 'PERMANENT' ? '#4ade80' : '#fbbf24' }}>{e.employeeType}</span></td>
                      <td className="px-3 py-3 text-white font-medium">{fmt(e.grossSalary)}</td>
                      <td className="px-3 py-3 text-red-400 text-xs">{fmt(e.deductions.pf)}</td>
                      <td className="px-3 py-3 text-red-400 text-xs">{fmt(e.deductions.esic)}</td>
                      <td className="px-3 py-3 text-red-400 text-xs">{fmt(e.deductions.pt)}</td>
                      <td className="px-3 py-3 text-red-400 text-xs">{fmt(e.deductions.tds)}</td>
                      <td className="px-3 py-3 text-red-400 font-medium">{fmt(e.totalDeductions)}</td>
                      <td className="px-3 py-3 text-green-400 font-bold">{fmt(e.netSalary)}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => viewPayslip(e.id)} className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1"><Download size={12} /> Payslip</button>
                      </td>
                    </tr>
                    {expanded === e.id && (
                      <tr key={`${e.id}-detail`}><td colSpan={12} className="px-6 py-4" style={{ background: 'rgba(10,25,41,0.3)' }}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div><p className="text-navy-500 mb-1">Earnings Breakdown</p>
                            <p className="text-navy-300">Basic: {fmt(e.components.basic)}</p>
                            <p className="text-navy-300">HRA: {fmt(e.components.hra)}</p>
                            <p className="text-navy-300">DA: {fmt(e.components.da)}</p>
                            <p className="text-navy-300">Special: {fmt(e.components.special)}</p>
                          </div>
                          <div><p className="text-navy-500 mb-1">Employer Contributions</p>
                            <p className="text-navy-300">PF (Employer): {fmt(e.employerContrib.pf)}</p>
                            <p className="text-navy-300">ESIC (Employer): {fmt(e.employerContrib.esic)}</p>
                          </div>
                          <div><p className="text-navy-500 mb-1">CTC (Monthly)</p>
                            <p className="text-white font-bold">{fmt(e.grossSalary + e.employerContrib.pf + e.employerContrib.esic)}</p>
                          </div>
                        </div>
                      </td></tr>
                    )}
                  </>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Modal */}
      {payslip && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl p-6 border my-4" style={{ background: '#102a43', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="text-white font-bold text-lg">Payslip — {payslip.month}</h2><p className="text-navy-400 text-sm">{payslip.employee.firstName} {payslip.employee.lastName} ({payslip.employee.employeeCode})</p></div>
              <button onClick={() => setPayslip(null)} className="text-navy-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div><p className="text-navy-400 text-xs font-medium uppercase mb-2">Earnings</p>
                {payslip.earnings.map(e => <div key={e.label} className="flex justify-between py-1 text-sm"><span className="text-navy-300">{e.label}</span><span className="text-white">{fmt(e.amount)}</span></div>)}
                <div className="flex justify-between py-2 mt-1 font-bold text-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}><span className="text-white">Gross Salary</span><span className="text-amber-400">{fmt(payslip.grossSalary)}</span></div>
              </div>
              <div><p className="text-navy-400 text-xs font-medium uppercase mb-2">Deductions</p>
                {payslip.deductions.map(d => <div key={d.label} className="flex justify-between py-1 text-sm"><span className="text-navy-300">{d.label}</span><span className="text-red-400">{fmt(d.amount)}</span></div>)}
                <div className="flex justify-between py-2 mt-1 font-bold text-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}><span className="text-white">Total Deductions</span><span className="text-red-400">{fmt(payslip.totalDeductions)}</span></div>
              </div>
              <div className="flex justify-between p-3 rounded-xl font-bold" style={{ background: 'rgba(34,197,94,0.1)' }}><span className="text-white">Net Payable</span><span className="text-green-400 text-lg">{fmt(payslip.netSalary)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
