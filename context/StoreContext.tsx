import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, SiteSettings, Order, DiscountCode, Review } from '../types';
import { fetchProducts, deleteProductMock, updateProduct } from '../services/storeService';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

interface StoreContextType {
  products: Product[];
  cart: CartItem[];
  isCartOpen: boolean;
  settings: SiteSettings;
  isAdmin: boolean;
  orders: Order[];
  discountCodes: DiscountCode[];
  reviews: Review[];
  isLoading: boolean;
  
  addToCart: (product: Product, selectedOptions?: { [key: string]: string }) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  toggleCart: () => void;
  clearCart: () => void;
  
  // Admin Actions
  loginAdmin: (user: string, pass: string) => boolean;
  logoutAdmin: () => void;
  updateSettings: (settings: SiteSettings) => void;
  addProduct: (product: Product) => void;
  editProduct: (id: string, updates: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  returnOrder: (orderId: string) => void;
  addDiscountCode: (code: DiscountCode) => void;
  deleteDiscountCode: (id: string) => void;
  
  // Reviews
  addReview: (review: Omit<Review, 'id' | 'date'>) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
  markOrderAsRated: (orderId: string) => Promise<void>;
  getProductReviews: (productId: string) => Review[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const adjustColor = (color: string, amount: number) => {
    // Basic hex adjustment guard
    if (!color || !color.startsWith('#')) return color;
    try {
        return '#' + color.replace(/^#/, '').replace(/../g, (color) => 
            ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
    } catch (e) { return color; }
}

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => {
    // Check localStorage for admin session
    return localStorage.getItem('isAdmin') === 'true';
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const [settings, setSettings] = useState<SiteSettings>({
    storeName: 'Hive Store',
    logoText: 'H',
    primaryColor: '#0d9488',
    secondaryColor: '#111827',
    currency: 'ر.س',
    backgroundImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=80',
    backgroundOpacity: 40,
    bannerBadge: 'وصل حديثاً',
    bannerTitle: 'عروض حصرية',
    bannerDescription: 'أفضل المنتجات بجودة عالية وأسعار تنافسية. تسوق الآن واستمتع بالخصومات.',
    bannerButtonText: 'تصفح المنتجات'
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    // Load orders from localStorage as backup
    const savedOrders = localStorage.getItem('orders');
    return savedOrders ? JSON.parse(savedOrders) : [];
  });
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // 1. Load Data from Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const MOCK = (import.meta as any).env?.VITE_MOCK_DATA === 'true';
      if (MOCK) {
        setProducts([{
          id: 'p1',
          name: 'منتج تجريبي',
          price: 100,
          salePrice: undefined,
          isBestSeller: false,
          stock: 5,
          description: 'منتج للاختبار مع بيانات وهمية',
          image: 'https://via.placeholder.com/400',
          category: 'تجريبي',
          salesCount: 0,
          options: []
        }]);
        setIsLoading(false);
        return;
      }
      const prods = await fetchProducts();
      setProducts(prods);

      // Settings
      const { data: settingsData } = await supabase.from('site_settings').select('*').single();
      if (settingsData) {
        setSettings({
          storeName: settingsData.store_name,
          logoText: settingsData.logo_text,
          logoUrl: settingsData.logo_url,
          primaryColor: settingsData.primary_color || '#0d9488',
          secondaryColor: settingsData.secondary_color || '#111827',
          currency: settingsData.currency || 'ر.س',
          backgroundImage: settingsData.background_image || '',
          backgroundOpacity: settingsData.background_opacity ?? 15,
          bannerBadge: settingsData.banner_badge || 'وصل حديثاً',
          bannerTitle: settingsData.banner_title || 'عروض حصرية',
          bannerDescription: settingsData.banner_description || 'أفضل المنتجات بجودة عالية وأسعار تنافسية. تسوق الآن واستمتع بالخصومات.',
          bannerButtonText: settingsData.banner_button_text || 'تصفح المنتجات'
        });
      }

      const { data: discountData } = await supabase.from('discount_codes').select('*');
      if (discountData) {
         setDiscountCodes(discountData.map((d: any) => ({
             id: d.id,
             code: d.code,
             percentage: d.percentage,
             expiryDate: d.expiry_date,
             isActive: d.is_active
         })));
      }

      // Load orders if admin is logged in
      const savedIsAdmin = localStorage.getItem('isAdmin') === 'true';
      if (savedIsAdmin) {
          await fetchOrders();
      }
      setIsLoading(false);
    };
    loadData();
  }, [isAdmin]);

  const fetchOrders = async () => {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
          const dbOrders = data.map((o: any) => ({
              id: o.id,
              items: o.items,
              total: o.total,
              discountApplied: o.discount_applied,
              date: o.created_at,
              status: o.status,
              customer: o.customer
          }));
          setOrders(dbOrders);
          localStorage.setItem('orders', JSON.stringify(dbOrders));
      } else if (error) {
          console.error("Error fetching orders:", error);
          // Keep localStorage orders if DB fails
      }
  }

  // 2. Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // 2.5 Save orders to localStorage whenever they change
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('orders', JSON.stringify(orders));
    }
  }, [orders]);

  // 3. CSS Variables Effect
  useEffect(() => {
    const root = document.documentElement;
    const p600 = settings.primaryColor;
    root.style.setProperty('--primary-600', p600);
    root.style.setProperty('--primary-500', adjustColor(p600, 20));
    root.style.setProperty('--primary-400', adjustColor(p600, 40));
    root.style.setProperty('--primary-700', adjustColor(p600, -20));
    root.style.setProperty('--primary-900', adjustColor(p600, -60));
    root.style.setProperty('--secondary-900', settings.secondaryColor);
  }, [settings.primaryColor, settings.secondaryColor]);

  // Cart Logic
  const addToCart = (product: Product, selectedOptions: { [key: string]: string } = {}) => {
    // 1. Debounce check per product: Prevent rapid clicks on same product
    const now = Date.now();
    const debounceKey = `_lastAddToCart_${product.id}`;
    const lastClick = (window as any)[debounceKey] || 0;
    if (now - lastClick < 500) return; // 500ms debounce per product
    (window as any)[debounceKey] = now;

    if (product.stock <= 0) {
        toast.error('عذراً، هذا المنتج غير متوفر حالياً.', { id: `stock-error-${product.id}` });
        return;
    }
    setCart(prev => {
      const optionsKey = JSON.stringify(selectedOptions || {});
      const existingItem = prev.find(item => 
        item.id === product.id && 
        JSON.stringify(item.selectedOptions || {}) === optionsKey
      );

      // Simple client-side check for max quantity based on stock
      if (existingItem && existingItem.quantity >= product.stock) {
          toast.error('لا تتوفر كمية إضافية من هذا المنتج', { id: 'stock-limit' });
          return prev;
      }

      const effectivePrice = (product.salePrice && product.salePrice < product.price) 
        ? product.salePrice 
        : product.price;

      if (existingItem) {
        toast.success('تم زيادة الكمية في السلة', { id: `cart-update-${product.id}` });
        return prev.map(item => 
          item.cartItemId === existingItem.cartItemId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      
      toast.success('تمت الإضافة للسلة بنجاح', { id: `cart-add-${product.id}` });
      return [...prev, { 
        ...product, 
        price: effectivePrice, 
        quantity: 1, 
        selectedOptions,
        cartItemId: `${product.id}-${Date.now()}` 
      }];
    });
    // setIsCartOpen(true); // Don't auto open cart
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    const item = cart.find(i => i.cartItemId === cartItemId);
    if (!item) return;

    if (quantity > item.stock) {
        toast.error('الكمية المطلوبة غير متوفرة');
        return;
    }

    if (quantity < 1) {
      removeFromCart(cartItemId);
      toast.success('تم إزالة المنتج من السلة');
      return;
    }
    setCart(prev => prev.map(item => 
      item.cartItemId === cartItemId ? { ...item, quantity } : item
    ));
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const clearCart = () => setCart([]);

  // Admin Actions
  const loginAdmin = (user: string, pass: string) => {
    if (user === 'admin' && pass === 'admin123') {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
      fetchOrders(); // Load orders when admin logs in
      return true;
    }
    return false;
  };
  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
  };

  const updateSettings = async (newSettings: SiteSettings) => {
      setSettings(newSettings);
      // Persist to Supabase
      // Assuming singleton row id=1
      await supabase.from('site_settings').update({
          store_name: newSettings.storeName,
          logo_text: newSettings.logoText,
          logo_url: newSettings.logoUrl,
          primary_color: newSettings.primaryColor,
          secondary_color: newSettings.secondaryColor,
          currency: newSettings.currency,
          background_image: newSettings.backgroundImage,
          background_opacity: newSettings.backgroundOpacity,
          banner_badge: newSettings.bannerBadge,
          banner_title: newSettings.bannerTitle,
          banner_description: newSettings.bannerDescription,
          banner_button_text: newSettings.bannerButtonText
      }).eq('id', 1);
      
      // If no row exists (first run), insert
      const {count} = await supabase.from('site_settings').select('*', { count: 'exact', head: true });
      if (count === 0) {
           await supabase.from('site_settings').insert({
              store_name: newSettings.storeName,
              logo_text: newSettings.logoText,
              logo_url: newSettings.logoUrl,
              primary_color: newSettings.primaryColor,
              secondary_color: newSettings.secondaryColor,
              currency: newSettings.currency,
              background_image: newSettings.backgroundImage,
              background_opacity: newSettings.backgroundOpacity,
              banner_badge: newSettings.bannerBadge,
              banner_title: newSettings.bannerTitle,
              banner_description: newSettings.bannerDescription,
              banner_button_text: newSettings.bannerButtonText
           });
      }
  };

  const addProduct = (product: Product) => setProducts(prev => [product, ...prev]);
  
  const editProduct = async (id: string, updates: Partial<Product>) => {
      const MOCK = (import.meta as any).env?.VITE_MOCK_DATA === 'true';
      if (MOCK) {
          setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } as Product : p));
          return;
      }
      const updatedProduct = await updateProduct(id, updates);
      if (updatedProduct) {
          setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      }
  };

  const removeProduct = async (id: string) => {
      await deleteProductMock(id);
      setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addOrder = async (order: Order) => {
      // Always add to local state first
      setOrders(prev => [order, ...prev]);
      
      // Decrement Stock locally
      for (const item of order.items) {
          const newStock = Math.max(0, item.stock - item.quantity);
          setProducts(prev => prev.map(p => p.id === item.id ? { ...p, stock: newStock } : p));
      }

      // Try to save to Supabase
      const { error } = await supabase.from('orders').insert({
          id: order.id,
          items: order.items,
          total: order.total,
          discount_applied: order.discountApplied,
          status: order.status,
          customer: order.customer
      });
      
      if (error) {
          console.error("Order save to DB failed:", error);
      } else {
         // Update stock in DB
         for (const item of order.items) {
             const newStock = Math.max(0, item.stock - item.quantity);
             await updateProduct(item.id, { stock: newStock });
         }
      }
  };

  const addDiscountCode = async (code: DiscountCode) => {
      const { data, error } = await supabase.from('discount_codes').insert({
          code: code.code,
          percentage: code.percentage,
          expiry_date: code.expiryDate,
          is_active: code.isActive
      }).select().single();
      
      if (!error && data) {
          setDiscountCodes(prev => [...prev, { ...code, id: data.id }]);
      }
  };

  const deleteDiscountCode = async (id: string) => {
      await supabase.from('discount_codes').delete().eq('id', id);
      setDiscountCodes(prev => prev.filter(d => d.id !== id));
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
      // Update locally first
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      
      // Try to update in Supabase
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) {
          console.error("Order status update failed:", error);
      }
      toast.success(`تم تحديث حالة الطلب إلى: ${status === 'pending' ? 'قيد الانتظار' : status === 'shipped' ? 'تم الشحن' : status === 'delivered' ? 'تم التوصيل' : 'مرتجع'}`);
  };

  const returnOrder = async (orderId: string) => {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // 1. Return stock for each item in the order
      for (const item of order.items) {
          const product = products.find(p => p.id === item.id);
          if (product) {
              const newStock = product.stock + item.quantity;
              // Update locally
              setProducts(prev => prev.map(p => p.id === item.id ? { ...p, stock: newStock } : p));
              // Update in DB
              await updateProduct(item.id, { stock: newStock });
          }
      }

      // 2. Update order status to 'returned'
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'returned' as Order['status'] } : o));
      
      // 3. Update in Supabase
      const { error } = await supabase.from('orders').update({ status: 'returned' }).eq('id', orderId);
      if (error) {
          console.error("Order return failed:", error);
      }
      
      toast.success('تم إرجاع الطلب وإعادة الكميات للمخزون');
  };

  // Reviews Functions
  const addReview = async (review: Omit<Review, 'id' | 'date'>) => {
      const newReview: Review = {
          ...review,
          id: `rev-${Date.now()}`,
          date: new Date().toISOString()
      };
      
      // Add locally
      setReviews(prev => [...prev, newReview]);
      
      // Save to Supabase
      const { error } = await supabase.from('reviews').insert({
          id: newReview.id,
          product_id: newReview.productId,
          order_id: newReview.orderId,
          customer_name: newReview.customerName,
          rating: newReview.rating,
          comment: newReview.comment
      });
      
      if (error) {
          console.error("Review save failed:", error);
      }
  };

  const getOrderById = (orderId: string) => {
      return orders.find(o => o.id === orderId);
  };

  const markOrderAsRated = async (orderId: string) => {
      // Update locally
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, isRated: true } : o));
      
      // Update in Supabase
      await supabase.from('orders').update({ is_rated: true }).eq('id', orderId);
  };

  const getProductReviews = (productId: string) => {
      return reviews.filter(r => r.productId === productId);
  };

  return (
    <StoreContext.Provider value={{ 
      products, cart, isCartOpen, settings, isAdmin, orders, discountCodes, reviews, isLoading,
      addToCart, removeFromCart, updateQuantity, toggleCart, clearCart,
      loginAdmin, logoutAdmin, updateSettings, addProduct, editProduct, removeProduct,
      addOrder, updateOrderStatus, returnOrder, addDiscountCode, deleteDiscountCode,
      addReview, getOrderById, markOrderAsRated, getProductReviews
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
