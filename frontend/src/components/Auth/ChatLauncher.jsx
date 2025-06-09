import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import './chat.css';

export default function ChatLauncher() {
  const [isOpen, setIsOpen] = useState(false);

  const openIcon = '/src/assets/close.png';     // icon to show when chat is open
  const closedIcon = '/src/assets/chatt.png'; // icon to show when chat is closed

  return (
    <>
      {isOpen && <ChatWindow />}
      <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)}>
        <img
          src={isOpen ? openIcon : closedIcon}
          alt="chat toggle"
          className="chat-icon-img"
        />
      </button>
    </>
  );
}
