import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, AlertCircle, TrendingUp, PackageSearch } from 'lucide-react';
import { cn } from './Button';

const PREDEFINED_QUESTIONS = [
  {
    id: 'q1',
    icon: AlertCircle,
    text: "Show me products running low on stock",
    response: "You currently have 3 products running low on stock (Quantity < 10). The most critical is 'Mechanical Keyboard (KB-01)' with only 2 left. I've drafted a purchase order to your supplier. Would you like to review it?"
  },
  {
    id: 'q2',
    icon: TrendingUp,
    text: "What is my total revenue today?",
    response: "Based on today's orders, your total revenue is $3,450.00 across 12 transactions. This is a 14% increase compared to yesterday! Your top-selling item today was the 'Ergonomic Mouse'."
  },
  {
    id: 'q3',
    icon: PackageSearch,
    text: "Help me find a specific customer order",
    response: "Sure thing! Just type the customer's name, email, or their Order Reference ID (e.g., ORD-00005) and I'll pull up the full receipt and tracking details for you."
  }
];

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: "Hi there! I'm Ethara AI. I'm currently in demo mode, but here are some examples of how I'll be able to help you manage your inventory:" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleQuestionClick = (question) => {
    if (isTyping) return;

    // Add user message
    const newMessages = [...messages, { id: Date.now(), sender: 'user', text: question.text }];
    setMessages(newMessages);
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: question.response }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 bg-accent-600 text-white rounded-full shadow-glow flex items-center justify-center hover:bg-accent-700 hover:scale-105 transition-all duration-300 z-40 group",
          isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        )}
        aria-label="Open AI Assistant"
      >
        <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
        {/* Notification dot */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-[#f8fafc] rounded-full"></span>
      </button>

      {/* Chat Window */}
      <div 
        className={cn(
          "fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden transition-all duration-500 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-brand-900 p-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center shadow-glow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Ethara AI Assistant</h3>
              <p className="text-xs text-brand-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online (Demo Mode)
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-brand-300 hover:text-white hover:bg-brand-800 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.sender === 'user' ? "justify-end" : "justify-start")}>
              <div 
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                  msg.sender === 'user' 
                    ? "bg-accent-600 text-white rounded-br-sm" 
                    : "bg-white border border-slate-100 text-slate-700 rounded-bl-sm"
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center h-[38px]">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Interactive Bubbles */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Suggested Questions</p>
          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {PREDEFINED_QUESTIONS.map(q => (
              <button
                key={q.id}
                onClick={() => handleQuestionClick(q)}
                disabled={isTyping}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-accent-300 hover:bg-accent-50 transition-all text-sm text-slate-700 font-medium flex items-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="bg-slate-100 text-slate-500 p-1.5 rounded-lg group-hover:bg-accent-100 group-hover:text-accent-600 transition-colors">
                  <q.icon className="w-4 h-4" />
                </div>
                {q.text}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area (Disabled Demo) */}
        <div className="p-3 bg-white border-t border-slate-100 shrink-0 flex gap-2">
          <input 
            type="text" 
            placeholder="AI chat is currently in demo mode..." 
            disabled
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-400 cursor-not-allowed"
          />
          <button 
            disabled
            className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center cursor-not-allowed"
          >
            <Send className="w-4 h-4 -ml-0.5" />
          </button>
        </div>
      </div>
    </>
  );
}
