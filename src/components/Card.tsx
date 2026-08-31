import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  className?: string;
  delay?: number;
  symbol?: string;
}

export default function Card({ title, children, className = '', delay = 0, symbol }: CardProps) {
  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden animate-fade-in-up ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards', opacity: 0 }}
    >
      <div className="px-6 py-4 border-b border-slate-100/80 flex items-center gap-3">
        {symbol && (
          <span className="stat-symbol bg-indigo-50 text-indigo-600 border border-indigo-100">
            {symbol}
          </span>
        )}
        <h3 className="text-base font-semibold text-slate-800 font-[family-name:var(--font-display)]">
          {title}
        </h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
