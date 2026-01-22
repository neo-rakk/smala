
import React from 'react';
import { motion } from 'framer-motion';
import { Answer } from '../types';

interface AnswerCardProps {
  index: number;
  answer: Answer;
  revealed: boolean;
}

const AnswerCard: React.FC<AnswerCardProps> = ({ index, answer, revealed }) => {
  return (
    <div className="relative w-full h-12 md:h-28 perspective-1000">
      <motion.div
        initial={false}
        animate={{ rotateX: revealed ? 180 : 0 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 80, damping: 15 }}
        className="relative w-full h-full transform-style-3d shadow-2xl rounded-lg md:rounded-2xl"
      >
        {/* RECTO (Caché) - Style Régie / Luxe */}
        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-900 to-black border-2 md:border-6 border-yellow-600 rounded-lg md:rounded-2xl flex items-center px-3 md:px-6 shadow-2xl">
          <div className="w-8 h-8 md:w-16 md:h-16 rounded-full bg-slate-950 border-2 md:border-6 border-yellow-500 flex items-center justify-center text-yellow-500 font-game text-xl md:text-5xl shadow-[0_0_30px_rgba(234,179,8,0.4)]">
            {index}
          </div>
          <div className="ml-4 md:ml-10 flex-1 h-2 md:h-5 bg-yellow-900/20 rounded-full overflow-hidden relative">
            <motion.div 
              animate={{ x: ["-100%", "300%"] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-0 bg-yellow-500/10 skew-x-[30deg]"
            />
          </div>
        </div>

        {/* VERSO (Révélé) - Style Éclatant TV */}
        <div className="absolute inset-0 backface-hidden bg-white border-2 md:border-8 border-yellow-400 rounded-lg md:rounded-2xl flex items-center justify-between px-4 md:px-12 shadow-[inset_0_0_40px_rgba(0,0,0,0.1)] rotate-x-180 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 md:h-2 bg-gradient-to-r from-yellow-500 via-white to-yellow-500 opacity-50"></div>
          <span className="font-game text-xl md:text-6xl text-slate-900 uppercase truncate pr-4">
            {answer.text}
          </span>
          <div className="h-full flex items-center border-l-2 md:border-l-8 border-slate-100 pl-4 md:pl-12">
            <span className="font-game text-2xl md:text-8xl text-red-600 drop-shadow-sm">{answer.points}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnswerCard;
