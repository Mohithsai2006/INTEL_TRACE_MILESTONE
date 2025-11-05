import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, Settings, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { cn } from '@/lib/utils';

const API_URL = 'http://localhost:5001/api/conversations';
// const API_URL = 'https://inteltrace-bnam.onrender.com/api/conversations'; // <-- UPDATED

interface Conversation {
  _id: string;
  title: string;
  updatedAt: string;
}

interface SidebarProps {
  selectedConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
}

const Sidebar = ({ selectedConversationId, onSelectConversation }: SidebarProps) => {
  const { logout, token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!token) return; // Don't fetch if no token
      try {
        const { data } = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConversations(data);
      } catch (error) {
        console.error('Failed to fetch conversations', error);
      }
    };
    fetchConversations();
  }, [token]);
  
  // Note: Add a socket listener here to listen for 'newConversation'
  // and update the conversations list in real-time.
  // For simplicity, we'll rely on fetch for now.

  const handleNewAnalysis = () => {
    onSelectConversation(null); // Deselect current to start a new chat
  };

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded bg-primary/10 border border-primary/30 glow-primary">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-wider">IntelTrace</h1>
            <p className="text-xs text-muted-foreground font-tactical">Defence AI Assistant</p>
          </div>
        </div>
        
        <Button 
          className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 font-mono text-xs tracking-wide" 
          size="sm"
          onClick={handleNewAnalysis}
        >
          <Plus className="w-4 h-4" />
          NEW_ANALYSIS
        </Button>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <div className="px-3 py-2 text-xs font-mono text-muted-foreground tracking-wider">
            [RECENT_SESSIONS]
          </div>
          {conversations.map((conv, i) => (
            <motion.button
              key={conv._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "w-full text-left p-3 rounded-lg hover:bg-sidebar-accent transition-colors group",
                selectedConversationId === conv._id && "bg-sidebar-accent border border-primary/50"
              )}
              onClick={() => onSelectConversation(conv._id)}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 mt-0.5 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-tactical font-medium truncate">{conv.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-2 font-mono text-xs" size="sm">
          <Settings className="w-4 h-4" />
          SETTINGS
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2 font-mono text-xs text-destructive/80 hover:text-destructive" size="sm" onClick={logout}>
          <LogOut className="w-4 h-4" />
          LOGOUT
        </Button>
      </div>
    </motion.div>
  );
};

export default Sidebar;