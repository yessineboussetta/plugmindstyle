import React, { useState, useEffect } from 'react';
import styles from './EmbeddedChat.module.css';

const detectLanguage = (text) => {
  const fr = /bonjour|salut|merci|comment|aide/i;
  const en = /hello|hi|thanks|help|how/i;
  if (fr.test(text)) return 'fr';
  if (en.test(text)) return 'en';
  return 'en'; // default to English
};

const EmbeddedChat = ({ chatbotId, chatbotName, greetingMessage }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setMessages([
      {
        from: 'bot',
        text: greetingMessage || `Hi! I am ${chatbotName}. How can I assist you today?`,
        time: new Date().toLocaleTimeString(),
      },
    ]);
  }, [chatbotName, greetingMessage]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      from: 'user',
      text: input,
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const lang = detectLanguage(userMessage.text);
    console.log("🌐 Detected language:", lang);

    try {
      const res = await fetch(`http://localhost:8000/chatbot/chat/${chatbotId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          language: lang,
        }),
      });

      const data = await res.json();
      console.log("📥 Full API response:", data);

      let botReply = '';
      if (typeof data.answer === 'string' && data.answer.trim().length > 0) {
        botReply = data.answer.trim();
      } else {
        console.warn("❌ Missing or empty 'answer' in API response");
        botReply = '❌ No valid answer in response.';
      }

      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: '⚠️ Failed to get response from server.',
          time: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  return (
    <div className={styles.chatContainer}>
      {!open && (
        <button className={styles.toggleButton} onClick={() => setOpen(true)} aria-label="Open Chat">
          💬
        </button>
      )}

      {open && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.headerContent}>
              <span className={styles.botIcon}>🤖</span>
              <h3>{chatbotName || 'SmartBot'}</h3>
            </div>
            <button className={styles.closeButton} onClick={() => setOpen(false)}>×</button>
          </div>

          <div className={styles.messagesContainer}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`${styles.messageWrapper} ${msg.from === 'bot' ? styles.botWrapper : styles.userWrapper}`}
              >
                <div className={styles.avatar}>{msg.from === 'bot' ? '🤖' : '🧑'}</div>
                <div className={styles.messageContent}>
                  <div className={`${styles.message} ${msg.from === 'bot' ? styles.botMessage : styles.userMessage}`}>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.text}</pre>
                  </div>
                  <div className={styles.timestamp}>{msg.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.inputContainer}>
            <input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button className={styles.sendButton} onClick={sendMessage}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbeddedChat;
