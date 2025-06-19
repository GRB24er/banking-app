'use client';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/overview')
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <p>Loading admin overview...</p>;

  return (
    <div style={{ padding: '40px', fontFamily: 'Segoe UI' }}>
      <h2>Admin Overview Panel</h2>

      <div style={{ margin: '20px 0' }}>
        <p><strong>Total Users:</strong> {data.summary.totalUsers}</p>
        <p><strong>Verified Users:</strong> {data.summary.verified}</p>
        <p><strong>Total USD Balance:</strong> ${data.summary.totalBalance.toFixed(2)}</p>
        <p><strong>Total BTC Balance:</strong> {data.summary.totalBTC.toFixed(8)} BTC</p>
      </div>

      <h3>Recent Transactions</h3>
      <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '30px' }}>
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.recent.map((t: any, i: number) => (
            <tr key={i}>
              <td>{t.user}</td>
              <td>{t.email}</td>
              <td>{t.type}</td>
              <td>${t.amount.toFixed(2)}</td>
              <td>{t.status}</td>
              <td>{new Date(t.date).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>All Users</h3>
      <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Status</th><th>USD</th><th>BTC</th>
          </tr>
        </thead>
        <tbody>
          {data.users.map((u: any, i: number) => (
            <tr key={i}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.verified ? '✔ Verified' : '⛔ Unverified'}</td>
              <td>${u.balance.toFixed(2)}</td>
              <td>{u.btcBalance.toFixed(8)} BTC</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: '40px' }}>Manual Balance Update</h3>
      <form
        onSubmit={async e => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);

          const res = await fetch('/api/admin/update-balance', {
            method: 'POST',
            body: JSON.stringify({
              userId: formData.get('userId'),
              amount: Number(formData.get('amount')),
              type: formData.get('type'),
              currency: formData.get('currency'),
              description: formData.get('description') || 'Admin balance update',
            }),
            headers: { 'Content-Type': 'application/json' }
          });

          const json = await res.json();
          if (json.success) {
            alert('✅ Transaction successful. Email sent.');
            window.location.reload();
          } else {
            alert(`❌ ${json.error}`);
          }
        }}
        style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}
      >
        <input name="userId" placeholder="User ID" required style={{ padding: '8px', width: '220px' }} />
        <input name="amount" placeholder="Amount" type="number" required style={{ padding: '8px', width: '120px' }} />
        <select name="type" required style={{ padding: '8px' }}>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        <select name="currency" required style={{ padding: '8px' }}>
          <option value="USD">USD</option>
          <option value="BTC">BTC</option>
        </select>
        <input name="description" placeholder="Description (optional)" style={{ padding: '8px', width: '250px' }} />
        <button type="submit" style={{ padding: '8px 16px' }}>Apply</button>
      </form>
    </div>
  );
}
