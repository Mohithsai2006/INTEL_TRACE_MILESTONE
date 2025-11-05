import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import AnimatedBackground from '@/components/AnimatedBackground';

type SystemStatus = 'ACTIVE' | 'IDLE' | 'ANALYSING';

const Index = () => {
  const [status, setStatus] = useState<SystemStatus>('ACTIVE');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col tactical-grid relative">
      <AnimatedBackground />
      <Header status={status} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
        />
        <main className="flex-1 overflow-hidden">
          <ChatInterface 
            key={selectedConversationId} // Force re-render on convo change
            conversationId={selectedConversationId}
            onStatusChange={setStatus}
            onNewConversation={setSelectedConversationId} // To select new convo
          />
        </main>
      </div>
    </div>
  );
};

export default Index;