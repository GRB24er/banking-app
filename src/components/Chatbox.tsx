// src/components/Chatbox.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, Send, User, CheckCircle, Loader2, Phone, Calendar } from "lucide-react";
import styles from "./Chatbox.module.css";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
  isTyping?: boolean;
  quickReplies?: string[];
}

interface ChatContext {
  userName: string;
  userEmail: string;
  accountBalance: number;
  hasPendingTransactions: boolean;
  lastActivity: string;
}

// AI Response Templates
const AI_RESPONSES = {
  greeting: [
    "Hello {name}! I'm your Horizon Bank virtual assistant. How can I help you today?",
    "Welcome back, {name}! I see you're logged into your account. What can I assist you with?",
    "Hi {name}! I'm here to help with your banking needs. What brings you here today?"
  ],
  balance: [
    "I can see your current total balance is {balance}. Would you like a detailed breakdown by account?",
    "Your accounts show a total of {balance}. Is there a specific account you'd like to check?"
  ],
  pendingTransaction: [
    "I notice you have pending transactions. Would you like me to check their status for you?",
    "There are transactions being processed. Shall I provide you with an update?"
  ],
  scheduleCall: [
    "I'd be happy to schedule a call with one of our specialists. Our next available slots are:\n\n📅 Today at 3:00 PM\n📅 Tomorrow at 10:00 AM\n📅 Tomorrow at 2:00 PM\n\nWhich works best for you?",
    "Let me connect you with a specialist. When would be a good time for you? We have availability within the next 24 hours."
  ],
  security: [
    "Your account security is our top priority. For verification, I'll need to ask you a few security questions. Would you prefer to verify via SMS or email?",
    "I understand your concern about security. Your account is protected by 256-bit encryption and 2FA. Would you like to review your security settings?"
  ],
  transfer: [
    "I can help you with transfers. Are you looking to transfer between your own accounts or to an external account?",
    "For transfers, I'll need to know: 1) From which account, 2) To where, and 3) The amount. Shall we start?"
  ],
  help: [
    "I can help you with:\n• Account balances\n• Recent transactions\n• Transfers\n• Bill payments\n• Security settings\n• Scheduling appointments\n\nWhat would you like to do?",
    "Here's what I can assist with:\n✓ Banking transactions\n✓ Account inquiries\n✓ Technical support\n✓ Scheduling calls\n\nWhat do you need help with?"
  ],
  farewell: [
    "Thank you for banking with Horizon, {name}. Have a great day! Remember, I'm here 24/7 if you need assistance.",
    "It was my pleasure helping you today, {name}. Don't hesitate to reach out if you need anything else!"
  ]
};

// Keywords mapping for intent detection
const INTENT_KEYWORDS = {
  balance: ['balance', 'money', 'funds', 'account', 'how much'],
  transfer: ['transfer', 'send', 'move', 'wire', 'payment'],
  transaction: ['transaction', 'pending', 'recent', 'history', 'statement'],
  help: ['help', 'support', 'assist', 'problem', 'issue'],
  call: ['call', 'speak', 'talk', 'agent', 'human', 'representative'],
  security: ['security', 'password', 'hack', 'fraud', 'suspicious', 'safe'],
  greeting: ['hi', 'hello', 'hey', 'good morning', 'good afternoon'],
  farewell: ['bye', 'goodbye', 'thanks', 'thank you', 'exit', 'quit']
};

export default function Chatbox() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<ChatContext | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [hasInitiated, setHasInitiated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [agentName] = useState("Sarah Mitchell");
  const [agentStatus] = useState("Senior Banking Specialist");

  // Fetch user context
  useEffect(() => {
    const fetchContext = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/user/dashboard');
          if (response.ok) {
            const data = await response.json();
            const totalBalance = (data.balances?.checking || 0) + 
                               (data.balances?.savings || 0) + 
                               (data.balances?.investment || 0);
            
            const hasPending = data.recent?.some((t: any) => 
              t.rawStatus === "pending" || t.status === "Pending"
            ) || false;

            setContext({
              userName: data.user?.name || session.user.name || "Guest",
              userEmail: session.user.email,
              accountBalance: totalBalance,
              hasPendingTransactions: hasPending,
              lastActivity: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error fetching context:', error);
        }
      }
    };

    fetchContext();
  }, [session]);

    // Listen for custom events to open the chatbox
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent) => {
      setOpen(true);
      // If the event contains a message, send it automatically
      if (event.detail?.message) {
        setTimeout(() => {
          setInputText(event.detail.message);
          handleSend();
        }, 500);
      }
    };

    window.addEventListener('openChatbox', handleOpenChat as EventListener);
    
    return () => {
      window.removeEventListener('openChatbox', handleOpenChat as EventListener);
    };
  }, []);
  
  
  // Auto-open with welcome message after 5 seconds (only once)
  useEffect(() => {
    if (!hasInitiated && context && !open) {
      const timer = setTimeout(() => {
        setOpen(true);
        setTimeout(() => {
          sendBotMessage(
            `Hello ${context.userName}! 👋 I noticed you're online. I'm ${agentName}, your personal banking assistant. Feel free to ask me anything or click the quick actions below to get started.`,
            ['Check Balance', 'Recent Transactions', 'Schedule a Call', 'Help']
          );
          setHasInitiated(true);
        }, 1000);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [context, hasInitiated, open]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Detect user intent from message
  const detectIntent = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return intent;
      }
    }
    
    return 'help'; // Default intent
  };

  // Check if user is on support page to prevent duplicate
  useEffect(() => {
    const isOnSupportPage = window.location.pathname === '/support';
    if (isOnSupportPage) {
      // Don't auto-open on support page since they have their own trigger
      setHasInitiated(true);
    }
  }, []);

  // Format response with context
  const formatResponse = (template: string): string => {
    if (!context) return template;
    
    return template
      .replace('{name}', context.userName)
      .replace('{balance}', `$${context.accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
      .replace('{email}', context.userEmail);
  };

  // Get AI response based on intent
  const getAIResponse = (intent: string): { text: string; quickReplies?: string[] } => {
    const responses = AI_RESPONSES[intent as keyof typeof AI_RESPONSES];
    if (!responses) return { text: AI_RESPONSES.help[0], quickReplies: ['Check Balance', 'Transfer Money', 'Schedule Call'] };
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    // Add appropriate quick replies based on intent
    let replies: string[] = [];
    switch (intent) {
      case 'greeting':
        replies = ['Check Balance', 'Recent Transactions', 'Transfer Money', 'Help'];
        break;
      case 'balance':
        replies = ['Transaction History', 'Transfer Money', 'Download Statement'];
        break;
      case 'transfer':
        replies = ['Internal Transfer', 'Wire Transfer', 'Schedule Transfer', 'Cancel'];
        break;
      case 'call':
        replies = ['Schedule Now', 'View Available Times', 'Call Immediately'];
        break;
      case 'security':
        replies = ['Enable 2FA', 'Change Password', 'View Login History', 'Report Fraud'];
        break;
      default:
        replies = ['Yes', 'No', 'Tell me more'];
    }
    
    return { text: formatResponse(response), quickReplies: replies };
  };

  // Send bot message with typing effect
  const sendBotMessage = async (text: string, quickReplies?: string[]) => {
    setIsTyping(true);
    
    // Simulate typing delay based on message length
    const typingDelay = Math.min(text.length * 20, 2000);
    
    await new Promise(resolve => setTimeout(resolve, typingDelay));
    
    const botMessage: Message = {
      id: `bot-${Date.now()}`,
      text,
      sender: 'agent',
      timestamp: new Date(),
      quickReplies
    };
    
    setMessages(prev => [...prev, botMessage]);
    setQuickReplies(quickReplies || []);
    setIsTyping(false);
  };

  // Handle user message
  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuickReplies([]);
    
    const intent = detectIntent(inputText);
    const aiResponse = getAIResponse(intent);
    
    setInputText("");
    
    // Special handling for call scheduling
    if (intent === 'call') {
      await sendBotMessage(aiResponse.text, aiResponse.quickReplies);
      
      // Follow up with contact form
      setTimeout(async () => {
        await sendBotMessage(
          "To ensure we call you at the right number, please confirm your phone number on file or provide an alternate number.",
          ['Use number on file', 'Provide new number']
        );
      }, 2000);
    } else if (intent === 'balance' && context) {
      // Provide detailed balance information
      await sendBotMessage(aiResponse.text, aiResponse.quickReplies);
      
      if (context.hasPendingTransactions) {
        setTimeout(async () => {
          await sendBotMessage(
            "⚠️ You have pending transactions that may affect your available balance. Would you like to see details?",
            ['Show Pending', 'Skip']
          );
        }, 1500);
      }
    } else {
      await sendBotMessage(aiResponse.text, aiResponse.quickReplies);
    }
  };

  // Handle quick reply click
  const handleQuickReply = (reply: string) => {
    setInputText(reply);
    handleSend();
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Floating trigger button */}
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

      {/* Chat popup */}
      {open && (
        <div className={styles.chatPopup}>
          <div className={styles.chatHeader}>
            <div className={styles.agentInfo}>
              <div className={styles.agentAvatar}>
                {agentName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h4>{agentName}</h4>
                <small className={styles.status}>
                  <CheckCircle size={12} /> {agentStatus}
                </small>
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
                className={styles.closeBtn}
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>

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
                  <div
                    className={`${styles.message} ${
                      msg.sender === 'user' 
                        ? styles.userMessage 
                        : msg.sender === 'agent'
                        ? styles.agentMessage
                        : styles.systemMessage
                    }`}
                  >
                    {msg.sender === 'agent' && (
                      <div className={styles.agentLabel}>
                        <span>{agentName}</span>
                        <span className={styles.timestamp}>
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    )}
                    <div className={styles.messageText}>{msg.text}</div>
                  </div>
                  
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className={styles.quickReplies}>
                      {msg.quickReplies.map((reply, idx) => (
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

            <div className={styles.inputArea}>
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

            {quickReplies.length > 0 && (
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
        </div>
      )}
    </>
  );
}