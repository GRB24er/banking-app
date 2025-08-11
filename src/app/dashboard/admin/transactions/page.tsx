"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./transactions.module.css";
import Link from "next/link";

type TxStatus = "pending" | "approved" | "rejected";

type TxUser = {
  _id: string;
  name?: string;
  email?: string;
};

type Tx = {
  _id: string;
  user?: TxUser;
  userId?: string;
  amount: number;
  type: string;
  status: TxStatus;
  createdAt: string;
  date?: string;
  currency?: string;
  description?: string;
};

type TxListResponse = {
  items: Tx[];
  total: number;
  page: number;
  pageSize: number;
};

export default function AdminTransactionsPage() {
  const [status, setStatus] = useState<TxStatus>("pending");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [data, setData] = useState<TxListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string>("");

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  async function fetchList() {
    setLoading(true);
    setErr(null);
    try {
      const url = new URL("/api/admin/transactions", window.location.origin);
      url.searchParams.set("status", status);
      url.searchParams.set("page", String(page));
      url.searchParams.set("pageSize", String(pageSize));
      if (query.trim()) url.searchParams.set("query", query.trim());
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed: ${res.status}`);
      }
      const json = (await res.json()) as TxListResponse;
      setData(json);
    } catch (e: any) {
      setErr(e.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchList();
  }

  async function act(id: string, action: "approve" | "reject") {
    try {
      const res = await fetch(`/api/admin/transactions/${id}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed to ${action}`);
      }
      await fetchList();
    } catch (e: any) {
      alert(e.message || `Could not ${action}`);
    }
  }

  function startEditDate(tx: Tx) {
    setEditingId(tx._id);
    const iso = (tx.date || tx.createdAt).slice(0, 16); // yyyy-mm-ddThh:mm
    setEditingDate(iso.replace("Z", "")); // datetime-local expects no Z
  }

  async function saveDate() {
    if (!editingId || !editingDate) return;
    try {
      const res = await fetch(`/api/admin/transactions/${editingId}/date`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: new Date(editingDate).toISOString() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to update date");
      }
      setEditingId(null);
      setEditingDate("");
      await fetchList();
    } catch (e: any) {
      alert(e.message || "Could not update date");
    }
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Admin — Transactions</h1>
          <Link className={styles.link} href="/dashboard/admin">← Back to Users</Link>
        </div>

        <form className={styles.searchForm} onSubmit={onSearch}>
          <input
            className={styles.searchInput}
            placeholder="Search by user, email, or txn ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className={styles.btn} type="submit">Search</button>
        </form>
      </header>

      <nav className={styles.tabs}>
        {(["pending", "approved", "rejected"] as TxStatus[]).map((s) => (
          <button
            key={s}
            className={`${styles.tab} ${status === s ? styles.tabActive : ""}`}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
          >
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : err ? (
        <div className={styles.error}>{err}</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Created</th>
                <th>Effective Date</th>
                <th>Status</th>
                <th className={styles.right}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((tx) => (
                <tr key={tx._id}>
                  <td className={styles.mono}>{tx._id}</td>
                  <td>
                    {tx.user?.name || "—"}
                    <div className={styles.subtle}>
                      {tx.user?.email || tx.userId || "—"}
                    </div>
                  </td>
                  <td className={styles.cap}>{tx.type}</td>
                  <td className={styles.mono}>{tx.amount}</td>
                  <td className={styles.mono}>{tx.currency || "—"}</td>
                  <td className={styles.mono}>
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                  <td className={styles.mono}>
                    {tx.date
                      ? new Date(tx.date).toLocaleString()
                      : new Date(tx.createdAt).toLocaleString()}
                  </td>
                  <td className={styles.cap}>{tx.status}</td>
                  <td className={styles.right}>
                    {tx.status === "pending" ? (
                      <div className={styles.actions}>
                        <button
                          className={`${styles.btn} ${styles.approve}`}
                          onClick={() => act(tx._id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className={`${styles.btn} ${styles.reject}`}
                          onClick={() => act(tx._id, "reject")}
                        >
                          Reject
                        </button>
                        <button
                          className={`${styles.btn} ${styles.edit}`}
                          onClick={() => startEditDate(tx)}
                        >
                          Edit Date
                        </button>
                      </div>
                    ) : (
                      <button
                        className={`${styles.btn} ${styles.edit}`}
                        onClick={() => startEditDate(tx)}
                      >
                        Edit Date
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {!data?.items?.length && (
                <tr>
                  <td colSpan={9} className={styles.empty}>
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className={styles.pagination}>
            <button
              className={styles.btn}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>
            <button
              className={styles.btn}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {editingId && (
        <div className={styles.modalBackdrop} onClick={() => setEditingId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Edit Effective Date</h3>
            <input
              className={styles.input}
              type="datetime-local"
              value={editingDate}
              onChange={(e) => setEditingDate(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button className={styles.btn} onClick={() => setEditingId(null)}>
                Cancel
              </button>
              <button className={`${styles.btn} ${styles.primary}`} onClick={saveDate}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
