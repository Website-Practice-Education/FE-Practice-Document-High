import achievementService, { Achievement } from '../services/achievementService';

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked?: boolean;
  onClick?: () => void;
}

export default function AchievementCard({ achievement, isUnlocked = false, onClick }: AchievementCardProps) {
  const icon = achievementService.getAchievementIcon(achievement.code);
  const rarity = achievementService.getAchievementRarity(achievement);

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl p-5 cursor-pointer transition-all duration-300 animate-fade-in-up ${
        isUnlocked 
          ? 'opacity-100' 
          : 'opacity-50 grayscale hover:opacity-70 hover:grayscale-0'
      }`}
      style={{
        background: isUnlocked 
          ? 'linear-gradient(145deg, #1a1a2e, #16213e)' 
          : 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${isUnlocked ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
        boxShadow: isUnlocked 
          ? '0 8px 32px rgba(99, 102, 241, 0.2)' 
          : '0 4px 16px rgba(0, 0, 0, 0.2)',
      }}
      onMouseEnter={(e) => {
        if (isUnlocked) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 16px 40px rgba(99, 102, 241, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isUnlocked 
          ? '0 8px 32px rgba(99, 102, 241, 0.2)' 
          : '0 4px 16px rgba(0, 0, 0, 0.2)';
      }}
    >
      {/* Lock overlay for unearned */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl"
          style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        >
          <span className="text-2xl opacity-50">🔒</span>
        </div>
      )}

      {/* Icon */}
      <div className="flex items-start gap-4">
        <div 
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
            isUnlocked ? '' : 'grayscale opacity-50'
          }`}
          style={{
            background: isUnlocked
              ? `linear-gradient(135deg, ${rarity.bgColor.includes('yellow') ? '#f59e0b' : rarity.bgColor.includes('purple') ? '#a855f7' : rarity.bgColor.includes('blue') ? '#3b82f6' : '#64748b'}, ${rarity.bgColor.includes('yellow') ? '#d97706' : rarity.bgColor.includes('purple') ? '#9333ea' : rarity.bgColor.includes('blue') ? '#2563eb' : '#475569'})`
              : 'rgba(100, 116, 139, 0.2)',
            boxShadow: isUnlocked ? `0 8px 24px ${rarity.bgColor.includes('yellow') ? 'rgba(245, 158, 11, 0.4)' : rarity.bgColor.includes('purple') ? 'rgba(168, 85, 247, 0.4)' : rarity.bgColor.includes('blue') ? 'rgba(59, 130, 246, 0.4)' : 'rgba(100, 116, 139, 0.3)'}` : 'none',
          }}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-white truncate">{achievement.name}</h4>
            {achievement.xpReward > 0 && (
              <span className={`text-xs font-semibold ${rarity.color}`}>
                +{achievement.xpReward} XP
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 line-clamp-2">{achievement.description}</p>
          
          {/* Rarity Badge */}
          <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium border ${rarity.bgColor} ${rarity.color}`}>
            {rarity.label}
          </span>
        </div>
      </div>

      {/* Unlocked date */}
      {isUnlocked && achievement.achievedAt && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <p className="text-xs text-slate-500">
            Duoc khai pha: {new Date(achievement.achievedAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
      )}
    </div>
  );
}
