import { ReactNode } from 'react';

interface CardProps {
  title: string;
  symbol?: string;
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function Card({ title, symbol, children, delay = 0, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-2xl overflow-hidden animate-fade-in-up ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div 
        className="px-6 py-4 flex items-center gap-3"
        style={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        {symbol && (
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
            }}
          >
            {symbol}
          </div>
        )}
        <h3 className="font-bold text-white font-[family-name:var(--font-display)]">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
