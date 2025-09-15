import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RadarChart = () => {
  const { user } = useContext(AuthContext);
  const [radarData, setRadarData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRadarData();
  }, []);

  const fetchRadarData = async () => {
    try {
      const response = await axios.get(`${API}/stats/radar`);
      setRadarData(response.data);
    } catch (error) {
      console.error('Failed to fetch radar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple SVG radar chart component
  const SimpleRadarChart = ({ data, size = 300 }) => {
    if (!data || !data.categories) return null;

    const center = size / 2;
    const maxRadius = center - 40;
    const angleStep = (2 * Math.PI) / data.categories.length;
    
    // Find max value for scaling
    const maxValue = Math.max(...data.categories.map(cat => cat.points), 10);
    
    // Generate points for the data polygon
    const dataPoints = data.categories.map((cat, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const radius = (cat.points / maxValue) * maxRadius;
      return {
        x: center + Math.cos(angle) * radius,
        y: center + Math.sin(angle) * radius,
        category: cat.category,
        points: cat.points
      };
    });

    // Generate grid circles
    const gridLevels = 5;
    const gridCircles = Array.from({ length: gridLevels }, (_, i) => {
      const radius = ((i + 1) / gridLevels) * maxRadius;
      return radius;
    });

    // Generate axis lines and labels
    const axisLines = data.categories.map((cat, index) => {
      const angle = index * angleStep - Math.PI / 2;
      return {
        x1: center,
        y1: center,
        x2: center + Math.cos(angle) * maxRadius,
        y2: center + Math.sin(angle) * maxRadius,
        labelX: center + Math.cos(angle) * (maxRadius + 20),
        labelY: center + Math.sin(angle) * (maxRadius + 20),
        category: cat.category,
        points: cat.points
      };
    });

    const dataPolygonPoints = dataPoints.map(point => `${point.x},${point.y}`).join(' ');

    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} className="mb-4">
          {/* Grid circles */}
          {gridCircles.map((radius, index) => (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="1"
            />
          ))}
          
          {/* Axis lines */}
          {axisLines.map((line, index) => (
            <line
              key={index}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="rgba(148, 163, 184, 0.3)"
              strokeWidth="1"
            />
          ))}
          
          {/* Data polygon */}
          <polygon
            points={dataPolygonPoints}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="rgba(59, 130, 246, 0.8)"
            strokeWidth="2"
          />
          
          {/* Data points */}
          {dataPoints.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="rgba(59, 130, 246, 1)"
              stroke="white"
              strokeWidth="2"
            />
          ))}
          
          {/* Category labels */}
          {axisLines.map((line, index) => (
            <text
              key={index}
              x={line.labelX}
              y={line.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="12"
              fontWeight="500"
            >
              {line.category}
            </text>
          ))}
        </svg>
        
        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full max-w-4xl">
          {data.categories.map((cat, index) => {
            const colors = [
              'text-blue-400',
              'text-green-400', 
              'text-purple-400',
              'text-yellow-400',
              'text-red-400'
            ];
            return (
              <div key={cat.category} className="text-center">
                <div className={`text-2xl ${colors[index]} font-bold`}>
                  {cat.points.toFixed(1)}
                </div>
                <div className="text-slate-400 text-sm">{cat.category}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
        <TrendingUp className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold text-white">Progress Chart</h1>
      </div>

      {/* Overall Score Card */}
      <div className="card text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <BarChart3 className="w-8 h-8 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Overall Score</h2>
        </div>
        <div className="text-6xl font-bold text-gradient mb-2">
          {radarData?.overall_score?.toFixed(1) || '0.0'}
        </div>
        <p className="text-slate-400">Average across all categories</p>
      </div>

      {/* Radar Chart */}
      <div className="card-elevated">
        <div className="flex items-center justify-center mb-6">
          <Activity className="w-6 h-6 text-blue-400 mr-2" />
          <h3 className="text-xl font-bold text-white">Performance Radar</h3>
        </div>
        
        <div className="flex justify-center">
          <SimpleRadarChart data={radarData} size={400} />
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {radarData?.categories?.map((category, index) => {
          const icons = ['🧠', '💪', '🤝', '⚡', '🎯'];
          const colors = [
            'border-blue-500/30 bg-blue-500/5',
            'border-green-500/30 bg-green-500/5',
            'border-purple-500/30 bg-purple-500/5',
            'border-yellow-500/30 bg-yellow-500/5',
            'border-red-500/30 bg-red-500/5'
          ];
          
          return (
            <div key={category.category} className={`card ${colors[index]}`}>
              <div className="text-center">
                <div className="text-3xl mb-2">{icons[index]}</div>
                <h4 className="font-semibold text-white mb-2">{category.category}</h4>
                <div className="text-2xl font-bold text-white mb-2">
                  {category.points.toFixed(1)}
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((category.points / Math.max(...radarData.categories.map(c => c.points), 1)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* League Information */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">League Status</h3>
          <div className="flex items-center space-x-2">
            <span className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium">
              {user?.league || 'Normal'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{user?.current_streak || 0}</div>
            <div className="text-slate-400 text-sm">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{user?.best_streak || 0}</div>
            <div className="text-slate-400 text-sm">Best Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{user?.badges?.length || 0}</div>
            <div className="text-slate-400 text-sm">Badges Earned</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadarChart;