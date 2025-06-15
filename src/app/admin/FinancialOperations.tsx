'use client';

import { useState } from 'react';
import { UserType } from '@/types/user';

interface FinancialOperationsProps {
  users: UserType[];
  refreshUsers: () => void;
}

export default function FinancialOperations({ users, refreshUsers }: FinancialOperationsProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'BTC'>('USD');
  const [operation, setOperation] = useState<'credit' | 'debit'>('credit');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount)) {
        throw new Error('Please enter a valid amount');
      }

      const response = await fetch('/api/admin/adjust-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          amount: operation === 'credit' ? numericAmount : -numericAmount,
          currency,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to process operation');

      setMessage({ text: 'Operation completed successfully', type: 'success' });
      refreshUsers();
      setAmount('');
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2 style={{ textAlign: 'center' }}>Financial Operations</h2>

      {message && (
        <div style={{
          backgroundColor: message.type === 'success' ? '#e6ffed' : '#ffe6e6',
          color: message.type === 'success' ? '#036b26' : '#b30000',
          padding: 10,
          borderRadius: 6,
          marginBottom: 16,
          textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label>Select User</label>
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} required style={{ width: '100%', padding: 8 }}>
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email}) - {user.balance.toFixed(2)} USD / {user.btcBalance.toFixed(6)} BTC
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Operation</label>
          <select value={operation} onChange={(e) => setOperation(e.target.value as 'credit' | 'debit')} required style={{ width: '100%', padding: 8 }}>
            <option value="credit">Credit (Add)</option>
            <option value="debit">Debit (Subtract)</option>
          </select>
        </div>

        <div>
          <label>Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value as 'USD' | 'BTC')} required style={{ width: '100%', padding: 8 }}>
            <option value="USD">USD</option>
            <option value="BTC">BTC</option>
          </select>
        </div>

        <div>
          <label>Amount</label>
          <input
            type="number"
            step={currency === 'USD' ? '0.01' : '0.000001'}
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <button type="submit" disabled={loading || !selectedUserId} style={{
          backgroundColor: '#0070f3',
          color: 'white',
          padding: 12,
          border: 'none',
          borderRadius: 6,
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}>
          {loading ? 'Processing...' : 'Execute Operation'}
        </button>
      </form>
    </div>
  );
}
