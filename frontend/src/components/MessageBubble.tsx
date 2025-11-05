import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: Date;
  segmentationMask?: string;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(!isUser);

  useEffect(() => {
    if (isUser) {
      setDisplayedText(message.content);
      return;
    }
    let i = 0;
    const text = message.content;
    setDisplayedText('');
    setIsTyping(true);
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [message.content, isUser]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex gap-4', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center glow-primary">
            <Bot className="w-5 h-5 text-primary" />
          </div>
        </motion.div>
      )}

      <div className={cn('flex flex-col gap-2 max-w-2xl', isUser && 'items-end')}>
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'rounded-lg p-4 border backdrop-blur-sm',
            isUser ? 'bg-primary/10 border-primary/30' : 'bg-card/90 border-border'
          )}
        >
          {/* USER IMAGE */}
          {message.image && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-3"
            >
              <img
                src={message.image}
                alt="Uploaded"
                className="max-w-md rounded border border-border"
              />
            </motion.div>
          )}

          {/* TEXT */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap font-tactical">
            {displayedText}
            {isTyping && (
              <span className="inline-block w-1 h-4 ml-1 bg-primary animate-pulse glow-primary" />
            )}
          </p>

          {/* RESULT FROM /results */}
          {message.segmentationMask && !isTyping && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.3 }}
              className="mt-3"
            >
              <img
                src={message.segmentationMask}
                alt="Result"
                className="max-w-md rounded border border-primary/50"
              />
            </motion.div>
          )}
        </motion.div>

        <span className="text-xs text-muted-foreground px-1 font-mono">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
            <User className="w-5 h-5 text-accent" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MessageBubble;