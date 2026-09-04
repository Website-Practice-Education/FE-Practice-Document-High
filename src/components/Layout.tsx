import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const location = useLocation();

  return (
    <div 
      className="flex min-h-screen relative overflow-x-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      }}
    >
      {/* Animated gradient orbs */}
      <div 
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
      >
        {/* Primary orb - top left */}
        <div 
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ 
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
          }}
        />
        
        {/* Secondary orb - bottom right */}
        <div 
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ 
            background: 'radial-gradient(circle, rgba(167, 139, 250, 0.4) 0%, transparent 70%)',
          }}
        />
        
        {/* Tertiary orb - center */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
          style={{ 
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
          }}
        />
      </div>
      
      <Sidebar />
      
      <main 
        className="flex-1 p-8 overflow-y-auto overflow-x-hidden relative z-10"
        style={{
          background: 'transparent',
        }}
      >
        <div key={location.pathname} className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
