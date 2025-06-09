// embed-widget.jsx
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import EmbeddedChat from './components/Auth/EmbeddedChat';
import './components/Auth/EmbeddedChat.module.css';

async function renderChat() {
  const targetDiv = document.querySelector('[data-chatbot-id]');
  const chatbotId = targetDiv?.getAttribute('data-chatbot-id');

  if (!chatbotId) return;

  const container = document.createElement('div');
  container.id = 'smartagent-widget-root';
  targetDiv.appendChild(container);

  let chatbotName = 'SmartBot';
  let greetingMessage = 'Hi! I am SmartBot. How can I assist you today?';

  try {
    const res = await fetch(`http://localhost:8000/chatbots/${chatbotId}`);
    if (res.ok) {
      const data = await res.json();
      chatbotName = data?.chatbot?.name || chatbotName;
      greetingMessage = data?.chatbot?.greeting_message || greetingMessage;
    }
  } catch (e) {
    console.warn('❌ Failed to fetch chatbot info:', e);
  }

  console.log("Fetched Chatbot Name:", chatbotName);
  console.log("Fetched Greeting Message:", greetingMessage);

  console.log("🤖 FINAL chatbot name:", chatbotName);


  const root = ReactDOM.createRoot(container);
  root.render(
    <StrictMode>
      <EmbeddedChat
        chatbotId={chatbotId}
        chatbotName={chatbotName}
        greetingMessage={greetingMessage}
      />
    </StrictMode>
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderChat);
} else {
  renderChat();
}
