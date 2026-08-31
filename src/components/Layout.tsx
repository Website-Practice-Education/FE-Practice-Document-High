import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const location = useLocation();

  return (
    <div 
      className="flex min-h-screen relative overflow-x-hidden bg-slate-900"
    >
      <Sidebar />
      <main 
        className="flex-1 p-8 overflow-y-auto overflow-x-hidden relative z-10 bg-slate-900"
      >
        <div key={location.pathname} className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
