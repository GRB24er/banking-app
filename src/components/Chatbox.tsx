// src/components/Chatbox.tsx - Professional Version with Authentication
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, Send, User, CheckCircle, Loader2, Phone, Calendar, Minimize2, Maximize2, Shield, Clock, ChevronDown, Paperclip, Camera, Download, FileText, LogIn } from "lucide-react";
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

interface AuthenticatedContext {
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
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [authenticatedContext, setAuthenticatedContext] = useState<AuthenticatedContext | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [hasInitiated, setHasInitiated] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [conversationStatus, setConversationStatus] = useState("active");
  const [attachmentPreview, setAttachmentPreview] = useState<AttachmentPreview | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  // General banking actions for unauthenticated users
  const generalBankingActions = [
    { icon: "🏦", label: "Branch Locator", action: "branch" },
    { icon: "📞", label: "Contact Us", action: "contact" },
    { icon: "💡", label: "Learn Banking", action: "learn" },
    { icon: "🔒", label: "Security Info", action: "security" }
  ];

  // Authenticated user actions
  const authenticatedActions = [
    { icon: "💸", label: "Quick Transfer", action: "transfer" },
    { icon: "📱", label: "Mobile Banking", action: "mobile" },
    { icon: "🔔", label: "Alerts Settings", action: "alerts" },
    { icon: "📈", label: "Investment Options", action: "invest" }
  ];

