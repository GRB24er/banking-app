'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './AdminPage.css';
import FinancialOperations from './FinancialOperations';
import UserManagement from './UserManagement';

interface UserType {
  _id: string;
  name: string;
  email: string;
  balance: number;
  role: string;
  verified: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ 
    email: 'andyjonhson50@gmail.com', 
    password: '' 
  });
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const auth = localStorage.getItem('adminAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUsers(data.users);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminAuthenticated', 'true');
        fetchUsers();
      } else {
        if (data.message === 'Admin account not found') {
          setLoginError('Admin account does not exist');
        } else if (data.message === 'Invalid credentials') {
          setLoginError('Incorrect password');
        } else {
          setLoginError(data.message || 'Login failed');
        }
      }
    } catch (err) {
      setLoginError('Network error. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuthenticated');
    setFormData({ email: 'andyjonhson50@gmail.com', password: '' });
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();
      
      if (res.ok) {
        await fetchUsers();
      } else {
        setError(data.message || 'Failed to verify user');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();
      
      if (res.ok) {
        await fetchUsers();
      } else {
        setError(data.message || 'Failed to delete user');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="center">Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <form className="login-box" onSubmit={handleLogin}>
          <h2>Admin Portal</h2>
          {loginError && <p className="error">{loginError}</p>}
          
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          
          <button type="submit">Login</button>
          
          <div className="signup-link">
            <p>Need to create an admin account?</p>
            <button type="button" onClick={() => router.push('/admin/signup')}>
              Setup Admin Account
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header>
        <h1>Admin Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <nav className="admin-nav">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button 
          className={activeTab === 'transactions' ? 'active' : ''}
          onClick={() => setActiveTab('transactions')}
        >
          Financial Operations
        </button>
      </nav>

      {error && <p className="error-message">{error}</p>}

      {activeTab === 'dashboard' && (
        <section className="card-grid">
          <div className="card">
            <div className="card-icon">👤</div>
            <div>
              <h3>Total Users</h3>
              <p>{users.length} registered users</p>
            </div>
          </div>
          <div className="card">
            <div className="card-icon">✅</div>
            <div>
              <h3>Verified Users</h3>
              <p>{users.filter(u => u.verified).length} verified</p>
            </div>
          </div>
          <div className="card">
            <div className="card-icon">📊</div>
            <div>
              <h3>Transaction Stats</h3>
              <p>View activity reports</p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'users' && (
        <UserManagement 
          users={users} 
          refreshUsers={fetchUsers}
          onVerifyUser={handleVerifyUser}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {activeTab === 'transactions' && (
        <FinancialOperations users={users} refreshUsers={fetchUsers} />
      )}
    </div>
  );
}