import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, cart, settings, wishlist, toggleWishlist } = useStore();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);

  const getReservedQty = (productId: string) =>
    cart.filter(i => i.id === productId).reduce((s, i) => s + i.quantity, 0);

  const remaining = Math.max(0, (product.stock ?? 0) - getReservedQty(product.id));

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding) return;
    setIsAdding(true);

    if (remaining <= 0) {
      toast.error('المنتج نفد من المخزون', { id: `stock-error-${product.id}` });
      setIsAdding(false);
      return;
    }

    if (product.options && product.options.length > 0) {
      toast('يرجى اختيار الخيارات من صفحة المنتج', { icon: 'ℹ️', id: `options-${product.id}` });
      navigate(`/product/${product.id}`);
      setIsAdding(false);
      return;
    }

    addToCart(product);
    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className={`group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 ${product.stock <= 0 ? 'opacity-75 grayscale' : ''}`}
    >
      <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-gray-50">
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center backdrop-blur-[1px]">
            <span className="bg-white text-black font-black px-4 py-2 rounded-lg transform -rotate-6 border-2 border-black">
              نفذت الكمية
            </span>
          </div>
        )}
        {product.stock > 0 && product.salePrice && product.salePrice < product.price && (
          <span className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
            -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
          </span>
        )}
        {product.stock > 0 && product.isBestSeller && !product.salePrice && (
          <span className="absolute top-3 right-3 z-10 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-md shadow-sm">
            مميز
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-3 left-3 z-20 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:scale-110 transition-transform group/heart"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-colors ${wishlist.includes(product.id) ? 'text-red-500 fill-red-500' : 'text-gray-400 group-hover/heart:text-red-500'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={wishlist.includes(product.id) ? 0 : 2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-center object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </Link>
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <p className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
            {product.category}
          </p>
        </div>
        <Link to={`/product/${product.id}`}>
          <h3
            className="text-base font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1"
            title={product.name}
          >
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {product.salePrice && product.salePrice < product.price ? (
              <>
                <span className="text-lg font-bold text-gray-900">{product.salePrice} {settings.currency}</span>
                <span className="text-sm text-gray-400 line-through decoration-red-400">
                  {product.price} {settings.currency}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">{product.price} {settings.currency}</span>
            )}
          </div>
          {product.stock > 0 && (
            <button
              onClick={handleQuickAdd}
              disabled={isAdding}
              className={`bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-all flex items-center justify-center ${isAdding ? 'opacity-75 cursor-not-allowed' : ''}`}
              title="أضف للسلة"
            >
              {isAdding ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div >
  );
};

export default ProductCard;
