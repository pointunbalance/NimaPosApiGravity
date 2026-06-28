import React from 'react';
import { motion } from 'framer-motion';

interface PINDisplayProps {
  pin: string;
  shake: boolean;
  error: string;
  loading: boolean;
  selectedUserId: number | '';
}

export const PINDisplay: React.FC<PINDisplayProps> = ({
  pin,
  shake,
  error,
  loading,
  selectedUserId,
}) => {
  return (
    <motion.div 
      animate={shake ? { x: [0, -12, 12, -12, 12, -6, 6, -3, 3, 0] } : {}}
      transition={{ duration: 0.55, ease: "easeInOut" }}
      className="flex flex-row justify-center gap-[10px] h-8 items-center select-none w-full"
      dir="ltr"
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const isError = shake || (error && error !== 'الرجاء اختيار الموظف');
        
        // Use actual PIN length to determine filled dots
        const effectiveLength = pin.length;
        const isFilled = i < effectiveLength;
        
        // Wave logic for the first 3 active dots (indices 0, 1, 2)
        const isWave1 = isFilled && i === 0;
        const isWave2 = isFilled && i === 1;
        const isWave3 = isFilled && i === 2;
        
        const isCursor = selectedUserId && i === effectiveLength && !shake && !loading;

        let animationTarget: any = {};
        let transitionConfig: any = {};

        if (isError) {
          animationTarget = {
            scale: [1, 1.2, 1],
            backgroundColor: '#ef4444',
            boxShadow: '0 0 12px rgba(239,68,68,0.8)',
          };
          transitionConfig = {
            scale: { type: 'tween', ease: 'easeInOut', duration: 0.4 },
            backgroundColor: { type: 'spring', stiffness: 500, damping: 12 },
            boxShadow: { type: 'spring', stiffness: 500, damping: 12 }
          };
        } else if (isWave1) {
          // 1st active dot: contracting phase (90% scale) with sequential wave
          animationTarget = {
            scale: [0.88, 0.92, 0.88],
            backgroundColor: '#00D2FF',
            boxShadow: '0 0 10px rgba(0,210,255,0.7)',
          };
          transitionConfig = {
            scale: { repeat: Infinity, duration: 1.8, ease: "easeInOut" }
          };
        } else if (isWave2) {
          // 2nd active dot: standard 100% scale rising phase with sequential delay
          animationTarget = {
            scale: [0.97, 1.03, 0.97],
            backgroundColor: '#00D2FF',
            boxShadow: '0 0 10px rgba(0,210,255,0.7)',
          };
          transitionConfig = {
            scale: { repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.3 }
          };
        } else if (isWave3) {
          // 3rd active dot: peak heartbeat phase (120% scale) with breathing symmetrical glow/aura delayed
          animationTarget = {
            scale: [1.16, 1.24, 1.16],
            backgroundColor: '#00D2FF',
            boxShadow: [
              '0 0 6px 1px rgba(0,210,255,0.4)',
              '0 0 18px 5px rgba(0,210,255,0.8)',
              '0 0 6px 1px rgba(0,210,255,0.4)'
            ],
          };
          transitionConfig = {
            scale: { repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.6 },
            boxShadow: { repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.6 }
          };
        } else if (isFilled) {
          // Any other filled dots beyond the first 3
          animationTarget = {
            scale: 1.0,
            backgroundColor: '#00D2FF',
            boxShadow: '0 0 10px rgba(0,210,255,0.6)',
          };
          transitionConfig = {
            type: 'spring', stiffness: 500, damping: 25
          };
        } else if (isCursor) {
          animationTarget = {
            scale: [1, 1.15, 1],
            backgroundColor: ['#152A4A', '#00D2FF', '#152A4A'],
            boxShadow: '0 0 8px rgba(0,210,255,0.3)',
          };
          transitionConfig = {
            scale: { repeat: Infinity, duration: 1.4, ease: "easeInOut" },
            backgroundColor: { repeat: Infinity, duration: 1.4, ease: "easeInOut" }
          };
        } else {
          // Inactive placeholders: flat, solid, neutral placeholders
          animationTarget = {
            scale: 1.0,
            backgroundColor: '#e2e8f0',
            boxShadow: '0px 0px 0px rgba(0,0,0,0)',
          };
          transitionConfig = {
            type: 'spring', stiffness: 500, damping: 25
          };
        }

        return (
          <motion.div 
            key={i} 
            animate={animationTarget}
            transition={transitionConfig}
            className="w-3.5 h-3.5 rounded-full flex-shrink-0 select-none cursor-default"
          />
        );
      })}
    </motion.div>
  );
};
