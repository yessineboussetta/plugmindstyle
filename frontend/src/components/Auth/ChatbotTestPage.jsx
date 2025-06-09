import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import EmbeddedChat from './EmbeddedChat';
import styles from './ChatbotTestPage.module.css';

const ChatbotTestPage = () => {
  const { id } = useParams();
  const [isChatVisible, setIsChatVisible] = useState(false);

  return (
    <div className={styles.testPageContainer}>
      <div className={styles.header}>
        <h1>Chatbot Test Environment</h1>
        <p>
          This is a test environment for your chatbot. You can interact with it just like a user would on your website.
        </p>
      </div>
      
      <div className={styles.contentWrapper}>
        <div className={styles.agentListSection}>
          {/* Agent list will be rendered here */}
        </div>
        
        <div className={styles.chatSection}>
          {!isChatVisible ? (
            <button 
              className={styles.startChatButton}
              onClick={() => setIsChatVisible(true)}
            >
              Start Testing Chatbot
            </button>
          ) : (
            <div className={styles.chatContainer}>
              <div className={styles.chatHeader}>
                <h3>Chat Test Window</h3>
                <button 
                  className={styles.closeChatButton}
                  onClick={() => setIsChatVisible(false)}
                >
                  Close Chat
                </button>
              </div>
              <EmbeddedChat 
                chatbotId={id} 
                chatbotName="Test Chatbot"
                defaultOpen={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatbotTestPage; 