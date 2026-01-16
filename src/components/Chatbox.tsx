// src/components/ChatboxReal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, Send, Minimize2, Maximize2, User, Shield } from "lucide-react";
import styles from "./Chatbox.module.css";

interface Message {
  _id?: string;
  message: string;
  senderRole: 'user' | 'admin';
  senderName: string;
  timestamp: Date;
  read?: boolean;
}

interface Chat {
  _id: string;
  subject: string;
  status: 'pending' | 'active' | 'closed';
  messages: Message[];
  unreadCount?: number;
  userName: string;
  userEmail: string;
  lastMessageAt: Date;
}

export default function ChatboxReal() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && session?.user) {
      loadChats();
      const interval = setInterval(loadChats, 3000);
      return () => clearInterval(interval);
    }
  }, [open, session]);

  const loadChats = async () => {
    try {
      const response = await fetch('/api/chat/list');
      const result = await response.json();
      if (result.success) {
        setChats(result.data || []);
        if (activeChat) {
          const updated = result.data.find((c: Chat) => c._id === activeChat._id);
          if (updated) setActiveChat(updated);
        }
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const createNewChat = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Support Request',
          initialMessage: 'Hello, I need assistance with my account.'
        })
      });
      const result = await response.json();
      if (result.success) {
        setActiveChat(result.data);
        setChats([result.data, ...chats]);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeChat) return;
    setLoading(true);
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: activeChat._id, message: message.trim() })
      });
      const result = await response.json();
      if (result.success) {
        setMessage("");
        loadChats();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  if (!session) return null;

  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} className={styles.chatTrigger}>
          <MessageCircle size={24} />
          <span className={styles.onlineStatus}></span>
          {totalUnread > 0 && <div className={styles.unreadBadge}>{totalUnread}</div>}
        </button>
      )}

      {open && (
        <div className={`${styles.chatPopup} ${minimized ? styles.minimized : ''}`}>
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderTop}>
              <div className={styles.headerInfo}>
                <Shield size={20} className={styles.headerIcon} />
                <div>
                  <h3 className={styles.headerTitle}>Support Chat</h3>
                  <p className={styles.headerSubtitle}>{session.user?.name || 'Customer'}</p>
                </div>
              </div>
              <div className={styles.headerActions}>
                <button onClick={() => setMinimized(!minimized)} className={styles.headerBtn}>
                  {minimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button onClick={() => setOpen(false)} className={styles.headerBtn}>
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {!minimized && (
            <div className={styles.chatBody}>
              {!activeChat ? (
                <div className={styles.chatList}>
                  <button onClick={createNewChat} disabled={loading} className={styles.newChatBtn}>
                    <MessageCircle size={18} />
                    {loading ? 'Creating...' : 'New Support Request'}
                  </button>

                  {chats.length === 0 ? (
                    <div className={styles.emptyState}>
                      <MessageCircle size={48} className={styles.emptyIcon} />
                      <p className={styles.emptyTitle}>No conversations yet</p>
                      <p className={styles.emptySubtitle}>Start a chat to get instant support</p>
                    </div>
                  ) : (
                    <div className={styles.chatItems}>
                      {chats.map(chat => (
                        <div key={chat._id} onClick={() => setActiveChat(chat)} className={styles.chatItem}>
                          <div className={styles.chatItemHeader}>
                            <strong className={styles.chatItemSubject}>{chat.subject}</strong>
                            <span className={`${styles.chatItemStatus} ${styles[`status${chat.status}`]}`}>
                              {chat.status}
                            </span>
                          </div>
                          <p className={styles.chatItemPreview}>
                            {chat.messages[chat.messages.length - 1]?.message.substring(0, 50)}...
                          </p>
                          <span className={styles.chatItemTime}>
                            {new Date(chat.lastMessageAt).toLocaleString()}
                          </span>
                          {chat.unreadCount && chat.unreadCount > 0 && (
                            <span className={styles.chatItemUnread}>
                              {chat.unreadCount} new
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.activeChat}>
                  <div className={styles.activeChatHeader}>
                    <button onClick={() => setActiveChat(null)} className={styles.backBtn}>
                      ← Back
                    </button>
                    <div className={styles.activeChatInfo}>
                      <strong>{activeChat.subject}</strong>
                      <span className={`${styles.chatItemStatus} ${styles[`status${activeChat.status}`]}`}>
                        {activeChat.status}
                      </span>
                    </div>
                  </div>

                  <div className={styles.messages}>
                    {activeChat.messages.map((msg, idx) => (
                      <div key={idx} className={`${styles.messageRow} ${msg.senderRole === 'user' ? styles.messageUser : styles.messageAdmin}`}>
                        {msg.senderRole === 'user' ? (
                          <>
                            <div className={styles.avatarUser}><User size={16} /></div>
                            <div className={styles.messageBubbleUser}>
                              <span className={styles.messageSender}>{msg.senderName}</span>
                              <p className={styles.messageText}>{msg.message}</p>
                              <span className={styles.messageTime}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={styles.messageBubbleAdmin}>
                              <span className={styles.messageSender}><Shield size={12} /> {msg.senderName || 'Support'}</span>
                              <p className={styles.messageText}>{msg.message}</p>
                              <span className={styles.messageTime}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={styles.avatarAdmin}><Shield size={16} /></div>
                          </>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className={styles.inputArea}>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      disabled={loading}
                      className={styles.messageInput}
                    />
                    <button onClick={sendMessage} disabled={loading || !message.trim()} className={styles.sendBtn}>
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}