import { Achievement } from '../services/achievementService';
import achievementService from '../services/achievementService';

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
}

export default function AchievementCard({ achievement, isUnlocked }: AchievementCardProps) {
  // Get icon from achievement or use default icons map
  const displayIcon = achievement.icon || achievementService.getAchievementIcon(achievement.code);

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary':
        return {
          bg: 'from-yellow-500/20 to-orange-500/20',
          border: 'border-yellow-500/40',
          glow: '0 0 20px rgba(251, 191, 36, 0.4)',
          icon: 'text-yellow-400',
        };
      case 'epic':
        return {
          bg: 'from-purple-500/20 to-pink-500/20',
          border: 'border-purple-500/40',
          glow: '0 0 20px rgba(168, 85, 247, 0.4)',
          icon: 'text-purple-400',
        };
      case 'rare':
        return {
          bg: 'from-blue-500/20 to-cyan-500/20',
          border: 'border-blue-500/40',
          glow: '0 0 20px rgba(59, 130, 246, 0.4)',
          icon: 'text-blue-400',
        };
      default:
        return {
          bg: 'from-slate-500/20 to-slate-600/20',
          border: 'border-slate-500/40',
          glow: 'none',
          icon: 'text-slate-400',
        };
    }
  };

  const rarityStyle = getRarityColor(achievement.rarity);

  return (
    <div
      className={`relative p-5 rounded-2xl transition-all duration-300 ${
        isUnlocked ? 'cursor-pointer hover:scale-105' : 'opacity-60'
      }`}
      style={{
        background: `linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(22, 33, 62, 0.9))`,
        border: `1px solid ${isUnlocked ? rarityStyle.border : 'rgba(255, 255, 255, 0.08)'}`,
        boxShadow: isUnlocked ? rarityStyle.glow : '0 4px 16px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Lock overlay for locked achievements */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30">
          <span className="text-3xl">🔒</span>
        </div>
      )}

      {/* Icon */}
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4 ${
          isUnlocked ? '' : 'grayscale'
        }`}
        style={{
          background: `linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))`,
        }}
      >
        {displayIcon}
      </div>

      {/* Title */}
      <h4 className="text-base font-bold text-white mb-1">{achievement.name}</h4>
      
      {/* Description */}
      <p className="text-sm text-slate-400 mb-3">{achievement.description}</p>

      {/* XP Reward */}
      {isUnlocked && (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-yellow-500/20 text-yellow-400">
            +{achievement.xpReward} XP
          </span>
        </div>
      )}

      {/* Progress for locked achievements */}
      {!isUnlocked && achievement.criteria && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Progress</span>
            <span>{achievement.criteria}</span>
          </div>
        </div>
      )}
    </div>
  );
}
