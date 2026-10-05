import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot } from 'lucide-react';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your SmartQueue AI Assistant. How can I help you save time today?", sender: "ai" }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = { id: Date.now(), text: inputValue, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: "I'm a demo assistant for now. But I'll be able to predict queue times and book appointments for you soon!",
        sender: "ai"
      }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9000]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-20 left-0 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[450px]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">SmartQueue AI</h4>
                  <p className="text-[10px] text-primary-100 uppercase tracking-widest">Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.sender === 'user' 
                        ? 'bg-primary-600 text-white rounded-tr-sm' 
                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </motion.div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..." 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim()}
                className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 transition-colors flex-shrink-0 shadow-md shadow-primary-500/20"
              >
                <Send className="w-4 h-4 ml-1" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full shadow-lg shadow-primary-600/30 flex items-center justify-center text-white hover:shadow-xl hover:shadow-primary-600/40 transition-all"
      >
        <Sparkles className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180 scale-0' : 'rotate-0 scale-100'}`} />
        <X className={`w-6 h-6 absolute transition-transform duration-300 ${isOpen ? 'rotate-0 scale-100' : '-rotate-180 scale-0'}`} />
      </motion.button>
    </div>
  );
};

export default AIAssistant;
