import React from 'react';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar: React.FC = () => {
  const { cart, toggleCart, settings } = useStore();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <nav className="relative w-full z-50 bg-white/80 backdrop-blur-md border-b border-secondary-200 shadow-sm transition-all duration-300 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between h-full items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              {settings.logoUrl ? (
                <motion.img
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  src={settings.logoUrl}
                  alt={settings.storeName}
                  className="h-10 w-10 rounded-xl object-cover shadow-lg"
                />
              ) : (
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-primary-500/20 shadow-lg"
                >
                  {settings.logoText}
                </motion.div>
              )}
              <span className="text-xl font-bold text-secondary-900 tracking-tight group-hover:text-primary-600 transition-colors">{settings.storeName}</span>
            </Link>

            {/* Links - Hidden */}
            <div className="hidden md:flex gap-8">
              {/* Navigation links removed */}
            </div>

            {/* Empty div to balance flex layout if needed, or just remove */}
            <div className="w-10"></div>
          </div>
        </div>
      </nav>

      {/* Floating Cart Button - Bottom Left */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleCart}
        className="fixed bottom-6 left-6 z-50 p-4 bg-primary-600 text-white rounded-full shadow-2xl hover:bg-primary-700 hover:shadow-primary-500/40 transition-all border-4 border-white/20 backdrop-blur-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white">
            {totalItems}
          </span>
        )}
      </motion.button>
    </>
  );
};

export default Navbar;