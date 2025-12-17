import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

const RateOrder: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrderById, addReview, markOrderAsRated, settings } = useStore();
  const [order, setOrder] = useState(getOrderById(orderId || ''));
  const [ratings, setRatings] = useState<{ [productId: string]: { rating: number; comment: string } }>({});
  const [submitted, setSubmitted] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<{ productId: string; star: number } | null>(null);

  useEffect(() => {
    if (orderId) {
      setOrder(getOrderById(orderId));
    }
  }, [orderId, getOrderById]);

  // Initialize ratings for each product
  useEffect(() => {
    if (order) {
      const initialRatings: { [productId: string]: { rating: number; comment: string } } = {};
      order.items.forEach(item => {
        initialRatings[item.id] = { rating: 0, comment: '' };
      });
      setRatings(initialRatings);
    }
  }, [order]);

  const handleRatingChange = (productId: string, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [productId]: { ...prev[productId], rating }
    }));
  };

  const handleCommentChange = (productId: string, comment: string) => {
    setRatings(prev => ({
      ...prev,
      [productId]: { ...prev[productId], comment }
    }));
  };

  const handleSubmit = async () => {
    // Check if at least one product is rated
    const hasRating = Object.values(ratings).some(r => r.rating > 0);
    if (!hasRating) {
      toast.error('يرجى تقييم منتج واحد على الأقل');
      return;
    }

    // Submit reviews for rated products
    for (const [productId, { rating, comment }] of Object.entries(ratings)) {
      if (rating > 0) {
        await addReview({
          productId,
          orderId: order!.id,
          customerName: order!.customer.name,
          rating,
          comment
        });
      }
    }

    // Mark order as rated
    await markOrderAsRated(order!.id);
    setSubmitted(true);
    toast.success('شكراً لتقييمك! 🎉');
  };

  // Order not found
  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <SEO title="طلب غير موجود" />
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">الطلب غير موجود</h1>
          <p className="text-gray-500 mb-6">عذراً، لم نتمكن من العثور على هذا الطلب</p>
          <Link to="/" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all">
            العودة للمتجر
          </Link>
        </div>
      </div>
    );
  }

  // Order not delivered yet
  if (order.status !== 'delivered') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <SEO title="الطلب لم يُوصَّل بعد" />
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">الطلب لم يُوصَّل بعد</h1>
          <p className="text-gray-500 mb-6">يمكنك تقييم الطلب بعد استلامه</p>
          <Link to="/" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all">
            العودة للمتجر
          </Link>
        </div>
      </div>
    );
  }

  // Already rated
  if (order.isRated || submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <SEO title="شكراً لتقييمك" />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">شكراً لتقييمك! 🎉</h1>
          <p className="text-gray-500 mb-6">تقييمك يساعدنا على تحسين خدماتنا</p>
          <Link to="/" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all">
            تصفح المزيد من المنتجات
          </Link>
        </motion.div>
      </div>
    );
  }

  // Rating form
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SEO title="قيّم طلبك" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900">قيّم طلبك</h1>
          <p className="text-gray-500 mt-2">طلب #{order.id.slice(-6).toUpperCase()}</p>
        </div>

        {/* Products to rate */}
        <div className="space-y-4">
          {order.items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                
                {/* Product Info & Rating */}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.price} {settings.currency} × {item.quantity}</p>
                  
                  {/* Star Rating */}
                  <div className="flex items-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(item.id, star)}
                        onMouseEnter={() => setHoveredStar({ productId: item.id, star })}
                        onMouseLeave={() => setHoveredStar(null)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <svg
                          className={`w-8 h-8 transition-colors ${
                            (hoveredStar?.productId === item.id ? star <= hoveredStar.star : star <= ratings[item.id]?.rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    ))}
                    <span className="text-sm text-gray-500 mr-2">
                      {ratings[item.id]?.rating > 0 ? `${ratings[item.id].rating}/5` : 'اختر تقييمك'}
                    </span>
                  </div>
                  
                  {/* Comment */}
                  <textarea
                    placeholder="أضف تعليقك (اختياري)..."
                    value={ratings[item.id]?.comment || ''}
                    onChange={(e) => handleCommentChange(item.id, e.target.value)}
                    className="w-full mt-3 px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          className="w-full mt-6 bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30"
        >
          إرسال التقييم
        </motion.button>
      </motion.div>
    </div>
  );
};

export default RateOrder;
