import { useState, useRef } from 'react';
import { Shield, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import NavigationDrawer from './NavigationDrawer';

type SystemStatus = 'ACTIVE' | 'IDLE' | 'ANALYSING';

interface HeaderProps {
  status?: SystemStatus;
}

const Header = ({ status = 'ACTIVE' }: HeaderProps) => {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleSound = () => {
    if (!audioRef.current) {
      // Create a simple ambient sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 60;
      gainNode.gain.value = 0.02;
      
      oscillator.start();
      
      audioRef.current = { context: audioContext, oscillator, gainNode } as any;
      setSoundEnabled(true);
    } else {
      if (soundEnabled) {
        (audioRef.current as any).gainNode.gain.value = 0;
        setSoundEnabled(false);
      } else {
        (audioRef.current as any).gainNode.gain.value = 0.02;
        setSoundEnabled(true);
      }
    }
  };

  const getStatusColor = (status: SystemStatus) => {
    switch (status) {
      case 'ANALYSING':
        return 'border-accent/50 text-accent';
      case 'IDLE':
        return 'border-muted-foreground/50 text-muted-foreground';
      default:
        return 'border-primary/50 text-primary';
    }
  };

  const getStatusDot = (status: SystemStatus) => {
    switch (status) {
      case 'ANALYSING':
        return 'bg-accent';
      case 'IDLE':
        return 'bg-muted-foreground';
      default:
        return 'bg-primary';
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-6">
      <div className="flex items-center gap-4 flex-1">
        <NavigationDrawer />
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/30 glow-primary">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold tracking-wider">IntelTrace</h1>
            <p className="text-xs text-muted-foreground font-tactical">Reasoning-Based Tactical Surveillance</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSound}
          className="hover:bg-sidebar-accent relative"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-primary" />
          ) : (
            <VolumeX className="w-5 h-5 text-muted-foreground" />
          )}
          {soundEnabled && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
        </Button>

        <Badge variant="outline" className={`gap-1.5 font-mono text-xs tracking-wider ${getStatusColor(status)}`}>
          <div className={`w-2 h-2 rounded-full ${getStatusDot(status)} ${status === 'ANALYSING' ? 'animate-pulse' : ''}`} />
          [{status}]
        </Badge>
        
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <AlertCircle className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
};

export default Header;
