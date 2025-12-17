import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';

const Checkout: React.FC = () => {
  const { cart, clearCart, discountCodes, addOrder, settings } = useStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', phone2: '', address: '', city: '' });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - (subtotal * (appliedDiscount / 100));

  const applyDiscount = () => {
    const code = discountCodes.find(d => d.code === discountInput && d.isActive);
    if (code) {
      setAppliedDiscount(code.percentage);
      toast.success(`تم تطبيق خصم ${code.percentage}% بنجاح!`);
    } else {
      toast.error('كود الخصم غير صحيح أو منتهي الصلاحية');
      setAppliedDiscount(0);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate Payment Processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add Order to "Backend"
    addOrder({
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      items: [...cart],
      total: total,
      discountApplied: appliedDiscount,
      date: new Date().toISOString(),
      status: 'pending',
      customer: {
        name: formData.name || 'عميل',
        email: '',
        phone: formData.phone,
        phone2: formData.phone2,
        address: formData.address,
        city: formData.city
      }
    });

    setLoading(false);
    setStep(2);
    clearCart();
    window.scrollTo(0,0);
  };

  if (step === 2) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto px-4 py-16 text-center"
      >
        <SEO title="تم تأكيد الطلب" />
        <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="text-4xl font-black text-secondary-900 mb-4">تم تأكيد الطلب بنجاح!</h2>
        <p className="text-xl text-gray-500 mb-8 max-w-lg mx-auto">شكراً لطلبك. سيصلك بريد إلكتروني بتفاصيل الطلب ورقم التتبع قريباً.</p>
        <Link to="/" className="inline-block bg-primary-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-primary-700 hover:shadow-lg hover:-translate-y-1 transition-all">
          العودة للمتجر
        </Link>
      </motion.div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
         <h2 className="text-2xl font-bold text-secondary-900">سلتك فارغة</h2>
         <Link to="/" className="mt-4 inline-block text-primary-600 font-medium hover:underline">ابدأ التسوق</Link>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <SEO title="إتمام الطلب" description="أكمل طلبك الآن من Hive Store بخطوات آمنة وسهلة." />
      <h1 className="text-3xl font-black text-secondary-900 mb-8 flex items-center gap-3">
        <span className="bg-primary-100 text-primary-600 p-2 rounded-xl">
           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
        </span>
        إتمام الطلب
      </h1>
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
        {/* Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handlePlaceOrder} className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
                 <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">1</span>
                 معلومات الاتصال والشحن
              </h2>
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">الاسم الكامل</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-primary-500 focus:border-primary-500 py-3" placeholder="الاسم كما يظهر في الهوية" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-primary-500 focus:border-primary-500 py-3" placeholder="05xxxxxxxx" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">رقم هاتف آخر (اختياري)</label>
                  <input type="tel" value={formData.phone2} onChange={e => setFormData({...formData, phone2: e.target.value})} className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-primary-500 focus:border-primary-500 py-3" placeholder="رقم واتساب أو بديل" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">العنوان</label>
                  <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-primary-500 focus:border-primary-500 py-3" placeholder="الحي، الشارع، رقم المبنى" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">المدينة</label>
                  <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-primary-500 focus:border-primary-500 py-3" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
                 <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">2</span>
                 طريقة الدفع
              </h2>
               <div className="space-y-4">
                  {/* Payment Method Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        paymentMethod === 'cash' 
                          ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600 ring-opacity-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === 'cash' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${paymentMethod === 'cash' ? 'text-primary-700' : 'text-gray-900'}`}>الدفع عند الاستلام</p>
                        <p className="text-xs text-gray-500">ادفع كاش للمندوب</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        paymentMethod === 'card' 
                          ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600 ring-opacity-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === 'card' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${paymentMethod === 'card' ? 'text-primary-700' : 'text-gray-900'}`}>بطاقة ائتمان</p>
                        <p className="text-xs text-gray-500">فيزا / ماستركارد</p>
                      </div>
                    </button>
                  </div>

                  {/* Cash Payment Info */}
                  {paymentMethod === 'cash' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-green-800">الدفع نقداً عند الاستلام</p>
                          <p className="text-sm text-green-700 mt-1">سيتم تحصيل المبلغ من المندوب عند توصيل الطلب. يرجى تجهيز المبلغ المطلوب.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card Payment - Disabled/Coming Soon */}
                  {paymentMethod === 'card' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-gray-700">قريباً</p>
                          <p className="text-sm text-gray-500 mt-1">الدفع بالبطاقة سيكون متاحاً قريباً. حالياً يمكنك الدفع عند الاستلام.</p>
                        </div>
                      </div>
                    </div>
                  )}
               </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || paymentMethod === 'card'}
              className={`w-full mt-6 bg-primary-600 border border-transparent rounded-xl shadow-lg py-4 px-4 text-lg font-bold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-75 cursor-wait' : ''} ${paymentMethod === 'card' ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'}`}
            >
              {loading ? (
                 <>
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   جاري المعالجة...
                 </>
              ) : (
                 `تأكيد الطلب - ${total.toFixed(2)} ${settings.currency}`
              )}
            </button>
            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1 mt-3">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               {paymentMethod === 'cash' ? 'الدفع عند الاستلام' : 'بياناتك مشفرة وآمنة'}
            </p>
          </form>
        </div>

        {/* Order Summary */}
        <div className="mt-10 lg:mt-0 lg:col-span-5">
          <div className="sticky top-24">
            <h2 className="text-lg font-bold text-secondary-900 mb-4">ملخص الطلب</h2>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto custom-scrollbar">
                {cart.map((item) => (
                  <li key={item.cartItemId} className="flex py-4 px-4 sm:px-6 hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-center object-cover" />
                    </div>
                    <div className="mr-4 flex-1 flex flex-col justify-center">
                      <div className="flex justify-between">
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                          <p className="text-sm font-bold text-gray-900">{item.price} {settings.currency}</p>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{item.category}</p>
                       {/* Selected Options Display */}
                       {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                              {Object.entries(item.selectedOptions).map(([key, val]) => (
                                  <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                      {val}
                                  </span>
                              ))}
                          </div>
                      )}
                      <p className="mt-1 text-xs text-gray-500">الكمية: {item.quantity}</p>
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="px-4 py-6 bg-gray-50 border-t border-gray-100">
                 <label className="block text-sm font-bold text-gray-700 mb-2">هل لديك كود خصم؟</label>
                 <div className="flex gap-2">
                   <input 
                     type="text" 
                     value={discountInput}
                     onChange={(e) => setDiscountInput(e.target.value)}
                     className="flex-1 rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2 border"
                     placeholder="أدخل الكود هنا"
                   />
                   <button onClick={applyDiscount} type="button" className="bg-secondary-800 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-secondary-900 transition-colors shadow-lg">تطبيق</button>
                 </div>
              </div>

              <dl className="border-t border-gray-100 py-6 px-4 space-y-4 sm:px-6 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">المجموع الفرعي</dt>
                  <dd className="text-sm font-bold text-gray-900">{subtotal.toFixed(2)} {settings.currency}</dd>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex items-center justify-between text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                    <dt className="text-sm font-bold flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                        خصم ({appliedDiscount}%)
                    </dt>
                    <dd className="text-sm font-bold">-{ (subtotal * (appliedDiscount / 100)).toFixed(2)} {settings.currency}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="text-lg font-black text-secondary-900">الإجمالي النهائي</dt>
                  <dd className="text-xl font-black text-primary-600">{total.toFixed(2)} {settings.currency}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Checkout;