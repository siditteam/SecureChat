import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import NotificationSetup from '../components/NotificationSetup';

export default function Chat() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [initialChatUserId, setInitialChatUserId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // When the app is opened from a push notification the SW navigates to /?chat=<userId>
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatId = params.get('chat');
    if (chatId) {
      setInitialChatUserId(chatId);
      // Clean up URL so refreshing doesn't re-trigger
      navigate('/', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setMobileShowChat(true);
  };

  return (
    <div className="flex h-screen bg-ink-900 overflow-hidden">
      <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} w-full md:w-auto flex-shrink-0`}>
        <Sidebar
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          initialChatUserId={initialChatUserId}
          onInitialChatHandled={() => setInitialChatUserId(null)}
        />
      </div>
      <div className={`${mobileShowChat ? 'flex' : 'hidden md:flex'} flex-1 min-w-0`}>
        <ChatWindow selectedUser={selectedUser} onBack={() => setMobileShowChat(false)} />
      </div>
      <NotificationSetup />
    </div>
  );
}
