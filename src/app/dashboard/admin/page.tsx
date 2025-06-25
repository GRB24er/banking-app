'use client';

import { useState, useEffect }      from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import styles                       from './admin.module.css';

interface UserRow {
  id:        string;
  name:      string;
  email:     string;
  role:      string;
  verified:  boolean;
}

interface RecentTx {
  id:     string;
  type:   string;
  amount: number;
  date:   string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers]         = useState<UserRow[]>([]);
  const [recent, setRecent]       = useState<RecentTx[]>([]);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(0);
  const [error, setError]         = useState<string|null>(null);
  const pageSize = 10;

  // Load overview (users + recent)
  async function load() {
    try {
      const res = await fetch('/api/admin/overview');
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setUsers(json.users);
      setRecent(json.recent);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  // Perform an admin action and reload
  async function action(url: string, payload?: any) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: payload ? JSON.stringify(payload) : undefined
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || 'Action failed');
    }
    await load();
  }

  // Initial data fetch
  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'admin') {
      load();
    }
  }, [status, session]);

  // Auth & role guards
  if (status === 'loading') return <p className={styles.loading}>Loading…</p>;
  if (status === 'unauthenticated') {
    return (
      <div className={styles.centered}>
        <h1>Admin Sign In</h1>
        <button className={styles.btnPrimary}
                onClick={()=>signIn('credentials',{callbackUrl:'/admin'})}>
          Sign In
        </button>
      </div>
    );
  }
  if (session?.user.role !== 'admin') {
    return (
      <div className={styles.centered}>
        <h1>Access Denied</h1>
        <button className={styles.btnSecondary}
                onClick={()=>signOut({callbackUrl:'/'})}>
          Sign Out
        </button>
      </div>
    );
  }

  // Filter & paginate
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const pages     = Math.ceil(filtered.length / pageSize);
  const pageUsers = filtered.slice(page*pageSize, (page+1)*pageSize);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Admin Dashboard</h1>
        <button className={styles.btnDanger}
                onClick={()=>signOut({callbackUrl:'/'})}>
          Sign Out
        </button>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <input
        className={styles.search}
        type="text"
        placeholder="Search by name or email…"
        value={search}
        onChange={e=>{ setSearch(e.target.value); setPage(0); }}
      />

      <table className={styles.usersTable}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Verified</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pageUsers.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.verified ? '✅' : '❌'}</td>
              <td className={styles.actions}>
                <button className={styles.btnPrimary}
                        onClick={()=>{
                          const amt = prompt('Deposit amount:');
                          return amt && action(`/api/admin/user/${u.id}/deposit`,{amount:amt});
                        }}>
                  Deposit
                </button>
                <button className={styles.btnWarning}
                        onClick={()=>{
                          const amt = prompt('Withdraw amount:');
                          return amt && action(`/api/admin/user/${u.id}/withdraw`,{amount:amt});
                        }}>
                  Withdraw
                </button>
                {!u.verified && (
                  <button className={styles.btnSuccess}
                          onClick={()=>action(`/api/admin/user/${u.id}/verify`)}>
                    Verify
                  </button>
                )}
                <button className={styles.btnInfo}
                        onClick={()=>
                          action(`/api/admin/user/${u.id}/statement`)
                          .then(()=>alert('Statement sent'))
                        }>
                  Statement
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.pagination}>
        <button disabled={page===0}
                onClick={()=>setPage(p=>p-1)}>
          Prev
        </button>
        <span>Page {page+1} of {pages||1}</span>
        <button disabled={page+1>=pages}
                onClick={()=>setPage(p=>p+1)}>
          Next
        </button>
      </div>

      <section className={styles.recentSection}>
        <h2>Recent Transactions</h2>
        <ul className={styles.recentList}>
          {recent.map(tx => (
            <li key={tx.id}>
              <strong>{new Date(tx.date).toLocaleString()}</strong>:
              {` ${tx.type} ${tx.amount}`}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
