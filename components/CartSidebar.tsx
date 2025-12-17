import React from 'react';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CartSidebar: React.FC = () => {
  const { cart, isCartOpen, toggleCart, removeFromCart, updateQuantity, settings } = useStore();

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] overflow-hidden" dir="rtl">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={toggleCart} 
          />
          
          <div className="absolute inset-y-0 left-0 max-w-full flex">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-r border-gray-100"
            >
              
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">🛒</span> سلة التسوق
                  <span className="text-sm font-medium text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-200">
                    {cart.reduce((a, b) => a + b.quantity, 0)} منتج
                  </span>
                </h2>
                <button onClick={toggleCart} className="p-2 rounded-full hover:bg-gray-200/50 transition-colors text-gray-500">
                  <span className="sr-only">إغلاق</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                       <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">سلتك فارغة!</h3>
                      <p className="text-gray-500 mt-1">يبدو أنك لم تضف أي منتجات بعد.</p>
                    </div>
                    <button onClick={toggleCart} className="mt-4 bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:-translate-y-1">
                      ابدأ التسوق الآن
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-6">
                    {cart.map((item) => (
                      <motion.li 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        key={item.cartItemId} 
                        className="flex gap-4 group"
                      >
                        <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-center object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="text-base font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                              <p className="text-primary-600 font-bold whitespace-nowrap">{(item.price * item.quantity).toFixed(2)} {settings.currency}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {Object.entries(item.selectedOptions).map(([key, val]) => (
                                        <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                            {val}
                                        </span>
                                    ))}
                                </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1">
                              <button 
                                className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
                                onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >-</button>
                              <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                              <button 
                                className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                              >+</button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.cartItemId)}
                              className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-gray-100 px-6 py-6 bg-gray-50/80 backdrop-blur">
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm text-gray-500">
                      <p>المجموع الفرعي</p>
                      <p>{total.toFixed(2)} {settings.currency}</p>
                    </div>
                    <div className="flex justify-between text-lg font-black text-gray-900">
                      <p>الإجمالي</p>
                      <p>{total.toFixed(2)} {settings.currency}</p>
                    </div>
                    <p className="text-xs text-gray-400">الشحن والضرائب تحسب عند الدفع</p>
                  </div>
                  <Link
                    to="/checkout"
                    onClick={toggleCart}
                    className="w-full flex justify-center items-center px-6 py-4 border border-transparent rounded-xl shadow-lg shadow-primary-600/30 text-base font-bold text-white bg-primary-600 hover:bg-primary-700 hover:-translate-y-1 transition-all"
                  >
                    إتمام الطلب الآن
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;