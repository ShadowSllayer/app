import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star,
  TrendingUp,
  Award,
  Globe,
  Filter,
  Search,
  Zap
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const languages = [
  { code: 'all', name: 'All Languages', flag: '🌍' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' }
];

const Leaderboard = () => {
  const { user } = useContext(AuthContext);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedLanguage]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedLanguage !== 'all') {
        params.language = selectedLanguage;
      }
      
      const response = await axios.get(`${API}/leaderboard`, { params });
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      // Mock data for demonstration
      setLeaderboard([
        {
          username: user?.username || 'You',
          overall_score: user ? calculateOverallScore(user.total_points) : 8.5,
          league: user?.league || 'Normal',
          current_streak: user?.current_streak || 7,
          rank: 42
        },
        {
          username: 'MotivationMaster',
          overall_score: 24.8,
          league: 'Master',
          current_streak: 127,
          rank: 1
        },
        {
          username: 'DailyGrinder',
          overall_score: 22.3,
          league: 'Advanced',
          current_streak: 89,
          rank: 2
        },
        {
          username: 'ConsistentChamp',
          overall_score: 21.1,
          league: 'Advanced',
          current_streak: 156,
          rank: 3
        },
        {
          username: 'GrowthSeeker',
          overall_score: 19.7,
          league: 'Novice',
          current_streak: 45,
          rank: 4
        },
        {
          username: 'MindfulWarrior',
          overall_score: 18.9,
          league: 'Novice',
          current_streak: 78,
          rank: 5
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallScore = (points) => {
    if (!points) return 0;
    const total = Object.values(points).reduce((sum, p) => sum + p, 0);
    return Math.round((total / 5) * 10) / 10;
  };

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

  const getTrophyIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-400" />;
    return <Trophy className="w-5 h-5 text-slate-400" />;
  };

  const getRankBadge = (rank) => {
    if (rank <= 3) {
      const colors = ['text-yellow-400 bg-yellow-400/20', 'text-gray-400 bg-gray-400/20', 'text-orange-400 bg-orange-400/20'];
      return `${colors[rank - 1]} border border-current`;
    }
    return 'text-slate-400 bg-slate-700/50';
  };

  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentUserEntry = leaderboard.find(entry => entry.username === user?.username);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Trophy className="w-8 h-8 text-yellow-400" />
        <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Language Filter
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="form-input"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search Users
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username..."
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Your Rank Card */}
      {currentUserEntry && (
        <div className="card bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadge(currentUserEntry.rank)}`}>
                #{currentUserEntry.rank}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{currentUserEntry.username} (You)</h3>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-blue-400">Score: {currentUserEntry.overall_score}</span>
                  <span className="text-orange-400 flex items-center">
                    <Zap className="w-4 h-4 mr-1" />
                    {currentUserEntry.current_streak} days
                  </span>
                </div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-white font-medium ${getLeagueBadgeClass(currentUserEntry.league)}`}>
              {currentUserEntry.league}
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredLeaderboard.slice(0, 3).map((entry, index) => (
          <div
            key={entry.username}
            className={`card-elevated text-center ${
              index === 0 ? 'md:order-2 transform md:scale-105' : 
              index === 1 ? 'md:order-1' : 'md:order-3'
            }`}
          >
            <div className="mb-4">
              <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${getRankBadge(entry.rank)}`}>
                {getTrophyIcon(entry.rank)}
              </div>
              <h3 className="text-lg font-bold text-white">{entry.username}</h3>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white mt-2 ${getLeagueBadgeClass(entry.league)}`}>
                {entry.league}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Overall Score</span>
                <span className="text-blue-400 font-semibold">{entry.overall_score}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Current Streak</span>
                <span className="text-orange-400 font-semibold">{entry.current_streak} days</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Leaderboard */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Top 100 Rankings
          </h2>
          <div className="text-slate-400 text-sm">
            Showing {Math.min(filteredLeaderboard.length, 100)} of {filteredLeaderboard.length} users
          </div>
        </div>

        <div className="space-y-3">
          {filteredLeaderboard.slice(0, 100).map((entry, index) => {
            const isCurrentUser = entry.username === user?.username;
            
            return (
              <div
                key={entry.username}
                className={`
                  flex items-center justify-between p-4 rounded-lg transition-all duration-200
                  ${isCurrentUser 
                    ? 'bg-blue-600/20 border border-blue-500/30' 
                    : 'bg-slate-800/50 hover:bg-slate-800/70'
                  }
                `}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${getRankBadge(entry.rank)}`}>
                    #{entry.rank}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-semibold ${isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
                        {entry.username}
                        {isCurrentUser && <span className="text-xs text-blue-400 ml-1">(You)</span>}
                      </h3>
                      {entry.rank <= 3 && getTrophyIcon(entry.rank)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span>Score: {entry.overall_score}</span>
                      <span className="flex items-center">
                        <Zap className="w-3 h-3 mr-1" />
                        {entry.current_streak} days
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getLeagueBadgeClass(entry.league)}`}>
                  {entry.league}
                </div>
              </div>
            );
          })}
        </div>

        {filteredLeaderboard.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
            <p className="text-slate-400">Try adjusting your search or language filter</p>
          </div>
        )}
      </div>

      {/* League Information */}
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2" />
          League System
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'Normal', streak: '0+', trophy: '⚪', multiplier: '+2' },
            { name: 'Novice', streak: '25+', trophy: '🥉', multiplier: '+1.5' },
            { name: 'Advanced', streak: '50+', trophy: '🥈', multiplier: '+1' },
            { name: 'Master', streak: '100+', trophy: '🥇', multiplier: '+1' },
            { name: 'Legendary', streak: '250+', trophy: '💎', multiplier: '+0.5' },
            { name: 'Discipline-Star', streak: '500+', trophy: '⚫', multiplier: '+0.1' }
          ].map((league) => (
            <div key={league.name} className="text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${getLeagueBadgeClass(league.name)}`}>
                <span className="text-xl">{league.trophy}</span>
              </div>
              <h4 className="font-semibold text-white text-sm">{league.name}</h4>
              <p className="text-xs text-slate-400">{league.streak} streak</p>
              <p className="text-xs text-green-400">{league.multiplier} pts</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;