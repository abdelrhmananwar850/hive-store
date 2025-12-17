import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { fetchProductById } from '../services/storeService';
import { Product } from '../types';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart, cart, products, settings, getProductReviews } = useStore();
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  // Get reviews for this product
  const productReviews = React.useMemo(() => {
    if (!id) return [];
    return getProductReviews(id);
  }, [id, getProductReviews]);

  // Calculate average rating
  const averageRating = React.useMemo(() => {
    if (productReviews.length === 0) return 0;
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / productReviews.length;
  }, [productReviews]);

  useEffect(() => {
    const loadProduct = async () => {
        if (!id) return;
        
        // 1. Try finding in current context first (fastest)
        const existing = products.find(p => p.id === id);
        if (existing) {
            setProduct(existing);
            if (existing.options && Object.keys(selectedOptions).length === 0) {
                 // Initialize options if not already set
                 const defaults: {[key:string]: string} = {};
                 // Optional: Select first value by default
                 // existing.options.forEach(opt => defaults[opt.name] = opt.values[0]);
                 setSelectedOptions(defaults);
            }
            return;
        }

        const MOCK = (import.meta as any).env?.VITE_MOCK_DATA === 'true';
        if (MOCK) {
            const p = products.find(p => p.id === id) || null;
            setProduct(p);
            if (p && p.options) setSelectedOptions({});
        } else {
            // 2. Fetch from DB if not found
            try {
                const data = await fetchProductById(id);
                setProduct(data || null);
                if (data && data.options) {
                    setSelectedOptions({});
                }
            } catch (err) {
                console.error("Failed to load product", err);
                toast.error("فشل تحميل المنتج");
            }
        }
    };
    loadProduct();
  }, [id, products]);

  useEffect(() => {
    if (product) {
      document.title = product.seoTitle || product.name;
    }
  }, [product]);

  const handleOptionSelect = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
  };

  const getReservedQty = (productId: string) => cart.filter(i => i.id === productId).reduce((s, i) => s + i.quantity, 0);
  const remaining = (p: Product) => Math.max(0, (p.stock ?? 0) - getReservedQty(p.id));

  // Get related products (same category or random if not enough)
  const relatedProducts = React.useMemo(() => {
    if (!product) return [];
    
    // First, get products from same category
    const sameCategory = products.filter(p => 
      p.id !== product.id && 
      p.category === product.category && 
      p.stock > 0
    );
    
    // If not enough, add other products
    const others = products.filter(p => 
      p.id !== product.id && 
      p.category !== product.category && 
      p.stock > 0
    );
    
    // Combine and limit to 4
    return [...sameCategory, ...others].slice(0, 4);
  }, [product, products]);

  useEffect(() => {
    if (product?.barcode && barcodeRef.current && (window as any).JsBarcode) {
      try {
        (window as any).JsBarcode(barcodeRef.current, product.barcode, { format: 'CODE128', displayValue: true, fontSize: 14, height: 60 });
      } catch {}
    }
  }, [product?.barcode]);

  const handleAddToCart = () => {
    if (!product || isAdding) return;
    setIsAdding(true);
    
    if (product.options) {
        const missingOptions = product.options.filter(opt => !selectedOptions[opt.name]);
        if (missingOptions.length > 0) {
            toast.error(`يرجى اختيار: ${missingOptions.map(o => o.name).join(' و ')}`, { id: 'missing-options' });
            setIsAdding(false);
            return;
        }
    }
    if (remaining(product) <= 0) {
      toast.error('عذراً، هذا المنتج غير متوفر حالياً.', { id: 'stock-error' });
      setIsAdding(false);
      return;
    }
    addToCart(product, selectedOptions);
    setTimeout(() => setIsAdding(false), 500);
  };

  if (!product) return <div className="p-12 text-center text-gray-500">جاري التحميل...</div>;

  const isSoldOut = remaining(product) <= 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <SEO 
        title={product.seoTitle || product.name}
        description={product.seoDescription || product.description}
        image={product.image}
        type="product"
      />

      <div className="mb-6">
        <Link to="/" className="text-gray-500 hover:text-primary-600 text-sm flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          العودة للمتجر
        </Link>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl overflow-hidden bg-gray-50 aspect-[4/3] max-h-[400px] relative"
          >
            {isSoldOut && (
               <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                   <motion.span 
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     className="bg-black text-white text-xl font-bold px-6 py-3 rounded-xl border-4 border-double border-white shadow-xl"
                   >
                       نفذت الكمية
                   </motion.span>
               </div>
            )}
            {product.salePrice && product.salePrice < product.price && !isSoldOut && (
               <div className="absolute top-4 right-4 z-10 bg-red-500 text-white font-bold px-3 py-1 rounded-lg shadow-sm">
                 تخفيض
               </div>
            )}
            <img 
              src={product.image} 
              alt={product.name} 
              className={`w-full h-full object-cover object-center ${isSoldOut ? 'grayscale opacity-50' : ''}`}
            />
          </motion.div>
          
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col"
          >
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-2">{product.name}</h1>
            <p className="text-primary-600 font-medium text-lg mb-4">{product.category}</p>
            <div className="flex items-center gap-4 mb-2 text-sm text-gray-500">
              {product.sku && <span className="px-2 py-1 bg-gray-100 rounded">SKU: {product.sku}</span>}
            </div>
            
            <div className="mb-6 flex items-center gap-3">
               {product.salePrice && product.salePrice < product.price ? (
                 <>
                   <span className="text-3xl font-bold text-red-600">{product.salePrice} {settings.currency}</span>
                   <span className="text-xl text-gray-400 line-through">{product.price} {settings.currency}</span>
                 </>
               ) : (
                  <span className="text-3xl font-bold text-gray-900">{product.price} {settings.currency}</span>
               )}
            </div>
            
            <div className="border-t border-gray-100 pt-6 mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-2">الوصف</h3>
              <p className="text-gray-500 leading-relaxed">{product.description}</p>
            </div>
            {product.barcode && (
              <div className="border-t border-gray-100 pt-6 mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2">الباركود</h3>
                <svg ref={barcodeRef}></svg>
              </div>
            )}

            {/* Options */}
            {product.options && product.options.length > 0 && (
                <div className="space-y-4 mb-8">
                    {product.options.map(option => (
                        <div key={option.name}>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">{option.name}</h4>
                            <div className="flex flex-wrap gap-2">
                                {option.values.map(val => (
                                    <button
                                      key={val}
                                      onClick={() => !isSoldOut && handleOptionSelect(option.name, val)}
                                      disabled={isSoldOut}
                                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                                          selectedOptions[option.name] === val
                                          ? 'border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-600 ring-opacity-50'
                                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                      } ${isSoldOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-auto">
              {isSoldOut ? (
                  <button disabled className="w-full px-8 py-4 border border-transparent rounded-xl shadow-none text-lg font-bold text-gray-400 bg-gray-100 cursor-not-allowed">
                    غير متوفر حالياً
                  </button>
              ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className={`w-full flex items-center justify-center px-8 py-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all ${isAdding ? 'opacity-75 cursor-not-allowed scale-95' : 'hover:-translate-y-1'}`}
                  >
                    {isAdding ? (
                        <div className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            جاري الإضافة...
                        </div>
                    ) : 'أضف للسلة'}
                  </button>
              )}
            </div>
            
            <div className="mt-6 flex gap-6 text-sm text-gray-500 justify-center">
               <div className={`flex items-center gap-2 ${isSoldOut ? 'text-red-500' : 'text-green-500'}`}>
                  {isSoldOut ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        الكمية نفذت
                      </>
                  ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        متوفر
                      </>
                  )}
               </div>
               <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                  شحن سريع
               </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reviews Section */}
      {productReviews.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-8 bg-white rounded-2xl p-5 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">تقييمات العملاء</h2>
                <p className="text-sm text-gray-500">{productReviews.length} تقييم</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black text-gray-900">{averageRating.toFixed(1)}</span>
              <svg className="w-6 h-6 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
            {productReviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-600">{review.customerName.charAt(0)}</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{review.customerName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        viewBox="0 0 24 24"
                      >
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">{new Date(review.date).toLocaleDateString('ar-EG')}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">عملاء آخرون اشتروا أيضاً</h2>
              <p className="text-sm text-gray-500">منتجات مشابهة قد تعجبك</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((relatedProduct) => (
              <Link 
                key={relatedProduct.id} 
                to={`/product/${relatedProduct.id}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-square overflow-hidden bg-gray-50">
                  <img 
                    src={relatedProduct.image} 
                    alt={relatedProduct.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-primary-600 transition-colors">
                    {relatedProduct.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{relatedProduct.category}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {relatedProduct.salePrice && relatedProduct.salePrice < relatedProduct.price ? (
                      <>
                        <span className="font-bold text-primary-600">{relatedProduct.salePrice} {settings.currency}</span>
                        <span className="text-xs text-gray-400 line-through">{relatedProduct.price}</span>
                      </>
                    ) : (
                      <span className="font-bold text-gray-900">{relatedProduct.price} {settings.currency}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProductDetails;
