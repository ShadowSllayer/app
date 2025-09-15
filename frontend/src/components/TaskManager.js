import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Circle,
  AlertCircle,
  Target,
  Clock
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const categories = [
  { value: 'Intelligence', icon: '🧠', color: 'text-blue-400' },
  { value: 'Physical', icon: '💪', color: 'text-green-400' },
  { value: 'Social', icon: '🤝', color: 'text-purple-400' },
  { value: 'Discipline', icon: '⚡', color: 'text-yellow-400' },
  { value: 'Determination', icon: '🎯', color: 'text-red-400' }
];

const TaskManager = () => {
  const { refreshUser } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    category: 'Intelligence',
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tasks`, formData);
      await fetchTasks();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create task');
    }
  };

  const updateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/tasks/${editingTask.id}`, {
        title: formData.title,
        description: formData.description
      });
      await fetchTasks();
      setEditingTask(null);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await axios.delete(`${API}/tasks/${taskId}`);
      await fetchTasks();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete task');
    }
  };

  const completeTask = async (taskId) => {
    try {
      await axios.post(`${API}/tasks/${taskId}/complete`);
      await fetchTasks();
      await refreshUser();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to complete task');
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'Intelligence',
      title: '',
      description: ''
    });
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      category: task.category,
      title: task.title,
      description: task.description || ''
    });
  };

  const getTasksByCategory = () => {
    const grouped = {};
    categories.forEach(cat => {
      grouped[cat.value] = tasks.filter(task => task.category === cat.value);
    });
    return grouped;
  };

  const isTaskCompletedToday = (task) => {
    const today = new Date().toISOString().split('T')[0];
    return task.completion_dates?.some(date => 
      new Date(date).toISOString().split('T')[0] === today
    );
  };

  const canCreateTask = (category) => {
    const categoryTasks = tasks.filter(task => task.category === category);
    return categoryTasks.length < 2;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  const tasksByCategory = getTasksByCategory();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Target className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Task Manager</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Tasks by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {categories.map((category) => {
          const categoryTasks = tasksByCategory[category.value];
          const completedToday = categoryTasks.filter(isTaskCompletedToday).length;
          const canCreate = canCreateTask(category.value);

          return (
            <div key={category.value} className="card-elevated">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{category.value}</h3>
                    <p className="text-slate-400 text-sm">
                      {categoryTasks.length}/2 tasks • {completedToday} completed today
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (canCreate) {
                      setFormData({ ...formData, category: category.value });
                      setShowCreateModal(true);
                    }
                  }}
                  disabled={!canCreate}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    canCreate
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                  title={canCreate ? 'Add new task' : 'Maximum 2 tasks per category'}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Warning for max tasks */}
              {!canCreate && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <p className="text-yellow-400 text-sm">
                      Maximum 2 tasks per category reached
                    </p>
                  </div>
                </div>
              )}

              {/* Tasks List */}
              <div className="space-y-4">
                {categoryTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Circle className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400">No tasks yet</p>
                    <p className="text-slate-500 text-sm">Create your first task to get started</p>
                  </div>
                ) : (
                  categoryTasks.map((task) => {
                    const completedToday = isTaskCompletedToday(task);
                    
                    return (
                      <div
                        key={task.id}
                        className={`
                          bg-slate-800/50 rounded-lg p-4 border transition-all duration-200
                          ${completedToday 
                            ? 'border-green-500/30 bg-green-500/5' 
                            : 'border-slate-700/50 hover:border-slate-600/50'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="text-white font-medium mb-1">{task.title}</h4>
                            {task.description && (
                              <p className="text-slate-400 text-sm">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openEditModal(task)}
                              className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-400">
                              {task.completion_dates?.length || 0} completions
                            </span>
                          </div>
                          
                          {completedToday ? (
                            <div className="flex items-center space-x-2 text-green-400">
                              <CheckCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">Completed</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => completeTask(task.id)}
                              className="btn-success px-4 py-2 text-sm"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTask) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-light rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h3>
            
            <form onSubmit={editingTask ? updateTask : createTask} className="space-y-4">
              {!editingTask && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-input"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.value}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                  placeholder="Enter task title"
                  required
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input"
                  placeholder="Enter task description"
                  rows={3}
                  maxLength={500}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTask(null);
                    resetForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  {editingTask ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;