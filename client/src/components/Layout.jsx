import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a1929' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 pt-16 lg:pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
