import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';

const WishlistSidebar: React.FC = () => {
    const { wishlist, isWishlistOpen, toggleWishlistModal, products, toggleWishlist, addToCart, settings } = useStore();

    const wishlistProducts = products.filter(p => wishlist.includes(p.id));

    return (
        <AnimatePresence>
            {isWishlistOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleWishlistModal}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-[70] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white text-gray-900">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span>المفضلة</span>
                                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {wishlist.length}
                                </span>
                            </h2>
                            <button
                                onClick={toggleWishlistModal}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {wishlistProducts.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">قائمة الأمنيات فارغة</h3>
                                        <p className="text-gray-500 text-sm mt-1">تصفح المنتجات وأضف ما يعجبك هنا</p>
                                    </div>
                                    <button
                                        onClick={toggleWishlistModal}
                                        className="bg-primary-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-700 transition-colors"
                                    >
                                        تصفح المنتجات
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {wishlistProducts.map(product => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={product.id}
                                            className="group flex gap-3 bg-white border border-gray-100 p-2 rounded-xl hover:shadow-md transition-shadow"
                                        >
                                            {/* Image */}
                                            <Link
                                                to={`/product/${product.id}`}
                                                onClick={toggleWishlistModal}
                                                className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden shrink-0"
                                            >
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                            </Link>

                                            {/* Info */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <Link
                                                        to={`/product/${product.id}`}
                                                        onClick={toggleWishlistModal}
                                                        className="font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors"
                                                    >
                                                        {product.name}
                                                    </Link>
                                                    <p className="text-xs text-primary-600 font-medium">{product.price} {settings.currency}</p>
                                                </div>

                                                <div className="flex items-center justify-between gap-2 mt-2">
                                                    <button
                                                        onClick={() => addToCart(product)}
                                                        className="flex-1 bg-gray-900 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                        </svg>
                                                        أضف للسلة
                                                    </button>
                                                    <button
                                                        onClick={() => toggleWishlist(product.id)}
                                                        className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="حذف من المفضلة"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default WishlistSidebar;
