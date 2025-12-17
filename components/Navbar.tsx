import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SearchModal from './SearchModal';

const Navbar: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { cart, toggleCart, settings, toggleWishlistModal, wishlist } = useStore();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <nav className="relative w-full z-50 bg-white/80 backdrop-blur-md border-b border-secondary-200 shadow-sm transition-all duration-300 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between h-full items-center">
            {/* Top Bar Layout */}
            {/* Right Side: Wishlist (RTL Start) */}
            <div className="flex-1 flex justify-start">
              <button
                onClick={toggleWishlistModal}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors relative"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>
            </div>

            {/* Center: Logo */}
            <div className="flex-none absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
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
            </div>

            {/* Left Side: Search (RTL End) */}
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Floating Cart Button - Bottom Left */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleCart}
        className="fixed bottom-6 left-6 z-50 p-3 bg-primary-600 text-white rounded-full shadow-2xl hover:bg-primary-700 hover:shadow-primary-500/40 transition-all border-4 border-white/20 backdrop-blur-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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