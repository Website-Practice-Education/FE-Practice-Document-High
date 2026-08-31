import { useTheme } from '../contexts/ThemeContext';
import NavIcon from './icons/NavIcon';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-11 h-11 rounded-xl flex items-center justify-center
        transition-all duration-300 group
        ${theme === 'dark' 
          ? 'bg-white/10 hover:bg-white/15 text-yellow-300 hover:text-yellow-200' 
          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800'
        }
      `}
      title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Glow effect */}
      <div 
        className={`
          absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 
          transition-opacity duration-300
          ${theme === 'dark' ? 'bg-yellow-400/10' : 'bg-indigo-500/10'}
        `}
      />
      
      {/* Icon */}
      <div className="relative transition-transform duration-300 group-hover:scale-110">
        {theme === 'dark' ? (
          <NavIcon name="sun" size={18} />
        ) : (
          <NavIcon name="moon" size={18} />
        )}
      </div>
      
      {/* Tooltip */}
      <div 
        className={`
          absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs font-medium
          whitespace-nowrap opacity-0 group-hover:opacity-100 
          transition-all duration-200 pointer-events-none
          ${theme === 'dark' 
            ? 'bg-white/10 text-white' 
            : 'bg-slate-800 text-white'
          }
        `}
        style={{ backdropFilter: 'blur(8px)' }}
      >
        {theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
      </div>
    </button>
  );
}
