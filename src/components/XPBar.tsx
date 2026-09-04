import xpService from '../services/xpService';

interface XPBarProps {
  totalXP: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function XPBar({ totalXP, showDetails = true, size = 'md' }: XPBarProps) {
  const levelInfo = xpService.getLevelProgress(totalXP);
  const levelColor = xpService.getLevelColor(levelInfo.level);
  const levelTitle = xpService.getLevelTitle(levelInfo.level);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const iconSizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <div className="space-y-2">
      {/* Level Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Level Badge */}
          <div 
            className={`${iconSizes[size]} rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}
            style={{
              background: `linear-gradient(135deg, #6366f1, #a855f7)`,
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
            }}
          >
            {levelInfo.level}
          </div>
          
          <div>
            <p className="text-sm font-semibold text-white">
              Level {levelInfo.level} - {levelTitle}
            </p>
            {showDetails && (
              <p className="text-xs text-slate-400">
                {xpService.formatXP(levelInfo.currentLevelXP)} / {xpService.formatXP(levelInfo.nextLevelXP)} XP
              </p>
            )}
          </div>
        </div>

        {/* Total XP */}
        <div className="text-right">
          <p className={`text-sm font-bold bg-gradient-to-r ${levelColor} bg-clip-text text-transparent`}>
            {xpService.formatXP(totalXP)} XP
          </p>
          <p className="text-xs text-slate-500">Tong cong</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={`w-full rounded-full overflow-hidden ${sizeClasses[size]}`}
        style={{ background: 'rgba(255, 255, 255, 0.1)' }}
      >
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
          style={{
            width: `${levelInfo.progressPercent}%`,
            background: `linear-gradient(90deg, #6366f1, #a855f7, #ec4899)`,
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.5)',
          }}
        >
          {/* Shimmer effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{
              animation: 'shimmer 2s linear infinite',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>
    </div>
  );
}
