import React from 'react';

export default function TestEmbed() {
  const chatbotId = 137; // Replace with the actual chatbot ID to test

  return (
    <div style={{ padding: '2rem', background: '#f9fafb', minHeight: '100vh' }}>
      <h1 style={{ color: '#0f172a' }}>Chatbot Plugin Test Page</h1>
      <p>This page simulates what a user would see when embedding the chatbot on their own website using the plugin or iframe.</p>

      <div style={{ marginTop: '2rem', border: '1px solid #ccc', borderRadius: '12px', overflow: 'hidden' }}>
        <iframe
          src={`http://localhost:8000/chatbot/embed/${chatbotId}`}
          width="100%"
          height="600px"
          style={{ border: 'none' }}
          title="SmartAgent Chatbot"
        />
      </div>
    </div>
  );
}
