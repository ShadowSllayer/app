import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import { 
  Target, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Zap,
  Award,
  Activity,
  CheckCircle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [radarData, setRadarData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksResponse, radarResponse] = await Promise.all([
        axios.get(`${API}/tasks`),
        axios.get(`${API}/stats/radar`)
      ]);
      
      setTasks(tasksResponse.data);
      setRadarData(radarResponse.data);
      await refreshUser();
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId) => {
    try {
      await axios.post(`${API}/tasks/${taskId}/complete`);
      await fetchDashboardData(); // Refresh all data
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert(error.response?.data?.detail || 'Failed to complete task');
    }
  };

  const getTasksToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.completion_dates) return false;
      return task.completion_dates.some(date => 
        new Date(date).toISOString().split('T')[0] === today
      );
    });
  };

  const getTasksByCategory = () => {
    const categories = {
      'Intelligence': [],
      'Physical': [],
      'Social': [],
      'Discipline': [],
      'Determination': []
    };
    
    tasks.forEach(task => {
      if (categories[task.category]) {
        categories[task.category].push(task);
      }
    });
    
    return categories;
  };

  const getCategoryProgress = () => {
    const tasksToday = getTasksToday();
    const completedCategories = new Set(tasksToday.map(task => task.category));
    return Array.from(completedCategories);
  };

  const getNextLeagueInfo = () => {
    const streakRequirements = {
      'Normal': { next: 'Novice', required: 25 },
      'Novice': { next: 'Advanced', required: 50 },
      'Advanced': { next: 'Master', required: 100 },
      'Master': { next: 'Legendary', required: 250 },
      'Legendary': { next: 'Discipline-Star', required: 500 },
      'Discipline-Star': { next: 'World Champion', required: 1000 }
    };
    
    return streakRequirements[user?.league] || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  const tasksByCategory = getTasksByCategory();
  const completedToday = getCategoryProgress();
  const nextLeague = getNextLeagueInfo();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Section */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.username}! 👋
            </h1>
            <p className="text-slate-400">
              {completedToday.length === 5 
                ? "Amazing! You've completed all categories today!" 
                : `Complete ${5 - completedToday.length} more categories to maintain your streak`
              }
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-orange-400" />
              <span className="text-2xl font-bold text-orange-400">{user?.current_streak}</span>
            </div>
            <p className="text-slate-400 text-sm">Day Streak</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-800/50 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(completedToday.length / 5) * 100}%` }}
          ></div>
        </div>
        <p className="text-slate-400 text-sm">
          {completedToday.length}/5 categories completed today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-white">
              {radarData?.overall_score || '0.0'}
            </span>
          </div>
          <p className="text-slate-400">Overall Score</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">{tasks.length}</span>
          </div>
          <p className="text-slate-400">Active Tasks</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">{user?.badges?.length || 0}</span>
          </div>
          <p className="text-slate-400">Badges Earned</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold text-white">{user?.best_streak || 0}</span>
          </div>
          <p className="text-slate-400">Best Streak</p>
        </div>
      </div>

      {/* League Progress */}
      {nextLeague && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">League Progress</h3>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Current:</span>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
                {user?.league}
              </span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Next: {nextLeague.next}</span>
              <span className="text-white">{user?.current_streak}/{nextLeague.required} days</span>
            </div>
            <div className="bg-slate-800/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((user?.current_streak / nextLeague.required) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <p className="text-slate-400 text-sm">
            {nextLeague.required - user?.current_streak} more days to reach {nextLeague.next}
          </p>
        </div>
      )}

      {/* Today's Tasks by Category */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Calendar className="w-6 h-6 mr-2" />
          Today's Tasks
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(tasksByCategory).map(([category, categoryTasks]) => {
            const isCompleted = completedToday.includes(category);
            const todayTasks = categoryTasks.filter(task => {
              const today = new Date().toISOString().split('T')[0];
              return !task.completion_dates?.some(date => 
                new Date(date).toISOString().split('T')[0] === today
              );
            });

            return (
              <div key={category} className={`card ${isCompleted ? 'border-green-500/30 bg-green-500/5' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{category}</h3>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Activity className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                
                {todayTasks.length === 0 ? (
                  <p className="text-slate-400 text-sm italic">
                    {isCompleted ? 'All tasks completed for today! 🎉' : 'No tasks available'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {todayTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                        <div>
                          <p className="text-white font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-slate-400 text-sm">{task.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => completeTask(task.id)}
                          className="btn-success px-4 py-2 text-sm"
                        >
                          Complete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;