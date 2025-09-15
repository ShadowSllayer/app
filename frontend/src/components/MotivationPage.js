import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import { 
  Heart, 
  RefreshCw, 
  BookOpen, 
  Star, 
  StarOff,
  Quote,
  Sparkles,
  Calendar
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Quotable API for free quotes
const QUOTABLE_API = 'https://api.quotable.io';

const MotivationPage = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [dailyQuotes, setDailyQuotes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => {
    fetchMotivationData();
  }, []);

  const fetchMotivationData = async () => {
    try {
      const [quotesResponse, favoritesResponse] = await Promise.all([
        fetchDailyQuotes(),
        fetchFavoriteQuotes()
      ]);
      
      setDailyQuotes(quotesResponse);
      setFavorites(favoritesResponse);
    } catch (error) {
      console.error('Failed to fetch motivation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyQuotes = async () => {
    try {
      // Fetch 5 quotes from Quotable API
      const response = await axios.get(`${QUOTABLE_API}/quotes?limit=5`);
      return response.data.results.map(quote => ({
        id: quote._id,
        content: quote.content,
        author: quote.author,
        length: quote.length,
        tags: quote.tags,
        isFavorite: false
      }));
    } catch (error) {
      console.error('Failed to fetch daily quotes:', error);
      // Fallback quotes if API fails
      return [
        {
          id: 'fallback-1',
          content: 'The only way to do great work is to love what you do.',
          author: 'Steve Jobs',
          length: 49,
          tags: ['motivational'],
          isFavorite: false
        },
        {
          id: 'fallback-2',
          content: 'Innovation distinguishes between a leader and a follower.',
          author: 'Steve Jobs',
          length: 56,
          tags: ['leadership'],
          isFavorite: false
        },
        {
          id: 'fallback-3',
          content: 'Your limitation—it\'s only your imagination.',
          author: 'Unknown',
          length: 43,
          tags: ['inspiration'],
          isFavorite: false
        },
        {
          id: 'fallback-4',
          content: 'Push yourself, because no one else is going to do it for you.',
          author: 'Unknown',
          length: 61,
          tags: ['motivational'],
          isFavorite: false
        },
        {
          id: 'fallback-5',
          content: 'Great things never come from comfort zones.',
          author: 'Unknown',
          length: 41,
          tags: ['growth'],
          isFavorite: false
        }
      ];
    }
  };

  const fetchFavoriteQuotes = async () => {
    try {
      const response = await axios.get(`${API}/quotes/favorites`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch favorite quotes:', error);
      return [];
    }
  };

  const refreshDailyQuotes = async () => {
    setRefreshing(true);
    try {
      const newQuotes = await fetchDailyQuotes();
      setDailyQuotes(newQuotes);
    } catch (error) {
      console.error('Failed to refresh quotes:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleFavorite = async (quote) => {
    try {
      const isFavorite = favorites.some(fav => fav.quote === quote.content);
      
      if (isFavorite) {
        // Remove from favorites
        await axios.delete(`${API}/quotes/favorites`, {
          data: { quote: quote.content, author: quote.author }
        });
        setFavorites(favorites.filter(fav => fav.quote !== quote.content));
      } else {
        // Add to favorites
        const response = await axios.post(`${API}/quotes/favorites`, {
          quote: quote.content,
          author: quote.author
        });
        setFavorites([...favorites, response.data]);
      }
      
      // Update the quote's favorite status in daily quotes
      setDailyQuotes(dailyQuotes.map(q => 
        q.id === quote.id 
          ? { ...q, isFavorite: !isFavorite }
          : q
      ));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      alert('Failed to update favorite status');
    }
  };

  const removeFavorite = async (favoriteId) => {
    try {
      await axios.delete(`${API}/quotes/favorites/${favoriteId}`);
      setFavorites(favorites.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      alert('Failed to remove favorite');
    }
  };

  const isQuoteFavorite = (quote) => {
    return favorites.some(fav => fav.quote === quote.content);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Heart className="w-8 h-8 text-pink-400" />
          <h1 className="text-3xl font-bold text-white">Daily Motivation</h1>
        </div>
        <button
          onClick={refreshDailyQuotes}
          disabled={refreshing}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Quotes'}</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-slate-800/50 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'daily'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Daily Quotes ({dailyQuotes.length})
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'favorites'
              ? 'bg-pink-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Saved Favorites ({favorites.length})
        </button>
      </div>

      {/* Daily Quotes Tab */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Today's Inspiration
            </h2>
            <p className="text-slate-400">
              Five carefully selected quotes to motivate and inspire your day
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dailyQuotes.map((quote, index) => (
              <div key={quote.id} className="card-elevated group hover:scale-105 transform transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <Quote className="w-6 h-6 text-blue-400" />
                  </div>
                  <button
                    onClick={() => toggleFavorite(quote)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isQuoteFavorite(quote)
                        ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20'
                        : 'text-slate-400 bg-slate-700/50 hover:text-yellow-400 hover:bg-yellow-400/10'
                    }`}
                  >
                    {isQuoteFavorite(quote) ? (
                      <Star className="w-5 h-5 fill-current" />
                    ) : (
                      <StarOff className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <blockquote className="text-white text-lg font-medium leading-relaxed mb-4">
                  "{quote.content}"
                </blockquote>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 font-semibold">— {quote.author}</p>
                    <p className="text-slate-400 text-sm">{quote.length} characters</p>
                  </div>
                  
                  {quote.tags && (
                    <div className="flex flex-wrap gap-1">
                      {quote.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <BookOpen className="w-12 h-12 text-pink-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Your Saved Favorites
            </h2>
            <p className="text-slate-400">
              Quotes that inspire you, saved for whenever you need motivation
            </p>
          </div>

          {favorites.length === 0 ? (
            <div className="card text-center py-12">
              <Star className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No favorites yet
              </h3>
              <p className="text-slate-400 mb-4">
                Start building your collection by saving quotes from the daily selection
              </p>
              <button
                onClick={() => setActiveTab('daily')}
                className="btn-primary"
              >
                Browse Daily Quotes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {favorites.map((favorite) => (
                <div key={favorite.id} className="card-elevated group">
                  <div className="flex items-start justify-between mb-4">
                    <Quote className="w-6 h-6 text-pink-400" />
                    <button
                      onClick={() => removeFavorite(favorite.id)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <StarOff className="w-5 h-5" />
                    </button>
                  </div>

                  <blockquote className="text-white text-lg font-medium leading-relaxed mb-4">
                    "{favorite.quote}"
                  </blockquote>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-400 font-semibold">— {favorite.author}</p>
                      <p className="text-slate-400 text-sm">
                        Saved {new Date(favorite.saved_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inspiration Footer */}
      <div className="card bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20">
        <div className="text-center">
          <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">
            Daily Dose of Motivation
          </h3>
          <p className="text-slate-300">
            "Success is not final, failure is not fatal: it is the courage to continue that counts." 
            <span className="text-blue-400 font-semibold"> — Winston Churchill</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MotivationPage;