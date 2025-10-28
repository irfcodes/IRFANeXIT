import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { FaPlus, FaSearch, FaTasks, FaCheckCircle, FaClock } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    filterAndSearchTasks();
  }, [tasks, searchTerm, filterStatus]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/tasks`);
      setTasks(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch tasks. Please check if the server is running.');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSearchTasks = () => {
    let filtered = tasks;

    if (filterStatus !== 'All') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setLoading(true);
      if (editingTask) {
        await axios.put(`${API_BASE_URL}/tasks/${editingTask._id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/tasks`, formData);
      }
      
      setFormData({ title: '', description: '' });
      setEditingTask(null);
      setError('');
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
      console.error('Error saving task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({ title: task.title, description: task.description });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/tasks/${id}`);
      setError('');
      fetchTasks();
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (task) => {
    try {
      const newStatus = task.status === 'Pending' ? 'Completed' : 'Pending';
      await axios.put(`${API_BASE_URL}/tasks/${task._id}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      setError('Failed to update task status');
      console.error('Error updating status:', err);
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setFormData({ title: '', description: '' });
    setError('');
  };

  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <FaTasks className="header-icon" />
          <h1>Task Manager</h1>
        </div>
      </header>

      <main className="container">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} className="close-btn">×</button>
          </div>
        )}

        <div className="stats-container">
          <div className="stat-card pending">
            <FaClock />
            <div>
              <h3>{pendingCount}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card completed">
            <FaCheckCircle />
            <div>
              <h3>{completedCount}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stat-card total">
            <FaTasks />
            <div>
              <h3>{tasks.length}</h3>
              <p>Total Tasks</p>
            </div>
          </div>
        </div>

        <div className="form-card">
          <h2>{editingTask ? 'Edit Task' : 'Add New Task'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Task Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <FaPlus />
                {editingTask ? 'Update Task' : 'Add Task'}
              </button>
              {editingTask && (
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="filter-section">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterStatus === 'All' ? 'active' : ''}`}
              onClick={() => setFilterStatus('All')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filterStatus === 'Pending' ? 'active' : ''}`}
              onClick={() => setFilterStatus('Pending')}
            >
              Pending
            </button>
            <button
              className={`filter-btn ${filterStatus === 'Completed' ? 'active' : ''}`}
              onClick={() => setFilterStatus('Completed')}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="tasks-container">
          {loading && tasks.length === 0 ? (
            <div className="loading">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="no-tasks">
              <FaTasks size={50} />
              <p>No tasks found</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task._id} className={`task-card ${task.status.toLowerCase()}`}>
                <div className="task-header">
                  <div className="task-checkbox">
                    <input
                      type="checkbox"
                      checked={task.status === 'Completed'}
                      onChange={() => toggleStatus(task)}
                    />
                  </div>
                  <div className="task-content">
                    <h3 className={task.status === 'Completed' ? 'completed-text' : ''}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    <small className="task-date">
                      {new Date(task.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </small>
                  </div>
                  <div className="task-status">
                    <span className={`badge ${task.status.toLowerCase()}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
                <div className="task-actions">
                  <button className="btn-edit" onClick={() => handleEdit(task)}>
                    Edit
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(task._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;