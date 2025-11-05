import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Animated Grid Lines */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--primary) / 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '60px 60px'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Glowing Orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, -80, 0],
          y: [0, -60, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Scan Line Effect */}
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-30"
        animate={{
          top: ['0%', '100%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
