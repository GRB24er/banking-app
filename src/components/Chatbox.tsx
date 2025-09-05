// src/components/Chatbox.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, Send, User, CheckCircle, Loader2, Phone, Calendar, Minimize2, Maximize2, Shield, Clock, ChevronDown, Paperclip, Camera, Download, FileText } from "lucide-react";
import styles from "./Chatbox.module.css";

// Type definitions
interface SystemContent {
  header: string;
  body: string;
  timestamp?: string;
  actions?: string[];
}

interface Attachment {
  id: string;
  type: string;
  name: string;
  size: string;
}

interface Agent {
  name: string;
  title: string;
  employeeId: string;
  department: string;
  availability: string;
  avgResponseTime: string;
  satisfactionScore: string;
}

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string | SystemContent;
  timestamp: string;
  agent?: Agent;
  quickReplies?: string[];
  attachment?: Attachment;
}

interface AttachmentPreview {
  name: string;
  size: string;
  type: string;
}

interface ChatContext {
  userName: string;
  userEmail: string;
  accountBalance: number;
  checkingBalance: number;
  savingsBalance: number;
  investmentBalance: number;
  recentTransactions: any[];
  hasPendingTransactions: boolean;
  lastActivity: string;
  accountNumber: string;
  cardDetails: {
    type: string;
    lastFour: string;
    status: string;
  }[];
}

