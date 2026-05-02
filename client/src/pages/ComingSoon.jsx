import { Construction } from 'lucide-react';

export default function ComingSoon({ title = 'Module', description = 'This module is under development.' }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(245,158,11,0.1)' }}>
        <Construction size={28} className="text-amber-500" />
      </div>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="text-navy-400 mt-2 max-w-md">{description}</p>
      <div className="mt-6 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
        Coming Soon
      </div>
    </div>
  );
}
