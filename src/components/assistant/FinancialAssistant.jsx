import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, AlertCircle, Bot, User, HelpCircle } from 'lucide-react';
import { sendAssistantMessage } from '../../services/aiAssistantService';

export default function FinancialAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);

  const suggestedQuestions = [
    "Explain my financial plan",
    "Why is my cash flow this way?",
    "How can I improve my emergency fund?",
    "How am I progressing toward my goals?",
    "Explain my investment allocation",
    "What happens if I reduce my expenses?"
  ];

  useEffect(() => {
    // Auto-scroll to bottom of conversation
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (messageText) => {
    const text = messageText.trim();
    if (!text) return;
    if (text.length > 2000) {
      setError("Message exceeds length limit of 2000 characters.");
      return;
    }

    // Clear previous error
    setError('');

    // Add user message to conversation list
    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const data = await sendAssistantMessage(text);
      const assistantMsg = {
        sender: 'assistant',
        answer: data.answer,
        intent: data.intent,
        keyPoints: data.key_points || [],
        financialValues: data.financial_values || [],
        disclaimer: data.disclaimer
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("AI assistant query error:", err);
      // Safe structured fallback display on network error
      const fallbackMsg = {
        sender: 'assistant',
        answer: err.response?.data?.detail || "I couldn't generate a reliable explanation right now. Please try again.",
        intent: "general_financial_question",
        keyPoints: [],
        financialValues: [],
        disclaimer: "This information is for educational budgeting and planning purposes and is not financial advice."
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[500px]">
      {/* Sidebar Suggestions */}
      <div className="w-full lg:w-1/4 flex flex-col gap-4">
        <div className="premium-card bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
            <HelpCircle size={16} className="text-teal-600" />
            Suggested Questions
          </h3>
          <p className="text-slate-400 text-xs font-semibold mb-4 leading-relaxed">
            Click any prompt below to ask the assistant about your personal financial situation.
          </p>
          <div className="flex flex-col gap-2.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => !loading && handleSend(q)}
                disabled={loading}
                className="text-left w-full text-slate-600 hover:text-teal-700 bg-white hover:bg-teal-50/30 border border-slate-200/60 hover:border-teal-500/20 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed leading-normal"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col premium-card bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-100/30 overflow-hidden min-h-[550px] max-h-[700px]">
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Bot size={20} className="text-teal-600" />
              AI Financial Assistant
            </h1>
            <p className="text-slate-400 text-[11px] font-semibold mt-0.5">
              Ask questions about your financial plan, goals, savings and investments.
            </p>
          </div>
          <Sparkles className="text-teal-500 animate-pulse" size={18} />
        </div>

        {/* Message Panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-75">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-3">
                <Bot size={24} />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Welcome to Assistant Chat!</h3>
              <p className="text-slate-400 text-xs font-medium max-w-xs leading-relaxed">
                Choose a suggested question on the left or type your query in the box below to begin.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    msg.sender === 'user'
                      ? 'bg-teal-50 border-teal-100 text-teal-600'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>

                {/* Content Bubble */}
                <div className="flex flex-col space-y-2">
                  <div
                    className={`rounded-2xl p-4 text-xs font-semibold leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-teal-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <p>{msg.text}</p>
                    ) : (
                      <div className="space-y-3.5">
                        {/* Main answer text */}
                        <p className="text-slate-800 leading-normal">{msg.answer}</p>

                        {/* Bullet Highlights */}
                        {msg.keyPoints && msg.keyPoints.length > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
                              {msg.keyPoints.map((pt, pIdx) => (
                                <li key={pIdx}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Structured Value Cards */}
                        {msg.financialValues && msg.financialValues.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                            {msg.financialValues.map((fv, fIdx) => (
                              <div
                                key={fIdx}
                                className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col justify-between"
                              >
                                <span className="text-[10px] text-slate-400 block">{fv.label}</span>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                  <span className="text-slate-800 font-extrabold text-sm">{fv.value}</span>
                                  {fv.change && (
                                    <span
                                      className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                                        fv.change.startsWith('+')
                                          ? 'bg-green-50 text-green-600'
                                          : 'bg-red-50 text-red-600'
                                      }`}
                                    >
                                      {fv.change}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Disclaimer rendering below bubble */}
                  {msg.sender === 'assistant' && msg.disclaimer && (
                    <span className="text-[9px] font-bold text-slate-400 leading-normal max-w-sm px-1.5 italic">
                      {msg.disclaimer}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                <Bot size={14} className="animate-spin" />
              </div>
              <div className="bg-white text-slate-400 border border-slate-100 rounded-2xl rounded-tl-none p-4 text-xs font-semibold flex items-center gap-2 shadow-xs">
                <span className="animate-pulse">Analyzing your financial plan...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          {error && (
            <div className="mb-3 text-[11px] font-bold text-red-500 flex items-center gap-1.5 bg-red-50 border border-red-100 p-2.5 rounded-xl">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
              placeholder="Ask about your finances..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl px-4 py-2.5 flex items-center justify-center cursor-pointer transition-all shadow-md shadow-teal-600/10 hover:shadow-teal-700/15 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
