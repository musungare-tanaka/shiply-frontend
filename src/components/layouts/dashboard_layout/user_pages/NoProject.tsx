import { PlusCircle } from "lucide-react";
import { motion } from "framer-motion";

interface NoProjectProps {
  onCreate: () => void;
}

// Animated SVG Veins Component
const AnimatedVeins = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="w-full h-full opacity-40"
        viewBox="0 0 400 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="veinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="rgb(59, 130, 246)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.2" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.path
          d="M 200 50 Q 150 120 180 200 T 200 350"
          stroke="url(#veinGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
        />
      </svg>
    </div>
  );
};

const NoProject = ({ onCreate }: NoProjectProps) => {
  return (
    <div className="app-empty-state">
      <AnimatedVeins />

      <motion.div
        className="app-empty-state-card px-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="app-empty-state-icon">
          <PlusCircle className="h-10 w-10" strokeWidth={1.5} />
        </div>

        <h2 className="mb-3 text-3xl font-light tracking-tight">
          No Projects Yet
        </h2>

        <p className="app-muted mb-8 text-base leading-relaxed">
          Start building something remarkable. Create your first project and bring your ideas to life.
        </p>

        <motion.button
          onClick={onCreate}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="app-button-primary inline-flex px-6 py-3 shadow-md hover:shadow-lg"
        >
          <PlusCircle size={18} />
          Create Project
        </motion.button>
      </motion.div>
    </div>
  );
};

export default NoProject;
