// src/app/admin/FinancialOperations.tsx
'use client';

import { useState } from 'react';
import { UserType } from '@/types/user';

interface FinancialOperationProps {
  users: UserType[];
  refreshUsers: () => void;
}

export default function FinancialOperations({ users, refreshUsers }: FinancialOperationProps) {
  const [operation, setOperation] = useState('transfer');
  const [formData, setFormData] = useState({
    userId: '',
    relatedUserId: '',
    amount: 0,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ success: '', error: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ success: '', error: '' });

    try {
      const response = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: operation
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus({ 
          success: `Successfully processed ${operation} of $${formData.amount.toFixed(2)}`, 
          error: '' 
        });
        setFormData({
          userId: '',
          relatedUserId: '',
          amount: 0,
          description: ''
        });
        refreshUsers();
      } else {
        setStatus({ 
          success: '', 
          error: data.message || `Failed to process ${operation}` 
        });
      }
    } catch (error) {
      setStatus({ 
        success: '', 
        error: 'Network error. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="financial-operations">
      <h2>Financial Operations</h2>
      
      <div className="operation-tabs">
        {['transfer', 'deposit', 'withdrawal', 'debit', 'credit'].map(op => (
          <button
            key={op}
            className={`tab ${operation === op ? 'active' : ''}`}
            onClick={() => setOperation(op)}
          >
            {op.charAt(0).toUpperCase() + op.slice(1)}
          </button>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="operation-form">
        <div className="form-group">
          <label>User Account</label>
          <select
            value={formData.userId}
            onChange={(e) => setFormData({...formData, userId: e.target.value})}
            required
          >
            <option value="">Select user</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.name} - ${user.balance.toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        
        {(operation === 'transfer') && (
          <div className="form-group">
            <label>Recipient Account</label>
            <select
              value={formData.relatedUserId}
              onChange={(e) => setFormData({...formData, relatedUserId: e.target.value})}
              required
            >
              <option value="">Select recipient</option>
              {users
                .filter(user => user._id !== formData.userId)
                .map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} - ${user.balance.toFixed(2)}
                  </option>
                ))}
            </select>
          </div>
        )}
        
        <div className="form-group">
          <label>Amount (USD)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
            placeholder={`Reason for ${operation}`}
          />
        </div>
        
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Processing...' : `Execute ${operation.charAt(0).toUpperCase() + operation.slice(1)}`}
        </button>
        
        {status.success && <p className="success-message">{status.success}</p>}
        {status.error && <p className="error-message">{status.error}</p>}
      </form>
    </div>
  );
}