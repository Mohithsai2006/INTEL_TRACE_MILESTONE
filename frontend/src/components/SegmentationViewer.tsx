import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface SegmentationViewerProps {
  originalImage: string;
  segmentationMask: string;
  onClose: () => void;
}

const SegmentationViewer = ({ originalImage, segmentationMask, onClose }: SegmentationViewerProps) => {
  const [opacity, setOpacity] = useState([70]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-card border border-border rounded-lg shadow-elevated max-w-5xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-primary/10 border border-primary/30 glow-primary">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold tracking-wide">Segmentation Analysis</h3>
              <p className="text-xs text-muted-foreground font-mono">[MASK_OVERLAY_VIEWER]</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
            <img
              src={originalImage}
              alt="Original"
              className="w-full h-auto"
            />
            <motion.img
              src={segmentationMask}
              alt="Segmentation mask"
              className="absolute inset-0 w-full h-full object-cover mix-blend-screen"
              style={{ opacity: opacity[0] / 100 }}
            />
          </div>

          <div className="space-y-3 p-4 bg-sidebar border border-sidebar-border rounded-lg">
            <div className="flex items-center justify-between">
              <Label htmlFor="opacity-slider" className="text-sm font-mono text-primary">
                OVERLAY OPACITY
              </Label>
              <span className="text-sm font-mono text-muted-foreground">{opacity[0]}%</span>
            </div>
            <Slider
              id="opacity-slider"
              value={opacity}
              onValueChange={setOpacity}
              min={0}
              max={100}
              step={1}
              className="cursor-pointer"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SegmentationViewer;
