import React, { useContext } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  Trophy, 
  Heart, 
  Award,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Tasks', href: '/tasks', icon: Target },
    { name: 'Progress', href: '/progress', icon: TrendingUp },
    { name: 'Motivation', href: '/motivation', icon: Heart },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Badges', href: '/badges', icon: Award },
  ];

  const getLeagueBadgeClass = (league) => {
    const classes = {
      'Normal': 'badge-normal',
      'Novice': 'badge-novice',
      'Advanced': 'badge-advanced',
      'Master': 'badge-master',
      'Legendary': 'badge-legendary',
      'Discipline-Star': 'badge-discipline-star'
    };
    return classes[league] || classes['Normal'];
  };

  const getTrophyEmoji = (league) => {
    const trophies = {
      'Normal': '⚪',
      'Novice': '🥉',
      'Advanced': '🥈',
      'Master': '🥇',
      'Legendary': '💎',
      'Discipline-Star': '⚫'
    };
    return trophies[league] || trophies['Normal'];
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Growth Tracker</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">{user?.username}</p>
                <p className="text-slate-400 text-sm">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getLeagueBadgeClass(user?.league)}`}>
                {getTrophyEmoji(user?.league)} {user?.league}
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs">Streak</p>
                <p className="text-orange-400 font-bold">{user?.current_streak} days</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-slate-700/50">
            <button
              onClick={logout}
              className="flex items-center space-x-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Top Bar */}
        <header className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="hidden lg:block">
              <h2 className="text-2xl font-bold text-white capitalize">
                {location.pathname.replace('/', '') || 'dashboard'}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-slate-400 text-sm">Overall Score</p>
                <p className="text-blue-400 font-bold text-lg">
                  {user?.total_points ? 
                    (Object.values(user.total_points).reduce((sum, points) => sum + points, 0) / 5).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;