  // Fetch user context ONLY for authenticated users
  const fetchAuthenticatedContext = useCallback(async () => {
    // IMPORTANT: Check if session exists AND status is authenticated
    if (status === 'authenticated' && session?.user?.email) {
      try {
        const response = await fetch('/api/user/dashboard');
        if (response.ok) {
          const data = await response.json();
          
          const checkingBalance = data.balances?.checking || 0;
          const savingsBalance = data.balances?.savings || 0;
          const investmentBalance = data.balances?.investment || 0;
          const totalBalance = checkingBalance + savingsBalance + investmentBalance;
          
          const recentTransactions = data.recent || [];
          const hasPending = recentTransactions.some((t: any) => 
            t.rawStatus === "pending" || t.status === "Pending"
          );
          
          const accountNumber = data.accountNumber || `****${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
          const cardDetails = data.cards || [
            { type: "Debit Card", lastFour: "4321", status: "Active" },
            { type: "Credit Card", lastFour: "8765", status: "Active" }
          ];
          
          setAuthenticatedContext({
            userName: data.user?.name || session.user.name || "Valued Customer",
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
          setIsAuthenticated(true);
        } else {
          // If API fails, clear context
          setIsAuthenticated(false);
          setAuthenticatedContext(null);
        }
      } catch (error) {
        console.error('Error fetching authenticated context:', error);
        setIsAuthenticated(false);
        setAuthenticatedContext(null);
      }
    } else {
      // User is NOT authenticated - clear any existing context
      setIsAuthenticated(false);
      setAuthenticatedContext(null);
    }
  }, [session, status]);

  // Clear context when session changes
  useEffect(() => {
    if (status === 'unauthenticated') {
      setIsAuthenticated(false);
      setAuthenticatedContext(null);
    } else if (status === 'authenticated') {
      fetchAuthenticatedContext();
    }
  }, [fetchAuthenticatedContext, status]);

  // Initialize chat based on authentication status
  useEffect(() => {
    if (open && messages.length === 0 && status !== 'loading') {
      const initialMessage: Message = {
        id: `msg_${Date.now()}`,
        type: "system",
        content: {
          header: isAuthenticated ? "Secure Chat Connected" : "Welcome to Horizon Banking Support",
          body: isAuthenticated ? "End-to-end encrypted conversation" : "How can we assist you today?",
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
      
      setMessages([initialMessage]);
      
      setTimeout(() => {
        if (isAuthenticated && authenticatedContext) {
          // Personalized greeting for authenticated users
          sendAgentMessage(
            `Good ${getTimeOfDay()}, ${authenticatedContext.userName}! I'm ${currentAgent.name}, your banking specialist. I can see you're logged in to your account ending in ${authenticatedContext.accountNumber.slice(-4)}. How may I assist you today?`,
            ["Check Balance", "Recent Transactions", "Transfer Money", "Card Services", "Get Statement"]
          );
        } else {
          // Generic greeting for unauthenticated users - NO NAME MENTIONED
          sendAgentMessage(
            `Good ${getTimeOfDay()}! I'm ${currentAgent.name} from Horizon Banking. I'm here to help with general banking inquiries, account information, or assist you with logging in. How may I help you today?`,
            ["General Information", "Account Access Help", "Branch Locations", "Contact Support", "Login Help"]
          );
        }
      }, 1000);
    }
  }, [open, messages.length, isAuthenticated, authenticatedContext, status, currentAgent.name]);

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
    
    // Handle authentication-dependent responses
    if (!isAuthenticated) {
      await handleUnauthenticatedQueries(userInput);
    } else {
      await handleAuthenticatedQueries(userInput);
    }
  };

  // Handle queries for unauthenticated users
  const handleUnauthenticatedQueries = async (userInput: string) => {
    if (userInput.includes("login") || userInput.includes("sign in") || userInput.includes("log in")) {
      await handleLoginHelp();
    } else if (userInput.includes("balance") || userInput.includes("account")) {
      await handleAccountAccessRequired();
    } else if (userInput.includes("branch") || userInput.includes("location") || userInput.includes("atm")) {
      await handleBranchLocator();
    } else if (userInput.includes("contact") || userInput.includes("phone") || userInput.includes("email")) {
      await handleContactInformation();
    } else if (userInput.includes("rate") || userInput.includes("interest") || userInput.includes("loan")) {
      await handleGeneralBankingInfo();
    } else if (userInput.includes("help") || userInput.includes("support")) {
      await handleGeneralSupport();
    } else {
      // Never call authenticated handlers for unauthenticated users
      await handleGeneralUnauthenticatedQuery();
    }
  };

  // Handle queries for authenticated users
  const handleAuthenticatedQueries = async (userInput: string) => {
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
    } else {
      await handleGeneralAuthenticatedQuery(userInput);
    }
  };

  // Unauthenticated user handlers
  const handleLoginHelp = async () => {
    await simulateTyping();
    sendAgentMessage(
      "I can help you access your account. Here are the ways to log in:\n\n• **Online Banking** - Visit our website and click 'Login'\n• **Mobile App** - Download the Horizon Banking app\n• **Phone Banking** - Call us at 1-800-HORIZON\n• **In-Person** - Visit any branch with valid ID\n\nDo you need help with a specific login issue?",
      ["Forgot Password", "Account Locked", "Download App", "Call Support", "Visit Branch"]
    );
  };

  const handleAccountAccessRequired = async () => {
    await simulateTyping();
    sendAgentMessage(
      "To access your account information, you'll need to log in first. This ensures your financial data remains secure and private.\n\nWould you like help logging in, or do you have general banking questions I can answer?",
      ["Help Me Login", "Forgot Password", "General Questions", "Contact Support"]
    );
  };

  const handleBranchLocator = async () => {
    await simulateTyping();
    sendAgentMessage(
      "I can help you find our branches and ATMs!\n\n**Main Branch Locations:**\n• Downtown Financial District - 123 Main St\n• Shopping Mall Branch - Westfield Center\n• University Campus - Student Union Building\n• Airport Terminal - International Departures\n\n**ATM Network:** 50,000+ fee-free ATMs nationwide\n\nWould you like directions to a specific location?",
      ["Get Directions", "ATM Locations", "Branch Hours", "Services Available"]
    );
  };

  const handleContactInformation = async () => {
    await simulateTyping();
    sendAgentMessage(
      "Here's how to reach us:\n\n**Phone Support:**\n• General: 1-800-HORIZON (24/7)\n• Fraud Hotline: 1-800-FRAUD-HELP\n• Credit Cards: 1-800-CARD-HELP\n\n**Digital Support:**\n• Live Chat: Available 24/7 (you're here now!)\n• Email: support@horizonbank.com\n• Social Media: @HorizonBank\n\n**In-Person:**\n• 200+ branches nationwide\n• Extended hours at select locations\n\nWhat type of support do you need?",
      ["Phone Support", "Email Support", "Visit Branch", "Social Media"]
    );
  };

  const handleGeneralBankingInfo = async () => {
    await simulateTyping();
    sendAgentMessage(
      "I can provide general banking information:\n\n**Current Rates (as of today):**\n• Savings Account: 2.1% APY\n• 12-Month CD: 4.5% APY\n• Personal Loans: Starting at 5.9% APR\n• Mortgages: Starting at 6.8% APR\n\n**Account Types:**\n• Free Checking with no minimum balance\n• High-yield savings accounts\n• Investment accounts with advisory services\n\nWould you like details about any specific product?",
      ["Savings Accounts", "Checking Accounts", "Loans", "Investments", "Open Account"]
    );
  };

  const handleGeneralSupport = async () => {
    await simulateTyping();
    sendAgentMessage(
      "I'm here to help! As a general support agent, I can assist with:\n\n• Account login help\n• General banking information\n• Product and service details\n• Branch and ATM locations\n• Contact information\n• Basic troubleshooting\n\nFor account-specific questions, you'll need to log in first. What can I help you with today?",
      ["Login Help", "Product Information", "Branch Locations", "Technical Issues"]
    );
  };

  const handleGeneralUnauthenticatedQuery = async () => {
    await simulateTyping();
    sendAgentMessage(
      "I'd be happy to help! As you're not logged in, I can assist with:\n\n• General banking information and rates\n• Account types and features\n• Branch and ATM locations\n• Login assistance\n• Contact information\n• Setting up new accounts\n\nFor specific account details, you'll need to log in first. What would you like to know?",
      ["Login Help", "Account Info", "Branch Locations", "New Account", "Contact Us"]
    );
  };

  // Authenticated user handlers - FIXED CURRENCY TO USD
  const handleBalanceRequest = async () => {
    await simulateTyping();
    
    if (!authenticatedContext) {
      sendAgentMessage("Unable to access your account information. Please try logging in again.");
      return;
    }
    
    // FIXED: Changed currency to USD ($)
    const currency = "$";
    sendAgentMessage(
      `Here are your current account balances:\n\n💳 Checking Account: ${currency}${authenticatedContext.checkingBalance.toFixed(2)}\n💰 Savings Account: ${currency}${authenticatedContext.savingsBalance.toFixed(2)}\n📈 Investment Account: ${currency}${authenticatedContext.investmentBalance.toFixed(2)}\n\nTotal Balance: ${currency}${authenticatedContext.accountBalance.toFixed(2)}`,
      ["Recent Transactions", "Transfer Money", "Download Statement", "Main Menu"]
    );
  };

  const handleTransactionRequest = async () => {
    await simulateTyping();
    
    if (!authenticatedContext?.recentTransactions?.length) {
      sendAgentMessage(
        "I couldn't find any recent transactions in your account.",
        ["Check Balance", "Contact Support"]
      );
      return;
    }
    
    const recentTransactions = authenticatedContext.recentTransactions.slice(0, 5);
    let transactionsText = "Here are your recent transactions:\n\n";
    
    recentTransactions.forEach((transaction: any, index: number) => {
      const date = new Date(transaction.date).toLocaleDateString();
      transactionsText += `${index + 1}. ${date} - ${transaction.description} - ${transaction.amount}\n`;
    });
    
    sendAgentMessage(transactionsText, ["View More", "Check Balance", "Main Menu"]);
  };

  const handleTransferRequest = async () => {
    await simulateTyping();
    sendAgentMessage(
      "I can help you transfer money. Please select the type of transfer:",
      ["Internal Transfer", "Local Transfer", "International Transfer", "Mobile Transfer"]
    );
  };

  const handleCardRequest = async () => {
    await simulateTyping();
    sendAgentMessage(
      "I can help with card services. What do you need?",
      ["Block Card", "Report Lost Card", "Change PIN", "Increase Limits"]
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
      content: "Your statement is ready for download:",
      attachment: statement,
      timestamp: new Date().toISOString(),
      agent: currentAgent
    };
    
    setMessages(prev => [...prev, message]);
  };

  const handleFraudReport = async () => {
    await simulateTyping();
    sendAgentMessage(
      "🚨 **Fraud Alert** - I'm taking immediate action to secure your account. Our fraud team has been notified.",
      ["View Recent Transactions", "Speak to Specialist", "File Report", "Cancel Cards"]
    );
  };

  const handleLoanRequest = async () => {
    await simulateTyping();
    sendAgentMessage(
      "I can provide information about our loan products. Which type interests you?",
      ["Personal Loan", "Home Loan", "Car Loan", "Business Loan", "Check Eligibility"]
    );
  };

  const handleGeneralAuthenticatedQuery = async (query: string) => {
    await simulateTyping();
    // Only use the user's name if they are ACTUALLY authenticated
    if (isAuthenticated && authenticatedContext?.userName) {
      sendAgentMessage(
        `Thanks for your question, ${authenticatedContext.userName}! I can help with all your banking needs:`,
        ["Account Services", "Transfer Money", "Card Services", "View Statements", "Something Else"]
      );
    } else {
      sendAgentMessage(
        `Thanks for your question! I can help with all your banking needs:`,
        ["Account Services", "Transfer Money", "Card Services", "View Statements", "Something Else"]
      );
    }
  };

  const handleQuickReply = (reply: string) => {
    setInputText(reply);
    setTimeout(handleSend, 100);
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

  const handleEndConversation = async () => {
    setConversationStatus("ending");
    sendAgentMessage(
      "Thank you for using Horizon Banking support. Would you like to rate your experience?",
      ["⭐⭐⭐⭐⭐ Excellent", "⭐⭐⭐⭐ Good", "⭐⭐⭐ Average", "Skip Rating"]
    );
  };

  return (
    <>
      {!open && (
        <button
          className={styles.chatTrigger}
          onClick={() => setOpen(true)}
          aria-label="Open chat support"
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
                {!isAuthenticated && (
                  <button
                    className={styles.headerBtn}
                    onClick={() => handleQuickReply("Help me login")}
                    title="Login Help"
                  >
                    <LogIn size={18} />
                  </button>
                )}
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
                <Shield size={12} /> {isAuthenticated ? 'Encrypted Connection' : 'Secure Chat'}
              </span>
              <span>
                <Clock size={12} /> Session: {sessionId.slice(-8)}
              </span>
            </div>
          </div>

          {!minimized && (
            <>
              <div className={styles.quickActionsBar}>
                {(isAuthenticated ? authenticatedActions : generalBankingActions).map((action, idx) => (
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

              <div className={styles.chatBody}>
                <div className={styles.messages}>
                  {messages.length === 0 && (
                    <div className={styles.welcomeMessage}>
                      <div className={styles.welcomeIcon}>🏦</div>
                      <h3>Welcome to Horizon Banking</h3>
                      <p>How can we assist you today?</p>
                    </div>
                  )}
                  
                  {messages.map((msg) => (
                    <div key={msg.id}>
                      {msg.type === "system" && typeof msg.content === 'object' && (
                        <div className={styles.systemMessage}>
                          <div className={styles.systemMessageHeader}>{msg.content.header}</div>
                          <div className={styles.systemMessageBody}>{msg.content.body}</div>
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
                          <div className={styles.agentAvatar}>
                            {currentAgent.name.split(' ').map(n => n[0]).join('')}
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
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAttachmentPreview({
                              name: file.name,
                              size: `${(file.size / 1024).toFixed(1)} KB`,
                              type: file.type
                            });
                          }
                        }}
                        className={styles.hiddenInput}
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={styles.inputBtn}
                        title="Attach file"
                      >
                        <Paperclip size={18} />
                      </button>
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSend()}
                        placeholder={isAuthenticated ? "Type your message..." : "Ask about our banking services..."}
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
                        {isAuthenticated ? (
                          <>Secure Chat • <span className={styles.verifiedBadge}>✔ Authenticated</span></>
                        ) : (
                          <>Public Chat • <span className={styles.verifiedBadge}>🔒 Secure</span></>
                        )}
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