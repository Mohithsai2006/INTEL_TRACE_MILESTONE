// src/components/ChatInterface.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Upload, X, Download, Layers, ImagePlus, FileImage,
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

interface ClipResult {
  threatScore: number;
  topThreat: string;
  justification: string;
  topExplanations: { prompt: string; score: number }[];
}

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  segmentationMask?: string;
  createdAt: string;
  conversation: string;
  clipResult?: ClipResult | null;
}

interface ChatInterfaceProps {
  conversationId: string | null;
  onStatusChange?: (status: 'ACTIVE' | 'IDLE' | 'ANALYSING') => void;
  onNewConversation: (id: string) => void;
}

const SOCKET_URL = 'http://localhost:5001';
const API_URL = 'http://localhost:5001/api/conversations';
const BACKEND_URL = 'http://localhost:5001';

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

  // === UPLOAD IMAGE ===
  const uploadImage = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await axios.post(`${BACKEND_URL}/api/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.imageUrl;
  };

  // === SOCKET.IO ===
  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('messageReceived', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      onStatusChange?.('ACTIVE');
      if (messages.length === 0 && msg.role === 'user') {
        onNewConversation(msg.conversation);
      }
    });

    socket.on('newConversation', (convo) => {
      onNewConversation(convo._id);
    });

    socket.on('messageError', (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    });

    return () => { socket.disconnect(); };
  }, [token, onStatusChange, onNewConversation, messages.length, toast]);

  // === LOAD MESSAGES ===
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
      } catch {
        toast({ title: 'Error', description: 'Failed to load history.', variant: 'destructive' });
      }
    };
    fetch();
  }, [conversationId, token, toast]);

  // === AUTO SCROLL ===
  useEffect(() => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const vp = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (vp) vp.scrollTop = vp.scrollHeight;
      }
    }, 100);
  }, [messages]);

  // === SEND MESSAGE ===
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

  // === IMAGE UPLOAD (HTTP) ===
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Too Large', description: 'Max 10MB', variant: 'destructive' });
      return;
    }
    try {
      const imageUrl = await uploadImage(file);
      setUploadedImage(imageUrl);
      setUploadedFileName(file.name);
      toast({ title: 'Uploaded', description: 'Image ready.' });
    } catch {
      toast({ title: 'Upload Failed', description: 'Try again.', variant: 'destructive' });
    }
  };

  // === DRAG & DROP ===
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file || file.size > 10 * 1024 * 1024) {
      toast({ title: 'Too Large', description: 'Max 10MB', variant: 'destructive' });
      return;
    }
    try {
      const imageUrl = await uploadImage(file);
      setUploadedImage(imageUrl);
      setUploadedFileName(file.name);
      toast({ title: 'Uploaded', description: 'Image ready.' });
    } catch {
      toast({ title: 'Upload Failed', description: 'Try again.', variant: 'destructive' });
    }
  };

  // === IMAGE URL HELPER ===
  const getImageUrl = (path: string) => {
    if (!path) return '';
    return path.startsWith('/uploads') ? `${BACKEND_URL}${path}` : path;
  };

  // === VIEWER ===
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
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'Exported', description: 'Session saved.' })} disabled={messages.length === 0} className="gap-2 font-mono text-xs">
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
              messages.map((msg) => (
                <div key={msg._id}>
                  <MessageBubble
                    message={{
                      id: msg._id,
                      role: msg.role,
                      content: msg.content,
                      image: msg.image ? getImageUrl(msg.image) : undefined,
                      segmentationMask: msg.segmentationMask ? getImageUrl(msg.segmentationMask) : undefined,
                      timestamp: new Date(msg.createdAt),
                      clipResult: msg.clipResult,
                    }}
                  />

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

                  {msg.clipResult && (
                    <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-purple-600 text-sm">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-red-400">
                          Threat Score: <span className="text-xl">{msg.clipResult.threatScore.toFixed(1)}</span>/100
                        </p>
                        <p className="text-sm font-mono">Top: {msg.clipResult.topThreat}</p>
                      </div>
                      <p className="mt-2 leading-relaxed whitespace-pre-wrap text-gray-300">
                        {msg.clipResult.justification}
                      </p>
                      {msg.clipResult.topExplanations && msg.clipResult.topExplanations.length > 0 && (
                        <div className="mt-3 text-xs text-gray-500">
                          <p className="font-bold">Top Matches:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {msg.clipResult.topExplanations.map((exp, i) => (
                              <li key={i}>
                                {exp.prompt} — <span className="text-green-400">{exp.score.toFixed(1)}%</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
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
                    <img src={getImageUrl(uploadedImage)} alt="preview" className="h-16 w-16 rounded border border-primary object-cover glow-primary" />
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