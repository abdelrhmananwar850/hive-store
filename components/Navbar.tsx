import React from 'react';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar: React.FC = () => {
  const { cart, toggleCart, settings } = useStore();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-secondary-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
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

          {/* Links */}
          <div className="hidden md:flex gap-8">
            <Link to="/" className="text-secondary-600 hover:text-primary-600 transition-colors font-medium">الرئيسية</Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleCart}
              className="relative p-2 text-secondary-600 hover:bg-secondary-100 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute top-0 left-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform -translate-x-1/4 -translate-y-1/4 bg-primary-600 rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;