import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';

const Home: React.FC = () => {
  const { products, settings, isLoading } = useStore();
  const [filter, setFilter] = useState('الكل');

  // Categories
  const categories = ['الكل', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = filter === 'الكل' ? products : products.filter(p => p.category === filter);

  // Best Sellers
  const bestSellers = products.filter(p => p.isBestSeller);

  return (
    <div className="bg-gray-50/30 min-h-screen pb-20">
      <SEO
        title="الرئيسية"
        description={`تسوق أفضل المنتجات العصرية من ${settings.storeName}. إلكترونيات، موضة، وأكثر.`}
      />

      {/* 1. Slim Modern Banner */}
      <div className="relative bg-secondary-900 text-white overflow-hidden shadow-lg mb-8">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-secondary-900 via-secondary-900/80 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-right z-10">
            <div className="inline-block px-3 py-1 mb-2 text-xs font-semibold tracking-wider text-primary-300 uppercase bg-primary-900/50 rounded-full border border-primary-700/50">
              {settings.bannerBadge || 'وصل حديثاً'}
            </div>
            <h1 className="text-xl md:text-3xl font-black text-white leading-tight mb-1">
              {settings.bannerTitle || 'عروض حصرية'} في{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary-400 to-primary-200">
                {settings.storeName}
              </span>
            </h1>
            <p className="text-gray-300 text-xs md:text-sm max-w-lg">
              {settings.bannerDescription || 'أفضل المنتجات بجودة عالية وأسعار تنافسية. تسوق الآن واستمتع بالخصومات.'}
            </p>
          </div>
          <div className="flex gap-3 z-10 shrink-0">
            <button
              onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-5 py-2 bg-white text-secondary-900 text-sm font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              {settings.bannerButtonText || 'تصفح المنتجات'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* 2. Best Sellers Section (Featured) */}
        {bestSellers.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-2">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-yellow-500">🔥</span> الأكثر مبيعاً
                </h2>
                <p className="text-sm text-gray-500 mt-1">منتجات يفضلها عملاؤنا حالياً</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {bestSellers.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 3. Main Product Grid with Filters */}
        <section id="shop" className="scroll-mt-24">
          <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-md py-4 -mx-4 px-4 mb-6 border-y border-gray-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-bold text-gray-900">كل المنتجات</h2>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filter === cat
                      ? 'bg-secondary-900 text-white shadow-md transform scale-105'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            <AnimatePresence>
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </AnimatePresence>
          </motion.div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <svg
                  className="animate-spin h-8 w-8 text-primary-600"
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
              </div>
              <h3 className="text-lg font-medium text-gray-900">جاري تحميل المنتجات...</h3>
              <p className="text-gray-500 mt-1">يرجى الانتظار قليلاً</p>
            </div>
          )}

          {!isLoading && filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">لا توجد منتجات</h3>
              <p className="text-gray-500 mt-1">حاول تغيير التصنيف أو البحث عن شيء آخر.</p>
              <button onClick={() => setFilter('الكل')} className="mt-4 text-primary-600 hover:underline">
                عرض كل المنتجات
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
