import React, { useContext } from 'react';
import { AuthContext } from '../App';
import { 
  Award, 
  Trophy, 
  Star, 
  Target,
  Zap,
  Crown,
  Medal,
  Shield,
  Gem,
  Clock,
  TrendingUp,
  Flame,
  CheckCircle
} from 'lucide-react';

const BadgeCollection = () => {
  const { user } = useContext(AuthContext);

  // Define all available badges
  const allBadges = [
    // Streak Badges
    {
      id: 'beginner',
      name: 'Beginner',
      description: 'Complete tasks in all categories for 3 consecutive days',
      icon: Target,
      color: 'text-green-400 bg-green-400/20',
      requirement: '3 day streak',
      category: 'Streaks',
      earned: user?.badges?.includes('Beginner') || false
    },
    {
      id: 'disciplined',
      name: 'Disciplined',
      description: 'Maintain your streak for a full week',
      icon: Shield,
      color: 'text-blue-400 bg-blue-400/20',
      requirement: '7 day streak',
      category: 'Streaks',
      earned: user?.badges?.includes('Disciplined') || false
    },
    {
      id: 'master',
      name: 'Master',
      description: 'Achieve the legendary 30-day streak',
      icon: Crown,
      color: 'text-purple-400 bg-purple-400/20',
      requirement: '30 day streak',
      category: 'Streaks',
      earned: user?.badges?.includes('Master') || false
    },

    // League Badges (Trophies)
    {
      id: 'bronze-trophy',
      name: 'Bronze Trophy',
      description: 'Promoted to Novice league',
      icon: Medal,
      color: 'text-orange-600 bg-orange-600/20',
      requirement: 'Novice League',
      category: 'Trophies',
      earned: user?.badges?.includes('Bronze Trophy') || false
    },
    {
      id: 'silver-trophy',
      name: 'Silver Trophy',
      description: 'Promoted to Advanced league',
      icon: Medal,
      color: 'text-gray-400 bg-gray-400/20',
      requirement: 'Advanced League',
      category: 'Trophies',
      earned: user?.badges?.includes('Silver Trophy') || false
    },
    {
      id: 'golden-trophy',
      name: 'Golden Trophy',
      description: 'Promoted to Master league',
      icon: Trophy,
      color: 'text-yellow-400 bg-yellow-400/20',
      requirement: 'Master League',
      category: 'Trophies',
      earned: user?.badges?.includes('Golden Trophy') || false
    },
    {
      id: 'diamond-trophy',
      name: 'Diamond Trophy',
      description: 'Promoted to Legendary league',
      icon: Gem,
      color: 'text-cyan-400 bg-cyan-400/20',
      requirement: 'Legendary League',
      category: 'Trophies',
      earned: user?.badges?.includes('Diamond Trophy') || false
    },
    {
      id: 'black-trophy',
      name: 'Black Trophy',
      description: 'Achieved Discipline-Star league',
      icon: Award,
      color: 'text-slate-900 bg-slate-900/40 border border-slate-600',
      requirement: 'Discipline-Star League',
      category: 'Trophies',
      earned: user?.badges?.includes('Black Trophy') || false
    },

    // Special Achievement Badges
    {
      id: 'first-week',
      name: 'First Week Warrior',
      description: 'Completed your first week of consistent growth',
      icon: Clock,
      color: 'text-emerald-400 bg-emerald-400/20',
      requirement: 'First 7 days',
      category: 'Milestones',
      earned: (user?.best_streak || 0) >= 7
    },
    {
      id: 'month-master',
      name: 'Month Master',
      description: 'Maintained consistency for an entire month',
      icon: Star,
      color: 'text-indigo-400 bg-indigo-400/20',
      requirement: '30 days total',
      category: 'Milestones',
      earned: (user?.best_streak || 0) >= 30
    },
    {
      id: 'century-club',
      name: 'Century Club',
      description: 'The elite 100-day streak achievement',
      icon: Flame,
      color: 'text-red-400 bg-red-400/20',
      requirement: '100 day streak',
      category: 'Elite',
      earned: (user?.best_streak || 0) >= 100
    },
    {
      id: 'unstoppable',
      name: 'Unstoppable Force',
      description: 'Incredible 250-day dedication',
      icon: TrendingUp,
      color: 'text-pink-400 bg-pink-400/20',
      requirement: '250 day streak',
      category: 'Elite',
      earned: (user?.best_streak || 0) >= 250
    },
    {
      id: 'legend',
      name: 'Living Legend',
      description: 'The ultimate 500-day achievement',
      icon: Crown,
      color: 'text-yellow-500 bg-yellow-500/20 border border-yellow-500/50',
      requirement: '500 day streak',
      category: 'Elite',
      earned: (user?.best_streak || 0) >= 500
    },

    // Category-specific badges
    {
      id: 'well-rounded',
      name: 'Well Rounded',
      description: 'Balanced growth across all categories',
      icon: CheckCircle,
      color: 'text-teal-400 bg-teal-400/20',
      requirement: 'Balanced scores',
      category: 'Special',
      earned: user?.total_points ? Math.min(...Object.values(user.total_points)) >= 10 : false
    },
    {
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'Never missed a day in the current streak',
      icon: Zap,
      color: 'text-yellow-400 bg-yellow-400/20',
      requirement: 'Perfect streak',
      category: 'Special',
      earned: (user?.current_streak || 0) >= 14 && (user?.current_streak === user?.best_streak)
    }
  ];

  // Group badges by category
  const badgeCategories = allBadges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {});

  const earnedBadges = allBadges.filter(badge => badge.earned);
  const totalBadges = allBadges.length;
  const completionPercentage = Math.round((earnedBadges.length / totalBadges) * 100);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Award className="w-8 h-8 text-purple-400" />
        <h1 className="text-3xl font-bold text-white">Badge Collection</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{earnedBadges.length}</div>
          <div className="text-slate-400">Badges Earned</div>
        </div>
        
        <div className="card text-center">
          <Target className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{completionPercentage}%</div>
          <div className="text-slate-400">Collection Complete</div>
        </div>
        
        <div className="card text-center">
          <Flame className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{user?.current_streak || 0}</div>
          <div className="text-slate-400">Current Streak</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Collection Progress</h3>
          <span className="text-slate-400 text-sm">{earnedBadges.length}/{totalBadges}</span>
        </div>
        <div className="bg-slate-700/50 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <p className="text-slate-400 text-sm">
          Keep building your streak to unlock more badges!
        </p>
      </div>

      {/* Badge Categories */}
      {Object.entries(badgeCategories).map(([category, badges]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            {category === 'Streaks' && <Zap className="w-6 h-6 mr-2 text-yellow-400" />}
            {category === 'Trophies' && <Trophy className="w-6 h-6 mr-2 text-yellow-400" />}
            {category === 'Milestones' && <Star className="w-6 h-6 mr-2 text-blue-400" />}
            {category === 'Elite' && <Crown className="w-6 h-6 mr-2 text-purple-400" />}
            {category === 'Special' && <Gem className="w-6 h-6 mr-2 text-pink-400" />}
            {category}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {badges.map((badge) => {
              const IconComponent = badge.icon;
              
              return (
                <div
                  key={badge.id}
                  className={`
                    card group transition-all duration-300
                    ${badge.earned 
                      ? 'border-2 border-green-500/30 bg-green-500/5 hover:border-green-500/50' 
                      : 'opacity-60 hover:opacity-80 border-2 border-slate-700/50'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className={`
                      w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center
                      ${badge.earned ? badge.color : 'text-slate-600 bg-slate-800/50'}
                      transition-all duration-300 group-hover:scale-110
                    `}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                    
                    <h3 className={`font-bold mb-2 ${badge.earned ? 'text-white' : 'text-slate-400'}`}>
                      {badge.name}
                      {badge.earned && (
                        <CheckCircle className="w-4 h-4 text-green-400 inline ml-2" />
                      )}
                    </h3>
                    
                    <p className={`text-sm mb-3 ${badge.earned ? 'text-slate-300' : 'text-slate-500'}`}>
                      {badge.description}
                    </p>
                    
                    <div className={`
                      px-3 py-1 rounded-full text-xs font-medium
                      ${badge.earned 
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                        : 'bg-slate-700/50 text-slate-400'
                      }
                    `}>
                      {badge.earned ? 'EARNED' : badge.requirement}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Next Badge to Earn */}
      <div className="card bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-purple-500/20">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Next Badge Goal
        </h3>
        
        {(() => {
          const nextBadge = allBadges.find(badge => !badge.earned);
          if (!nextBadge) {
            return (
              <div className="text-center py-6">
                <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">Collection Complete!</h4>
                <p className="text-slate-300">
                  Congratulations! You've earned all available badges. Keep maintaining your discipline!
                </p>
              </div>
            );
          }
          
          const IconComponent = nextBadge.icon;
          return (
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${nextBadge.color}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white">{nextBadge.name}</h4>
                <p className="text-slate-400 text-sm">{nextBadge.description}</p>
                <p className="text-blue-400 text-sm font-medium mt-1">{nextBadge.requirement}</p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default BadgeCollection;