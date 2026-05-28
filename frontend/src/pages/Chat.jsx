import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

export default function Chat() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setMobileShowChat(true);
  };

  return (
    <div className="flex h-screen bg-ink-900 overflow-hidden">
      <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} w-full md:w-auto flex-shrink-0`}>
        <Sidebar selectedUser={selectedUser} onSelectUser={handleSelectUser} />
      </div>
      <div className={`${mobileShowChat ? 'flex' : 'hidden md:flex'} flex-1 min-w-0`}>
        <ChatWindow selectedUser={selectedUser} onBack={() => setMobileShowChat(false)} />
      </div>
    </div>
  );
}
