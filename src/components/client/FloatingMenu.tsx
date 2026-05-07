'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, MessageSquareMore, ChevronUp } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';

const FloatingMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: <Bot size={20} />, color: 'bg-[#c9a96e]', label: 'AI Chat', href: '#ai' },
    { icon: <FaWhatsapp size={20} />, color: 'bg-[#25D366]', label: 'WhatsApp', href: 'https://wa.me/212600000000' },
    { icon: <FaInstagram size={20} />, color: 'bg-[#E1306C]', label: 'Instagram', href: 'https://instagram.com/' },
    { icon: <FaFacebookF size={20} />, color: 'bg-[#1877F2]', label: 'Facebook', href: 'https://facebook.com/' },
  ];

  return (
    /* Logic d l-blassa:
       - Desktop: bottom-[90px] (Fouq Crisp)
       - Mobile: bottom-[80px] (Hit Crisp f mobile kiy-tsgher chwiya)
    */
    <div className="fixed bottom-[85px] md:bottom-[95px] right-4 md:right-6 z-[999] flex flex-col-reverse items-center gap-3">
      
      {/* Main Trigger Button - Beddelna l-icon l-MessageSquareMore */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white transition-all duration-300 ${
          isOpen ? 'bg-black text-white' : 'bg-[#c9a96e] text-white'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex flex-col items-center"
            >
              <MessageSquareMore size={24} />
              <ChevronUp size={14} className="animate-bounce -mt-1" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Vertical Menu Items */}
      <div className="flex flex-col-reverse gap-3">
        <AnimatePresence>
          {isOpen && actions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.7 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25, 
                delay: i * 0.05 
              }}
            >
              <a
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center ${action.color} text-white rounded-xl shadow-lg group relative border border-white/20`}
              >
                {action.icon}
                
                {/* Tooltip - Makhiy-ban f mobile bach may-mrekhch l-view */}
                <span className="hidden md:block absolute right-16 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                  {action.label}
                </span>
              </a>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FloatingMenu;