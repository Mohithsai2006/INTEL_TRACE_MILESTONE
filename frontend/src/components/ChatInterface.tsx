// src/components/ChatInterface.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Upload,
  X,
  Download,
  Layers,
  ImagePlus,
  FileImage,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import MessageBubble from './MessageBubble';
import SegmentationViewer from './SegmentationViewer';
import { useAuth } from '@/context/AuthContext';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  createdAt: string;
  segmentationMask?: string;
  conversation: string;
}
interface ChatInterfaceProps {
  conversationId: string | null;
  onStatusChange?: (status: 'ACTIVE' | 'IDLE' | 'ANALYSING') => void;
  onNewConversation: (id: string) => void;
}

const SOCKET_URL = 'http://localhost:5001';
const API_URL = 'http://localhost:5001/api/conversations';
const BACKEND_URL = 'http://localhost:5001';

interface MessageBubbleProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: Date;
  segmentationMask?: string;
}

const ChatInterface = ({
  conversationId,
  onStatusChange,
  onNewConversation,
}: ChatInterfaceProps) => {
  const { toast } = useToast();
  const { token } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [intelMode, setIntelMode] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerData, setViewerData] = useState<{ original: string; mask: string } | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('messageReceived', (newMessage: Message) => {
      setMessages((prev) => [...prev, newMessage]);
      onStatusChange?.('ACTIVE');
      if (messages.length === 0 && newMessage.role === 'user') {
        onNewConversation(newMessage.conversation);
      }
    });

    socket.on('newConversation', (newConvo) => {
      onNewConversation(newConvo._id);
    });

    socket.on('messageError', (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      onStatusChange?.('ACTIVE');
    });

    socket.on('connect_error', (err) => {
      toast({ title: 'Connection Error', description: 'Server not running.', variant: 'destructive' });
    });

    return () => { socket.disconnect(); };
  }, [token, onStatusChange, onNewConversation, messages.length, toast]);

  useEffect(() => {
    const fetch = async () => {
      if (!conversationId || !token) {
        setMessages([]);
        return;
      }
      try {
        const { data } = await axios.get(`${API_URL}/${conversationId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(data);
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load history.', variant: 'destructive' });
      }
    };
    fetch();
  }, [conversationId, token, toast]);

  useEffect(() => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const vp = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (vp) vp.scrollTop = vp.scrollHeight;
      }
    }, 100);
  }, [messages]);

  const handleSend = () => {
    if ((!inputValue.trim() && !uploadedImage) || !socketRef.current) return;
    onStatusChange?.('ANALYSING');
    socketRef.current.emit('sendMessage', {
      content: inputValue,
      image: uploadedImage,
      conversationId,
    });
    setInputValue('');
    setUploadedImage(null);
    setUploadedFileName(null);
  };

  const handleExport = () => {
    toast({ title: 'Exported', description: 'Session saved.' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Too Large', description: 'Max 10MB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      setUploadedFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file || file.size > 10 * 1024 * 1024) {
      toast({ title: 'Too Large', description: 'Max 10MB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      setUploadedFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const getImageUrl = (path: string) => {
    if (path.startsWith('data:')) return path;
    return `${BACKEND_URL}${path}`;
  };

  const openSegmentationViewer = (original: string, mask: string) => {
    setViewerData({ original: getImageUrl(original), mask: getImageUrl(mask) });
    setViewerOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {viewerOpen && viewerData && (
          <SegmentationViewer
            originalImage={viewerData.original}
            segmentationMask={viewerData.mask}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full">
        <div className="border-b border-border bg-card/30 backdrop-blur-sm px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="intel-mode" checked={intelMode} onCheckedChange={setIntelMode} />
                <Label htmlFor="intel-mode" className="text-xs font-mono cursor-pointer">
                  <Layers className="w-3 h-3 inline mr-1" />
                  INTEL MODE
                </Label>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={messages.length === 0}
              className="gap-2 font-mono text-xs"
            >
              <Download className="w-3 h-3" />
              EXPORT SESSION
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
                <div className="inline-block p-4 rounded-lg bg-card border border-border mb-4 glow-primary">
                  <Upload className="w-12 h-12 text-primary mx-auto" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-2 tracking-wide">
                  IntelTrace Surveillance Assistant
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto font-tactical">
                  Upload satellite or drone imagery and describe what you're looking for.
                </p>
              </motion.div>
            ) : (
              messages.map((msg) => {
                const props: MessageBubbleProps = {
                  id: msg._id,
                  role: msg.role,
                  content: msg.content,
                  image: msg.image ? getImageUrl(msg.image) : undefined,
                  segmentationMask: msg.segmentationMask ? getImageUrl(msg.segmentationMask) : undefined,
                  timestamp: new Date(msg.createdAt),
                };
                return (
                  <div key={msg._id}>
                    <MessageBubble message={props} />
                    {msg.segmentationMask && msg.image && (
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 font-mono text-xs"
                          onClick={() => openSegmentationViewer(msg.image!, msg.segmentationMask!)}
                        >
                          <Layers className="w-4 h-4" />
                          VIEW_OVERLAY
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border bg-card">
          <div className="max-w-4xl mx-auto p-4">
            <AnimatePresence>
              {uploadedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-3 p-3 bg-sidebar border border-primary/30 rounded-lg inline-flex items-center gap-3"
                >
                  <div className="relative">
                    <img src={uploadedImage} alt="preview" className="h-16 w-16 rounded border border-primary object-cover glow-primary" />
                    <div className="absolute -top-1 -left-1 p-1 rounded-full bg-primary">
                      <FileImage className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-mono text-foreground truncate max-w-[200px]">{uploadedFileName || 'Image'}</p>
                    <p className="text-xs text-muted-foreground font-mono">[READY_FOR_ANALYSIS]</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:bg-destructive/20"
                    onClick={() => { setUploadedImage(null); setUploadedFileName(null); }}
                  >
                    <X className="h-4 h-4 text-destructive" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className={`relative flex gap-2 transition-all ${isDragging ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {isDragging && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10 backdrop-blur-sm"
                >
                  <div className="text-center">
                    <ImagePlus className="w-12 h-12 text-primary mx-auto mb-2 glow-primary" />
                    <p className="font-mono text-sm text-primary font-bold">[DROP_IMAGE_HERE]</p>
                  </div>
                </motion.div>
              )}

              <div className="relative flex-1">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Describe what you're looking for in the imagery..."
                  className="min-h-[60px] pr-12 resize-none bg-background border-border focus:border-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <label htmlFor="image-upload" className="absolute bottom-3 right-3 cursor-pointer">
                  <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Upload className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </label>
              </div>

              <Button
                onClick={handleSend}
                size="icon"
                className="h-[60px] w-[60px] bg-primary hover:bg-primary/90 glow-primary"
                disabled={(!inputValue.trim() && !uploadedImage) || !socketRef.current}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatInterface;