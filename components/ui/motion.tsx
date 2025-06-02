"use client";

import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

type MotionDivProps = Omit<HTMLMotionProps<"div">, "children">;

// Fade In animation component
export const FadeIn = ({
  children,
  delay = 0,
  className = "",
  ...props
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
} & MotionDivProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Slide Up animation component
export const SlideUp = ({
  children,
  delay = 0,
  className = "",
  ...props
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
} & MotionDivProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Staggered children animation
export const StaggerContainer = ({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
} & MotionDivProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Staggered item
export const StaggerItem = ({
  children,
  index = 0,
  className = "",
  ...props
}: {
  children: ReactNode;
  index?: number;
  className?: string;
} & MotionDivProps) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
          opacity: 1,
          y: 0,
          transition: {
            delay: i * 0.1,
            duration: 0.5,
            type: "spring",
            stiffness: 100,
            damping: 15
          }
        }),
        exit: { opacity: 0, y: 20 }
      }}
      custom={index}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Page transition wrapper
export const PageTransition = ({ children }: { children: ReactNode }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Hover card animation
export const HoverCard = ({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
} & MotionDivProps) => {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}; 