export default function Chatbox() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<ChatContext | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [hasInitiated, setHasInitiated] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [conversationStatus, setConversationStatus] = useState("active");
  const [attachmentPreview, setAttachmentPreview] = useState<AttachmentPreview | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMethod, setAuthMethod] = useState<string | null>(null);
  const [satisfactionRating, setSatisfactionRating] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentAgent] = useState<Agent>({
    name: "Sarah Mitchell",
    title: "Senior Banking Specialist",
    employeeId: "HB-2847",
    department: "Customer Success",
    availability: "Available",
    avgResponseTime: "< 1 minute",
    satisfactionScore: "4.9/5.0"
  });

  const bankingActions = {
    main: [
      { icon: "💳", label: "Card Services", action: "card_services" },
      { icon: "🔒", label: "Report Fraud", action: "fraud_report" },
      { icon: "📊", label: "Account Statement", action: "statement" },
      { icon: "🏦", label: "Branch Locator", action: "branch" }
    ],
    authenticated: [
      { icon: "💸", label: "Quick Transfer", action: "transfer" },
      { icon: "📱", label: "Mobile Banking", action: "mobile" },
      { icon: "🔔", label: "Alerts Settings", action: "alerts" },
      { icon: "📈", label: "Investment Options", action: "invest" }
    ]
  };

  // Fetch user context with account details
  const fetchContext = useCallback(async () => {
    if (session?.user?.email) {
      try {
        const response = await fetch('/api/user/dashboard');
        if (response.ok) {
          const data = await response.json();
          
          // Calculate balances
          const checkingBalance = data.balances?.checking || 0;
          const savingsBalance = data.balances?.savings || 0;
          const investmentBalance = data.balances?.investment || 0;
          const totalBalance = checkingBalance + savingsBalance + investmentBalance;
          
          // Get recent transactions
          const recentTransactions = data.recent || [];
          const hasPending = recentTransactions.some((t: any) => 
            t.rawStatus === "pending" || t.status === "Pending"
          );
          
          // Get account details
          const accountNumber = data.accountNumber || `****${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
          
          // Get card details
          const cardDetails = data.cards || [
            { type: "Debit Card", lastFour: "4321", status: "Active" },
            { type: "Credit Card", lastFour: "8765", status: "Active" }
          ];
          
          setContext({
            userName: data.user?.name || session.user.name || "Guest",
            userEmail: session.user.email,
            accountBalance: totalBalance,
            checkingBalance,
            savingsBalance,
            investmentBalance,
            recentTransactions,
            hasPendingTransactions: hasPending,
            lastActivity: new Date().toISOString(),
            accountNumber,
            cardDetails
          });
        }
      } catch (error) {
        console.error('Error fetching context:', error);
      }
    }
  }, [session]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  useEffect(() => {
    if (!hasInitiated && context && !open) {
      const timer = setTimeout(() => {
        setOpen(true);
        setTimeout(() => {
          sendAgentMessage(
            `Hello ${context.userName}! 👋 I noticed you're online. I'm ${currentAgent.name}, your personal banking assistant. I can see you have an account with us (ending in ${context.accountNumber.slice(-4)}). How may I assist you today?`,
            ['Check Balance', 'Recent Transactions', 'Transfer Money', 'Card Services']
          );
          setHasInitiated(true);
        }, 1000);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [context, hasInitiated, open, currentAgent.name]);

  useEffect(() => {
    const handleOpenChat = (event: CustomEvent) => {
      setOpen(true);
      setMinimized(false);
      if (event.detail?.message) {
        setTimeout(() => {
          setInputText(event.detail.message);
        }, 500);
      }
    };

    window.addEventListener('openChatbox', handleOpenChat as EventListener);
    
    return () => {
      window.removeEventListener('openChatbox', handleOpenChat as EventListener);
    };
  }, []);

  useEffect(() => {
    const isOnSupportPage = window.location.pathname === '/support';
    if (isOnSupportPage) {
      setHasInitiated(true);
    }
  }, []);

  useEffect(() => {
    if (minimized && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'agent') {
        setUnreadCount(prev => prev + 1);
      }
    } else {
      setUnreadCount(0);
    }
  }, [messages, minimized]);

  useEffect(() => {
    if (open && messages.length === 0 && context) {
      const initialMessage: Message = {
        id: `msg_${Date.now()}`,
        type: "system",
        content: {
          header: "Secure Chat Connected",
          body: "End-to-end encrypted conversation",
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
      
      setMessages([initialMessage]);
      setIsAuthenticated(true);
      
      setTimeout(() => {
        sendAgentMessage(
          `Good ${getTimeOfDay()}, ${context.userName}! I'm ${currentAgent.name}, your banking specialist. I can see you're logged in to your account ending in ${context.accountNumber.slice(-4)}. How may I assist you today?`,
          ["Check Balance", "Recent Transactions", "Transfer Money", "Card Services", "Get Statement"]
        );
      }, 1000);
    }
  }, [open, messages.length, currentAgent.name, context]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  const simulateTyping = (): Promise<void> => {
    return new Promise((resolve) => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        resolve();
      }, 1500);
    });
  };

  const sendUserMessage = (text: string) => {
    const message: Message = {
      id: `msg_${Date.now()}`,
      type: "user",
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, message]);
  };

  const sendAgentMessage = async (text: string, quickReplies: string[] = []) => {
    await simulateTyping();
    
    const message: Message = {
      id: `msg_${Date.now()}`,
      type: "agent",
      content: text,
      timestamp: new Date().toISOString(),
      agent: currentAgent,
      quickReplies: quickReplies
    };
    
    setMessages(prev => [...prev, message]);
    setQuickReplies(quickReplies);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    sendUserMessage(inputText);
    const userInput = inputText.toLowerCase();
    setInputText("");
    
    // Handle user queries based on context
    if (userInput.includes("balance") || userInput.includes("how much")) {
      await handleBalanceRequest();
    } else if (userInput.includes("transfer") || userInput.includes("send money")) {
      await handleTransferRequest();
    } else if (userInput.includes("transaction") || userInput.includes("history") || userInput.includes("activity")) {
      await handleTransactionRequest();
    } else if (userInput.includes("fraud") || userInput.includes("unauthorized") || userInput.includes("scam")) {
      await handleFraudReport();
    } else if (userInput.includes("statement") || userInput.includes("pdf")) {
      await handleStatementRequest();
    } else if (userInput.includes("card") || userInput.includes("debit") || userInput.includes("credit")) {
      await handleCardRequest();
    } else if (userInput.includes("loan") || userInput.includes("mortgage")) {
      await handleLoanRequest();
    } else if (userInput.includes("account") || userInput.includes("details")) {
      await handleAccountDetails();
    } else {
      await handleGeneralQuery(userInput);
    }
  };

  const handleBalanceRequest = async () => {
    await simulateTyping();
    
    if (!context) {
      sendAgentMessage(
        "I'm unable to access your account information at the moment. Please try again later or contact our support team for assistance.",
        ["Try Again", "Contact Support", "Main Menu"]
      );
      return;
    }
    
    const currency = "€";
    
    sendAgentMessage(
      `Here are your current account balances:\n\n💳 Current Account: ${currency}${context.checkingBalance.toFixed(2)}\n💰 Savings Account: ${currency}${context.savingsBalance.toFixed(2)}\n📈 Investment Account: ${currency}${context.investmentBalance.toFixed(2)}\n\nTotal Balance: ${currency}${context.accountBalance.toFixed(2)}\n\nWould you like to see recent transactions or make a transfer?`,
      ["Recent Transactions", "Transfer Money", "Download Statement", "Main Menu"]
    );
  };

  const handleTransactionRequest = async () => {
    await simulateTyping();
    
    if (!context || !context.recentTransactions || context.recentTransactions.length === 0) {
      sendAgentMessage(
        "I couldn't find any recent transactions in your account. This might be because your account is new or there's a temporary issue accessing your transaction history.",
        ["Check Balance", "Try Again", "Contact Support"]
      );
      return;
    }
    
    const recentTransactions = context.recentTransactions.slice(0, 5);
    let transactionsText = "Here are your recent transactions:\n\n";
    
    recentTransactions.forEach((transaction: any, index: number) => {
      const date = new Date(transaction.date).toLocaleDateString();
      const amount = transaction.amount;
      const description = transaction.description || "Transaction";
      const status = transaction.status || "Completed";
      
      transactionsText += `${index + 1}. ${date} - ${description} - ${amount} - ${status}\n`;
    });
    
    transactionsText += `\nYou have ${context.hasPendingTransactions ? 'pending' : 'no pending'} transactions.`;
    
    sendAgentMessage(
      transactionsText,
      ["View More Transactions", "Check Balance", "Download Statement", "Main Menu"]
    );
  };

  const handleTransferRequest = async () => {
    await simulateTyping();
    sendAgentMessage(
      "I can help you transfer money between your accounts or to other beneficiaries. Please select the type of transfer:\n\n• **Internal Transfer** - Between your accounts (Instant & Free)\n• **Local Transfer** - To another bank account (1-2 business days)\n• **International Transfer** - To foreign banks (2-3 business days)\n• **Mobile Transfer** - Send money using phone number (Instant)",
      ["Internal Transfer", "Local Transfer", "International Transfer", "Mobile Transfer", "Main Menu"]
    );
  };

  const handleCardRequest = async () => {
    await simulateTyping();
    
    if (!context || !context.cardDetails) {
      sendAgentMessage(
        "I can help with card services. What would you like to do?",
        ["Block Card", "Report Lost Card", "Change PIN", "Increase Limits", "Main Menu"]
      );
      return;
    }
    
    let cardsText = "I can see the following cards on your account:\n\n";
    
    context.cardDetails.forEach((card, index) => {
      cardsText += `${index + 1}. ${card.type} ending in ${card.lastFour} - ${card.status}\n`;
    });
    
    cardsText += "\nHow can I assist you with your cards?";
    
    sendAgentMessage(
      cardsText,
      ["Block Card", "Report Lost Card", "Change PIN", "Increase Limits", "View Transactions"]
    );
  };

  const handleAccountDetails = async () => {
    await simulateTyping();
    
    if (!context) {
      sendAgentMessage(
        "I'm unable to access your account details at the moment. Please try again later.",
        ["Try Again", "Contact Support", "Main Menu"]
      );
      return;
    }
    
    sendAgentMessage(
      `Here are your account details:\n\n• Account Holder: ${context.userName}\n• Account Number: ${context.accountNumber}\n• Total Balance: €${context.accountBalance.toFixed(2)}\n• Last Activity: ${new Date(context.lastActivity).toLocaleDateString()}\n\nIs there anything specific you'd like to know about your account?`,
      ["Check Balance", "Recent Transactions", "Card Services", "Statement", "Main Menu"]
    );
  };

  const handleFraudReport = async () => {
    await simulateTyping();
    sendAgentMessage(
      "🚨 **Fraud Alert**\n\nI'm sorry to hear about potential fraudulent activity. Your account security is our top priority.\n\n**Immediate Actions:**\n1. I'm temporarily freezing your cards for protection\n2. Our fraud team has been notified\n3. You'll receive new cards within 2-3 business days\n\nPlease review your recent transactions and confirm any unauthorized activity:",
      ["View Recent Transactions", "Speak to Fraud Specialist", "File Official Report", "Cancel Cards"]
    );
  };

  const handleStatementRequest = async () => {
    await simulateTyping();
    const statement: Attachment = {
      id: `stmt_${Date.now()}`,
      type: "document",
      name: `Account_Statement_${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}.pdf`,
      size: "247 KB"
    };
    
    const message: Message = {
      id: `msg_${Date.now()}`,
      type: "agent",
      content: "I've prepared your latest account statement. You can download it securely:",
      attachment: statement,
      timestamp: new Date().toISOString(),
      agent: currentAgent
    };
    
    setMessages(prev => [...prev, message]);
    
    setTimeout(() => {
      sendAgentMessage(
        "Your statement is ready for download. For additional statements or specific date ranges, please let me know.",
        ["Last 3 Months", "Year-to-Date", "Tax Documents", "Done"]
      );
    }, 500);
  };

  const handleLoanRequest = async () => {
    await simulateTyping();
    sendAgentMessage(
      "I can provide information about our loan products:\n\n• **Personal Loan** - Up to €50,000 for any purpose (5.9% APR)\n• **Home Loan** - Competitive rates for property purchase (3.2% APR)\n• **Car Loan** - Finance your vehicle purchase (4.5% APR)\n• **Business Loan** - Grow your business (6.8% APR)\n\nWould you like to know more about any of these options or check your eligibility?",
      ["Check Eligibility", "Calculate EMI", "Apply Now", "Speak to Loan Officer"]
    );
  };

  const handleGeneralQuery = async (query: string) => {
    await simulateTyping();
    
    // Check if query is a greeting
    if (query.includes("hello") || query.includes("hi") || query.includes("hey")) {
      sendAgentMessage(
        `Hello again ${context?.userName || "there"}! How can I assist you further with your banking needs today?`,
        ["Check Balance", "Recent Transactions", "Transfer Money", "Card Services"]
      );
      return;
    }
    
    // Check if query is a thank you
    if (query.includes("thank") || query.includes("thanks")) {
      sendAgentMessage(
        "You're very welcome! Is there anything else I can help you with today?",
        ["Check Balance", "Recent Transactions", "Transfer Money", "No, thank you"]
      );
      return;
    }
    
    sendAgentMessage(
      "I'm here to help with all your banking needs. Here are some things I can assist you with:\n\n📱 **Account Services** - Balance, transactions, statements\n💳 **Card Services** - Block cards, change PIN, limits\n💸 **Transfers & Payments** - Send money, pay bills\n📊 **Investments** - View portfolio, market updates\n🏦 **Loans & Credit** - Check eligibility, apply online\n🔔 **Settings** - Notifications, security, profile\n\nWhat would you like help with today?",
      ["Account Services", "Card Services", "Make Transfer", "View Investments", "Something Else"]
    );
  };

  const handleEndConversation = async () => {
    setConversationStatus("ending");
    
    sendAgentMessage(
      "Before you go, would you mind rating your experience today? Your feedback helps us improve our service.",
      ["⭐⭐⭐⭐⭐ Excellent", "⭐⭐⭐⭐ Good", "⭐⭐⭐ Average", "Skip Rating"]
    );
  };

  const handleRating = async (rating: string | null) => {
    setSatisfactionRating(rating);
    
    await simulateTyping();
    
    const transcriptId = `TRX${Date.now().toString().slice(-8)}`;
    
    const message: Message = {
      id: `msg_${Date.now()}`,
      type: "system",
      content: {
        header: "Conversation Summary",
        body: `Thank you for banking with us, ${context?.userName || "Valued Customer"}.\n\nTranscript ID: ${transcriptId}\nAgent: ${currentAgent.name}\nDuration: ${Math.floor(Math.random() * 10 + 5)} minutes\nRating: ${rating || 'Not rated'}\n\nA copy of this conversation has been sent to your registered email.`,
        actions: ["Download Transcript", "Email Transcript", "Close Chat"]
      },
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, message]);
    
    setConversationStatus("ended");
  };

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentPreview({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type
      });
    }
  };

  const handleQuickReply = (reply: string) => {
    if (reply.includes("rating") || reply.includes("⭐")) {
      handleRating(reply);
    } else if (reply === "Skip Rating") {
      handleRating(null);
    } else if (reply === "Main Menu") {
      handleGeneralQuery("main menu");
    } else {
      setInputText(reply);
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleMinimize = () => {
    setMinimized(!minimized);
    if (!minimized) {
      setUnreadCount(0);
    }
  };

  return (
    <>
      {!open && (
        <button
          className={styles.chatTrigger}
          onClick={() => setOpen(true)}
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
          <span className={styles.pulse}></span>
        </button>
      )}

      {open && (
        <div className={`${styles.chatPopup} ${minimized ? styles.minimized : ''}`}>
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderTop}>
              <div className={styles.agentInfo}>
                <div className={styles.agentAvatar}>
                  {currentAgent.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className={styles.agentDetails}>
                  <h4>{currentAgent.name}</h4>
                  <div className={styles.agentTitle}>{currentAgent.title}</div>
                  <div className={styles.agentId}>ID: {currentAgent.employeeId}</div>
                  <div className={styles.status}>
                    <span className={styles.statusDot}></span>
                    {currentAgent.availability} • {currentAgent.avgResponseTime}
                  </div>
                </div>
              </div>
              <div className={styles.headerActions}>
                <button
                  className={styles.headerBtn}
                  onClick={() => handleQuickReply("Schedule a call")}
                  title="Schedule Call"
                >
                  <Phone size={18} />
                </button>
                <button
                  className={styles.headerBtn}
                  onClick={toggleMinimize}
                  title={minimized ? "Maximize" : "Minimize"}
                >
                  {minimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
                <button
                  className={styles.closeBtn}
                  onClick={() => {
                    if (conversationStatus === "active" && messages.length > 2) {
                      handleEndConversation();
                    } else {
                      setOpen(false);
                      setMessages([]);
                      setIsAuthenticated(false);
                      setConversationStatus("active");
                    }
                  }}
                  aria-label="Close chat"
                >
                  <X size={20} />
                </button>
              </div>
              {minimized && unreadCount > 0 && (
                <div className={styles.unreadBadge}>{unreadCount}</div>
              )}
            </div>
            
            <div className={styles.securityBadge}>
              <span>
                <Shield size={12} /> Encrypted Connection
              </span>
              <span>
                <Clock size={12} /> Session: {sessionId.slice(-8)}
              </span>
            </div>
          </div>

          {!minimized && (
            <>
              {isAuthenticated && (
                <div className={styles.quickActionsBar}>
                  {bankingActions.authenticated.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendUserMessage(action.label)}
                      className={styles.quickActionBtn}
                    >
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.chatBody}>
                <div className={styles.messages}>
                  {messages.length === 0 && (
                    <div className={styles.welcomeMessage}>
                      <div className={styles.welcomeIcon}>🏦</div>
                      <h3>Welcome to Horizon Support</h3>
                      <p>How can we assist you today?</p>
                    </div>
                  )}
                  
                  {messages.map((msg) => (
                    <div key={msg.id}>
                      {msg.type === "system" && typeof msg.content === 'object' && (
                        <div className={styles.systemMessage}>
                          <div className={styles.systemMessageHeader}>{msg.content.header}</div>
                          <div className={styles.systemMessageBody}>{msg.content.body}</div>
                          {msg.content.actions && (
                            <div className={styles.systemActions}>
                              {msg.content.actions.map((action: string, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    if (action === "Close Chat") {
                                      setOpen(false);
                                      setTimeout(() => {
                                        setMessages([]);
                                        setIsAuthenticated(false);
                                        setConversationStatus("active");
                                      }, 500);
                                    } else if (action === "Download Transcript") {
                                      // Handle transcript download
                                      console.log("Download transcript");
                                    } else if (action === "Email Transcript") {
                                      // Handle email transcript
                                      console.log("Email transcript");
                                    }
                                  }}
                                  className={styles.systemActionBtn}
                                >
                                  {action}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {msg.type === "user" && (
                        <div className={styles.userMessage}>
                          <div className={styles.messageText}>{typeof msg.content === 'string' ? msg.content : ''}</div>
                          <div className={styles.timestamp}>{formatTime(msg.timestamp)}</div>
                        </div>
                      )}
                      
                      {msg.type === "agent" && (
                        <div className={styles.agentMessageWrapper}>
                          <div className={styles.agentMessageAvatar}>
                            {msg.agent?.name.split(' ').map(n => n[0]).join('') || 'SA'}
                          </div>
                          <div className={styles.agentMessage}>
                            <div className={styles.agentLabel}>
                              <span>{msg.agent?.name || 'Agent'}</span>
                              <span className={styles.timestamp}>
                                {formatTime(msg.timestamp)}
                              </span>
                            </div>
                            <div className={styles.messageText}>
                              {typeof msg.content === 'string' ? 
                                msg.content.split('\n').map((line, i) => (
                                  <span key={i}>
                                    {line}
                                    <br />
                                  </span>
                                )) : ''}
                            </div>
                            {msg.attachment && (
                              <div className={styles.attachment}>
                                <div className={styles.attachmentInfo}>
                                  <FileText size={16} />
                                  <div>
                                    <div className={styles.attachmentName}>{msg.attachment.name}</div>
                                    <div className={styles.attachmentSize}>{msg.attachment.size}</div>
                                  </div>
                                </div>
                                <button className={styles.downloadBtn}>
                                  <Download size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {msg.quickReplies && msg.quickReplies.length > 0 && (
                        <div className={styles.quickReplies}>
                          {msg.quickReplies.map((reply: string, idx: number) => (
                            <button
                              key={idx}
                              className={styles.quickReplyBtn}
                              onClick={() => handleQuickReply(reply)}
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className={styles.typingIndicator}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {attachmentPreview && (
                  <div className={styles.attachmentPreview}>
                    <div className={styles.attachmentInfo}>
                      <FileText size={16} />
                      <div>
                        <div className={styles.attachmentName}>{attachmentPreview.name}</div>
                        <div className={styles.attachmentSize}>{attachmentPreview.size}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setAttachmentPreview(null)}
                      className={styles.removeBtn}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {conversationStatus !== "ended" && (
                  <div className={styles.inputArea}>
                    <div className={styles.inputWrapper}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAttachment}
                        className={styles.hiddenInput}
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={styles.inputBtn}
                      >
                        <Paperclip size={18} />
                      </button>
                      <button className={styles.inputBtn}>
                        <Camera size={18} />
                      </button>
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Type your message..."
                        aria-label="Chat input"
                      />
                      <button
                        className={styles.sendBtn}
                        onClick={handleSend}
                        disabled={!inputText.trim() || isTyping}
                        aria-label="Send message"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                    
                    <div className={styles.statusBar}>
                      <div className={styles.statusIndicator}>
                        Secure Chat • <span className={styles.verifiedBadge}>✓ Authenticated</span>
                      </div>
                      {conversationStatus === "active" && messages.length > 2 && (
                        <button 
                          onClick={handleEndConversation}
                          className={styles.endConversationBtn}
                        >
                          End Conversation
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {quickReplies.length > 0 && conversationStatus !== "ended" && (
                  <div className={styles.suggestedActions}>
                    <span className={styles.suggestedLabel}>Suggested:</span>
                    {quickReplies.slice(0, 2).map((reply, idx) => (
                      <button
                        key={idx}
                        className={styles.suggestedBtn}
                        onClick={() => handleQuickReply(reply)}
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}