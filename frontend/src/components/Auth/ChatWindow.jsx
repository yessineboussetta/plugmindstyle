// ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import './chat.css';
import { FaSmile, FaPaperclip } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWindow() {
  const [messages, setMessages] = useState([
    {
      sender: 'agent',
      content: "Hi there! 👋",
      meta: "Lyro AI Agent – Today, 1:14",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const handleInputChange = (e) => setInput(e.target.value);

  const handleSend = () => {
    if (input.trim()) {
      const userMessage = {
        sender: 'user',
        content: input,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      simulateAgentResponse();
    }
  };

  const simulateAgentResponse = () => {
    setIsTyping(true);
    setTimeout(() => {
      const agentMessage = {
        sender: 'agent',
        content: "You can find our chatbot templates in the Flows menu on the left side. We offer over 35+ ready-to-use templates, including industry-specific FAQ templates that you can customize for your needs.",
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);
    }, 1500);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <AnimatePresence>
      <motion.div
        className="chat-container"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.3 }}
      >
        <div className="chat-window">
          <div className="messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message-bubble ${msg.sender === 'user' ? 'user' : 'agent'}`}
              >
                {index === 0 && (
                  <div className="agent-header">
                    <p>{msg.content}</p>
                    <span className="meta">{msg.meta}</span>
                  </div>
                )}
                {index !== 0 && <p>{msg.content}</p>}
                <div className="timestamp">{msg.timestamp}</div>
              </div>
            ))}
            {isTyping && <div className="typing-indicator">Lyro is typing<span className="dots">...</span></div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="input-area">
            <FaSmile className="icon" />
            <FaPaperclip className="icon" />
            <input
              type="text"
              placeholder="Enter your message..."
              value={input}
              onChange={handleInputChange}
            />
            <button onClick={handleSend}>➤</button>
          </div>
          <div className="powered-by">Powered by SmartAgent</div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}