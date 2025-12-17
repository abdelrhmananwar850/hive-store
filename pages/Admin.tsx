import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { createProduct } from '../services/storeService';
import { Product, ProductOption, Order } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

const Admin: React.FC = () => {
  const {
    products, addProduct, editProduct, removeProduct,
    isAdmin, loginAdmin, logoutAdmin,
    settings, updateSettings,
    orders, updateOrderStatus, returnOrder,
    discountCodes, addDiscountCode, deleteDiscountCode
  } = useStore();

  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'discounts' | 'settings'>('dashboard');

  // --- ANALYTICS DATA PREPARATION ---
  const analyticsData = useMemo(() => {
    // 1. Sales over time (Last 7 days or all orders grouped by date)
    const salesByDate: { [key: string]: number } = {};
    orders.forEach(o => {
      const d = new Date(o.date).toLocaleDateString('en-CA'); // YYYY-MM-DD
      salesByDate[d] = (salesByDate[d] || 0) + o.total;
    });
    const salesData = Object.keys(salesByDate).map(date => ({
      date,
      sales: salesByDate[date]
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 2. Products by Category
    const catCounts: { [key: string]: number } = {};
    products.forEach(p => {
      const c = p.category || 'غير مصنف';
      catCounts[c] = (catCounts[c] || 0) + 1;
    });
    const categoryData = Object.keys(catCounts).map(name => ({
      name,
      value: catCounts[name]
    }));

    // Colors for Pie Chart
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return { salesData, categoryData, COLORS };
  }, [orders, products]);


  // Forms State
  const [prodForm, setProdForm] = useState({
    name: '', price: '', salePrice: '', description: '', category: '', image: '', isBestSeller: false, stock: 10,
    sku: '', barcode: '', seoTitle: '', seoDescription: '', tagsInput: ''
  });
  const [prodOptions, setProdOptions] = useState<ProductOption[]>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValues, setNewOptionValues] = useState('');
  const [discountForm, setDiscountForm] = useState({ code: '', percentage: '', expiry: '' });
  const [settingsForm, setSettingsForm] = useState({
    name: settings.storeName,
    logo: settings.logoText,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    currency: settings.currency || 'ر.س',
    backgroundImage: settings.backgroundImage || '',
    backgroundOpacity: settings.backgroundOpacity ?? 15,
    bannerBadge: settings.bannerBadge || 'وصل حديثاً',
    bannerTitle: settings.bannerTitle || 'عروض حصرية',
    bannerDescription: settings.bannerDescription || 'أفضل المنتجات بجودة عالية وأسعار تنافسية. تسوق الآن واستمتع بالخصومات.',
    bannerButtonText: settings.bannerButtonText || 'تصفح المنتجات'
  });
  const bgImageRef = useRef<HTMLInputElement>(null);

  // Sync settingsForm when settings change (e.g., loaded from Supabase)
  useEffect(() => {
    setSettingsForm({
      name: settings.storeName,
      logo: settings.logoText,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      currency: settings.currency || 'ر.س',
      backgroundImage: settings.backgroundImage || '',
      backgroundOpacity: settings.backgroundOpacity ?? 15,
      bannerBadge: settings.bannerBadge || 'وصل حديثاً',
      bannerTitle: settings.bannerTitle || 'عروض حصرية',
      bannerDescription: settings.bannerDescription || 'أفضل المنتجات بجودة عالية وأسعار تنافسية. تسوق الآن واستمتع بالخصومات.',
      bannerButtonText: settings.bannerButtonText || 'تصفح المنتجات'
    });
  }, [settings]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prodImageRef = useRef<HTMLInputElement>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: '', price: '', salePrice: '', description: '', category: '', image: '', isBestSeller: false, stock: 0,
    sku: '', barcode: '', seoTitle: '', seoDescription: '', tagsInput: ''
  });
  const [editOptions, setEditOptions] = useState<ProductOption[]>([]);
  const [editOptionName, setEditOptionName] = useState('');
  const [editOptionValues, setEditOptionValues] = useState('');
  const editImageRef = useRef<HTMLInputElement>(null);

  // Derived State
  // Get unique categories, treating empty/null as "غير مصنف"
  const getCategoryName = (cat: string | undefined | null) => (cat && cat.trim() && cat !== 'undefined' && cat !== 'null') ? cat : 'غير مصنف';
  const existingCategories = Array.from(new Set(products.map(p => getCategoryName(p.category))));
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const filteredProducts = products.filter(p => {
    const pCategory = getCategoryName(p.category);
    const matchesSearch = searchTerm.trim() ? (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || pCategory.toLowerCase().includes(searchTerm.toLowerCase())) : true;
    const matchesCategory = categoryFilter ? pCategory === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });
  const [useGridTable, setUseGridTable] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const gridInstanceRef = useRef<any>(null);

  // Store refs for handlers to avoid stale closures
  const productsRef = useRef(products);
  const editProductRef = useRef(editProduct);
  const removeProductRef = useRef(removeProduct);

  React.useEffect(() => {
    productsRef.current = products;
    editProductRef.current = editProduct;
    removeProductRef.current = removeProduct;
  }, [products, editProduct, removeProduct]);

  // Setup global handlers once
  React.useEffect(() => {
    (window as any).__adminHandleEdit = (id: string) => {
      const p = productsRef.current.find(x => x.id === id);
      if (!p) return;
      setEditingProduct(p);
      setEditForm({
        name: p.name,
        price: String(p.price),
        salePrice: p.salePrice ? String(p.salePrice) : '',
        description: p.description || '',
        category: p.category || '',
        image: p.image || '',
        isBestSeller: !!p.isBestSeller,
        stock: p.stock ?? 0,
        sku: p.sku || '',
        barcode: p.barcode || '',
        seoTitle: p.seoTitle || '',
        seoDescription: p.seoDescription || '',
        tagsInput: (p.tags || []).join(', ')
      });
      setEditOptions(p.options || []);
      setEditOptionName('');
      setEditOptionValues('');
      setShowEditModal(true);
    };
    (window as any).__adminToggleSoldOut = async (id: string) => {
      const p = productsRef.current.find(x => x.id === id);
      if (!p) return;
      const newStock = p.stock > 0 ? 0 : 10;
      await editProductRef.current(id, { stock: newStock });
    };
    (window as any).__adminRemoveProduct = (id: string) => {
      removeProductRef.current(id);
    };
    return () => {
      delete (window as any).__adminHandleEdit;
      delete (window as any).__adminToggleSoldOut;
      delete (window as any).__adminRemoveProduct;
    };
  }, []);

  // Grid.js update effect
  React.useEffect(() => {
    if (!useGridTable || activeTab !== 'products') return;
    const gridjs: any = (window as any).gridjs;
    if (!gridjs) return;

    const toStatus = (stock: number) => stock > 0 ? '<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">متاح</span>' : '<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">نفدت</span>';
    const toQty = (stock: number) => `<span class="inline-block px-3 py-1 rounded-full text-xs font-bold ${stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${stock}</span>`;
    const toStar = (isBest: boolean) => `<span class="${isBest ? 'text-yellow-500' : 'text-gray-300'}"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg></span>`;
    const currency = settings.currency || 'ر.س';
    const toPrice = (price?: number, sale?: number) => sale ? `<div class="flex flex-col"><span class="font-bold text-red-600 text-base">${sale} ${currency}</span><span class="text-gray-300 line-through text-xs">${price} ${currency}</span></div>` : `<span class="font-bold text-gray-900 text-base">${price} ${currency}</span>`;

    const renderGrid = () => {
      if (!gridContainerRef.current) return;

      const rows = filteredProducts.map(p => [
        gridjs.html(`<div class="flex items-center gap-3"><div class="h-12 w-12 rounded-xl bg-gray-100 overflow-hidden border border-gray-200"><img src="${p.image}" class="h-full w-full object-cover"/></div><div><div class="text-sm font-bold text-gray-900">${p.name}</div><div class="flex items-center gap-2"><span class="text-[11px] text-gray-600 font-medium bg-gray-100 inline-block px-2 py-0.5 rounded">${getCategoryName(p.category)}</span>${p.salePrice ? '<span class="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">خصم</span>' : ''}</div></div></div>`),
        gridjs.html(toStatus(p.stock)),
        gridjs.html(toQty(p.stock)),
        gridjs.html(toStar(!!p.isBestSeller)),
        gridjs.html(toPrice(p.price, p.salePrice)),
        gridjs.html(`<div class="flex items-center gap-2">
          <button onclick="__adminHandleEdit('${p.id}')" class="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2.5 rounded-xl">تعديل</button>
          <button onclick="__adminToggleSoldOut('${p.id}')" class="${p.stock > 0 ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' : 'text-green-600 bg-green-50 hover:bg-green-100'} p-2.5 rounded-xl">${p.stock > 0 ? 'نفاد' : 'تفعيل'}</button>
          <button onclick="__adminRemoveProduct('${p.id}')" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2.5 rounded-xl">حذف</button>
        </div>`)
      ]);

      // Destroy existing grid
      if (gridInstanceRef.current) {
        try { gridInstanceRef.current.destroy(); } catch (e) { /* ignore */ }
        gridInstanceRef.current = null;
      }

      // Clear container
      gridContainerRef.current.innerHTML = '';

      // Create new grid with RTL columns order
      gridInstanceRef.current = new gridjs.Grid({
        columns: [
          { name: 'المنتج', width: '25%' },
          { name: 'الحالة', width: '10%' },
          { name: 'الكمية', width: '10%' },
          { name: 'الأكثر مبيعاً', width: '12%' },
          { name: 'السعر', width: '15%' },
          { name: 'الإجراءات', width: '28%', sort: false }
        ],
        data: rows,
        search: false,
        sort: true,
        pagination: {
          enabled: true,
          limit: 8,
          summary: false
        },
        language: {
          pagination: {
            previous: 'السابق',
            next: 'التالي',
            showing: 'عرض',
            of: 'من',
            to: 'إلى',
            results: 'نتيجة'
          },
          noRecordsFound: 'لا توجد منتجات',
          loading: 'جاري التحميل...'
        },
        className: {
          table: 'gridjs-table-rtl',
          thead: 'gridjs-thead-rtl',
          tbody: 'gridjs-tbody-rtl'
        }
      }).render(gridContainerRef.current);
    };

    // Wait for container to be available then render
    const timer = setTimeout(() => {
      renderGrid();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (gridInstanceRef.current) {
        try { gridInstanceRef.current.destroy(); } catch (e) { /* ignore */ }
        gridInstanceRef.current = null;
      }
    };
  }, [useGridTable, searchTerm, categoryFilter, products, activeTab, filteredProducts]);

  // LOGIN SCREEN
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <SEO title="تسجيل دخول المدير" />
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-3xl mb-6 shadow-lg shadow-primary-200">
              {settings.logoText}
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">لوحة المدير</h2>
            <p className="text-gray-500 mt-2">قم بإدارة متجرك بسهولة</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (!loginAdmin(loginUser, loginPass)) toast.error('بيانات الدخول غير صحيحة'); }}>
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">اسم المستخدم</label>
              <input
                type="text"
                className="w-full px-5 py-3 border border-gray-200 bg-white rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 focus:outline-none transition-all"
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                placeholder="اسم المستخدم..."
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
              <input
                type="password"
                className="w-full px-5 py-3 border border-gray-200 bg-white rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 focus:outline-none transition-all"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                placeholder="كلمة المرور..."
              />
            </div>
            <button type="submit" className="w-full bg-secondary-900 text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              تسجيل الدخول
            </button>
          </form>
        </div>
      </div>
    );
  }

  // HANDLERS
  // Helper to split by both Arabic and English commas
  const splitByComma = (str: string) => str.split(/[,،]/).map(v => v.trim()).filter(v => v);

  const handleAddOption = () => {
    if (newOptionName && newOptionValues) {
      const values = splitByComma(newOptionValues);
      setProdOptions([...prodOptions, { name: newOptionName, values }]);
      setNewOptionName('');
      setNewOptionValues('');
    }
  };

  const handleAddEditOption = () => {
    if (editOptionName && editOptionValues) {
      const values = splitByComma(editOptionValues);
      setEditOptions([...editOptions, { name: editOptionName, values }]);
      setEditOptionName('');
      setEditOptionValues('');
    }
  };

  const handleRemoveEditOption = (idx: number) => {
    setEditOptions(editOptions.filter((_, i) => i !== idx));
  };

  const handleRemoveOption = (idx: number) => {
    setProdOptions(prodOptions.filter((_, i) => i !== idx));
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct = await createProduct({
      name: prodForm.name,
      price: parseFloat(prodForm.price),
      salePrice: prodForm.salePrice ? parseFloat(prodForm.salePrice) : undefined,
      description: prodForm.description,
      category: prodForm.category || 'عام',
      image: prodForm.image || 'https://via.placeholder.com/400',
      isBestSeller: prodForm.isBestSeller,
      stock: Number(prodForm.stock),
      options: prodOptions,
      sku: prodForm.sku || undefined,
      barcode: prodForm.barcode || undefined,
      seoTitle: prodForm.seoTitle || undefined,
      seoDescription: prodForm.seoDescription || undefined,
      tags: prodForm.tagsInput ? prodForm.tagsInput.split(',').map(s => s.trim()).filter(Boolean) : []
    });
    if (newProduct.tags && newProduct.tags.length) {
      // Attach tags in DB
      // Lazy import to avoid circular
      const { setProductTags } = await import('../services/storeService');
      await setProductTags(newProduct.id, newProduct.tags);
    }
    addProduct(newProduct);
    toast.success('تم إضافة المنتج بنجاح');
    setProdForm({ name: '', price: '', salePrice: '', description: '', category: '', image: '', isBestSeller: false, stock: 10, sku: '', barcode: '', seoTitle: '', seoDescription: '', tagsInput: '' });
    setProdOptions([]);
    setShowProductModal(false);
  };

  const handleToggleBestSeller = async (product: Product) => {
    await editProduct(product.id, { isBestSeller: !product.isBestSeller });
  };
  const handleToggleSoldOut = async (product: Product) => {
    const newStock = product.stock > 0 ? 0 : 10;
    await editProduct(product.id, { stock: newStock });
  };
  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditForm({
      name: p.name,
      price: String(p.price),
      salePrice: p.salePrice ? String(p.salePrice) : '',
      description: p.description || '',
      category: p.category || '',
      image: p.image || '',
      isBestSeller: !!p.isBestSeller,
      stock: p.stock ?? 0,
      sku: p.sku || '',
      barcode: p.barcode || '',
      seoTitle: p.seoTitle || '',
      seoDescription: p.seoDescription || '',
      tagsInput: (p.tags || []).join(', ')
    });
    setEditOptions(p.options || []);
    setEditOptionName('');
    setEditOptionValues('');
    setShowEditModal(true);
  };
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  const handleRemoveEditImage = () => {
    setEditForm(prev => ({ ...prev, image: '' }));
  };
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    await editProduct(editingProduct.id, {
      name: editForm.name,
      price: parseFloat(editForm.price),
      salePrice: editForm.salePrice ? parseFloat(editForm.salePrice) : undefined,
      description: editForm.description,
      category: editForm.category,
      image: editForm.image || undefined,
      isBestSeller: editForm.isBestSeller,
      stock: Number(editForm.stock),
      sku: editForm.sku || undefined,
      barcode: editForm.barcode || undefined,
      seoTitle: editForm.seoTitle || undefined,
      seoDescription: editForm.seoDescription || undefined,
      options: editOptions.length > 0 ? editOptions : undefined
    });
    const tags = editForm.tagsInput ? splitByComma(editForm.tagsInput) : [];
    const { setProductTags } = await import('../services/storeService');
    await setProductTags(editingProduct.id, tags);
    setShowEditModal(false);
    setEditingProduct(null);
    setEditOptions([]);
    toast.success('تم تعديل المنتج بنجاح');
  };

  const handleAddDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    addDiscountCode({
      id: Date.now().toString(),
      code: discountForm.code,
      percentage: parseInt(discountForm.percentage),
      expiryDate: discountForm.expiry,
      isActive: true
    });
    setDiscountForm({ code: '', percentage: '', expiry: '' });
    toast.success('تم إضافة كود الخصم');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      storeName: settingsForm.name,
      logoText: settingsForm.logo,
      primaryColor: settingsForm.primaryColor,
      secondaryColor: settingsForm.secondaryColor,
      currency: settingsForm.currency,
      backgroundImage: settingsForm.backgroundImage,
      backgroundOpacity: settingsForm.backgroundOpacity,
      bannerBadge: settingsForm.bannerBadge,
      bannerTitle: settingsForm.bannerTitle,
      bannerDescription: settingsForm.bannerDescription,
      bannerButtonText: settingsForm.bannerButtonText
    });
    toast.success('تم حفظ الإعدادات بنجاح');
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm(prev => ({ ...prev, backgroundImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBgImage = () => {
    setSettingsForm(prev => ({ ...prev, backgroundImage: '' }));
    if (bgImageRef.current) bgImageRef.current.value = '';
  };

  const handleResetLogo = () => {
    updateSettings({ ...settings, logoUrl: undefined });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-50/50 font-sans flex flex-col md:flex-row overflow-hidden" dir="rtl">
      <SEO title="لوحة التحكم" />

      {/* MOBILE HEADER */}
      <div className="md:hidden bg-primary-700 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center font-bold backdrop-blur text-sm">
            {settings.logoText}
          </div>
          <h1 className="font-bold text-lg">لوحة المدير</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>

      {/* 1. SIDEBAR (Responsive) */}
      <aside className={`
        fixed inset-y-0 right-0 z-40 w-64 bg-gradient-to-b from-primary-600 to-primary-700 text-white shadow-2xl transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:shadow-none md:h-screen
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="hidden md:flex h-20 items-center gap-3 px-6 border-b border-primary-500/30">
          <div className="bg-white/20 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold backdrop-blur">
            {settings.logoText}
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">لوحة المدير</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            {
              id: 'dashboard', label: 'الرئيسية', icon: (
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor"><path d="M4 13h6a1 1 0 001-1V4a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1zm-1 7a1 1 0 001 1h6a1 1 0 001-1v-4a1 1 0 00-1-1H4a1 1 0 00-1 1v4zm10 0a1 1 0 001 1h6a1 1 0 001-1v-7a1 1 0 00-1-1h-6a1 1 0 00-1 1v7zm1-10h6a1 1 0 001-1V4a1 1 0 00-1-1h-6a1 1 0 00-1 1v5a1 1 0 001 1z" /></svg>
              )
            },
            {
              id: 'products', label: 'المنتجات', icon: (
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16a2 2 0 01-2 2H9l-2 2v-2H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v9z" /></svg>
              )
            },
            {
              id: 'orders', label: 'الطلبات', icon: (
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4h10a2 2 0 012 2v13l-4-2-4 2-4-2-4 2V6a2 2 0 012-2z" /></svg>
              )
            },
            {
              id: 'discounts', label: 'الخصومات', icon: (
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z" /></svg>
              )
            },
            {
              id: 'settings', label: 'الإعدادات', icon: (
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8a4 4 0 100 8 4 4 0 000-8zm9 4a7.963 7.963 0 01-.6 3l2.1 1.6-2 3.4-2.5-1A8.065 8.065 0 0114 20l-.4 2.6H10.4L10 20a8.065 8.065 0 01-3-1.6l-2.5 1-2-3.4 2.1-1.6A7.963 7.963 0 014 12c0-1 .2-2 .6-3L2.5 7.4l2-3.4 2.5 1A8.065 8.065 0 0110 4l.4-2.6h3.2L14 4c1.1.2 2.1.6 3 1.1l2.5-1 2 3.4-2.1 1.6c.4 1 .6 2 .6 3z" /></svg>
              )
            }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
              className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === item.id
                ? 'bg-white/20 text-white shadow-sm translate-x-1'
                : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
            >
              <span className="text-lg">{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-primary-500/30 space-y-2">
          <a href="#/" className="w-full flex items-center gap-2 text-white hover:bg-white/10 px-4 py-3 rounded-xl font-bold transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            العودة للمتجر
          </a>
          <button onClick={logoutAdmin} className="w-full flex items-center gap-2 text-white/70 hover:text-white hover:bg-red-500/20 px-4 py-3 rounded-xl font-bold transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            تسجيل خروج
          </button>
        </div>
      </aside>

      {/* OVERLAY for Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* 2. MAIN CONTENT (Flexible) */}
      <main className="flex-1 p-4 md:p-8 h-full overflow-y-auto w-full">

        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {/* Products Card */}
          <div className="group relative bg-gradient-to-br from-primary-500 to-primary-600 p-6 rounded-2xl shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                </div>
                <span className="text-white/60 text-xs font-bold bg-white/10 px-2 py-1 rounded-lg">إجمالي</span>
              </div>
              <p className="text-white/80 text-sm font-bold mb-1">المنتجات</p>
              <p className="text-4xl font-black text-white">{products.length}</p>
            </div>
          </div>

          {/* Orders Card */}
          <div className="group relative bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                </div>
                <span className="text-white/60 text-xs font-bold bg-white/10 px-2 py-1 rounded-lg">جديد</span>
              </div>
              <p className="text-white/80 text-sm font-bold mb-1">الطلبات</p>
              <p className="text-4xl font-black text-white">{orders.length}</p>
            </div>
          </div>

          {/* Sales Card */}
          <div className="group relative bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <span className="text-white/60 text-xs font-bold bg-white/10 px-2 py-1 rounded-lg">{settings.currency}</span>
              </div>
              <p className="text-white/80 text-sm font-bold mb-1">المبيعات</p>
              <p className="text-4xl font-black text-white">{orders.reduce((acc, o) => acc + o.total, 0).toFixed(0)}</p>
            </div>
          </div>

          {/* Returns Card */}
          <div className="group relative bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-2xl shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                </div>
                <span className="text-white/60 text-xs font-bold bg-white/10 px-2 py-1 rounded-lg">إجمالي</span>
              </div>
              <p className="text-white/80 text-sm font-bold mb-1">المرتجعات</p>
              <p className="text-4xl font-black text-white">{orders.filter(o => o.status === 'returned').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[600px] overflow-hidden">

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-black text-gray-900">لوحة التحكم</h2>
                <p className="text-gray-500 text-sm">نظرة عامة على أداء المتجر</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales Chart */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="text-xl">📈</span> المبيعات (حسب التاريخ)
                  </h3>
                  {analyticsData.salesData.length > 0 ? (
                    <div className="h-64 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.salesData}>
                          <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} ${settings.currency}`} />
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            cursor={{ fill: '#f3f4f6' }}
                          />
                          <Bar dataKey="sales" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات مبيعات بعد</div>
                  )}
                </div>

                {/* Categories Chart */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="text-xl">🍰</span> توزيع المنتجات (حسب الفئة)
                  </h3>
                  {analyticsData.categoryData.length > 0 ? (
                    <div className="h-64 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analyticsData.categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={analyticsData.COLORS[index % analyticsData.COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400 text-sm">لا توجد منتجات بعد</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-gray-900">إدارة المنتجات</h2>
                  <p className="text-gray-500 text-sm">إدارة المخزون، الأسعار، والصور</p>
                </div>
                <button onClick={() => setShowProductModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2">
                  <span>+</span> إضافة منتج
                </button>
              </div>

              {/* Search and Category Filters */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                {/* Search Input */}
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 w-full md:w-auto">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg>
                  <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    type="text"
                    placeholder="ابحث عن منتج..."
                    className="w-full md:w-64 bg-transparent text-sm focus:outline-none"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>

                {/* Category Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setCategoryFilter('')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${categoryFilter === ''
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    الكل ({products.length})
                  </button>
                  {existingCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${categoryFilter === cat
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {cat} ({products.filter(p => getCategoryName(p.category) === cat).length})
                    </button>
                  ))}
                </div>
              </div>

              {!useGridTable && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-l from-gray-50 to-white border-b border-gray-200">
                      <div className="col-span-4 text-sm font-bold text-gray-600">المنتج</div>
                      <div className="col-span-2 text-sm font-bold text-gray-600 text-center">السعر</div>
                      <div className="col-span-2 text-sm font-bold text-gray-600 text-center">المخزون</div>
                      <div className="col-span-1 text-sm font-bold text-gray-600 text-center">مميز</div>
                      <div className="col-span-3 text-sm font-bold text-gray-600 text-center">الإجراءات</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                      {filteredProducts.length === 0 ? (
                        <div className="py-16 text-center text-gray-400">
                          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <p className="font-bold">لا توجد منتجات</p>
                        </div>
                      ) : filteredProducts.map((p) => (
                        <div key={p.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors">
                          {/* Product Name & Category */}
                          <div className="col-span-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${p.stock > 0 ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                                {p.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-gray-900 truncate">{p.name}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">{getCategoryName(p.category)}</span>
                                  {p.salePrice && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">خصم</span>}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="col-span-2 text-center">
                            {p.salePrice ? (
                              <div>
                                <div className="font-bold text-primary-600">{p.salePrice} {settings.currency}</div>
                                <div className="text-xs text-gray-400 line-through">{p.price}</div>
                              </div>
                            ) : (
                              <div className="font-bold text-gray-900">{p.price} {settings.currency}</div>
                            )}
                          </div>

                          {/* Stock */}
                          <div className="col-span-2 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${p.stock > 10 ? 'bg-green-50 text-green-700 border border-green-200' :
                              p.stock > 0 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${p.stock > 10 ? 'bg-green-500' :
                                p.stock > 0 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}></span>
                              {p.stock > 0 ? p.stock : 'نفد'}
                            </span>
                          </div>

                          {/* Best Seller */}
                          <div className="col-span-1 text-center">
                            <button
                              onClick={() => handleToggleBestSeller(p)}
                              className={`p-2 rounded-lg transition-all ${p.isBestSeller ? 'bg-yellow-100 text-yellow-500 shadow-sm' : 'bg-gray-100 text-gray-300 hover:text-yellow-400 hover:bg-yellow-50'}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          </div>

                          {/* Actions */}
                          <div className="col-span-3 flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditProduct(p)}
                              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors border border-blue-200"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => handleToggleSoldOut(p)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${p.stock > 0 ? 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200' : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'}`}
                            >
                              {p.stock > 0 ? 'نفاد' : 'تفعيل'}
                            </button>
                            <button
                              onClick={() => removeProduct(p.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold transition-colors border border-red-200"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Table Footer */}
                  {filteredProducts.length > 0 && (
                    <div className="px-6 py-3 bg-gradient-to-l from-gray-50 to-white border-t border-gray-200 flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        إجمالي: <span className="font-bold text-gray-700">{filteredProducts.length}</span> منتج
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <span className="text-gray-500">متاح:</span>
                          <span className="font-bold text-green-600">{filteredProducts.filter(p => p.stock > 0).length}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <span className="text-gray-500">نفد:</span>
                          <span className="font-bold text-red-600">{filteredProducts.filter(p => p.stock === 0).length}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {useGridTable && (
                <div className="rounded-2xl border border-gray-100 bg-white p-2">
                  <div ref={gridContainerRef} />
                </div>
              )}
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">الطلبات الواردة</h2>
                  <p className="text-gray-500 text-sm mt-1">إدارة ومتابعة طلبات العملاء</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                    قيد الانتظار: {orders.filter(o => o.status === 'pending').length}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    تم الشحن: {orders.filter(o => o.status === 'shipped').length}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                    تم التوصيل: {orders.filter(o => o.status === 'delivered').length}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                    مرتجع: {orders.filter(o => o.status === 'returned').length}
                  </span>
                </div>
              </div>
              {orders.length === 0 ? (
                <div className="py-24 text-center text-gray-400 bg-white rounded-2xl border border-blue-100">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-lg font-bold">لا توجد طلبات حتى الآن</p>
                  <p className="text-sm mt-1">ستظهر الطلبات هنا عندما يقوم العملاء بالشراء</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                      {/* Order Header */}
                      <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">طلب #{order.id.slice(-6).toUpperCase()}</p>
                            <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.status === 'returned' ? (
                            <span className="px-4 py-2 rounded-xl text-sm font-bold bg-red-100 text-red-700 border-2 border-red-200 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              مرتجع
                            </span>
                          ) : order.status === 'delivered' ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-4 py-2 rounded-xl text-sm font-bold bg-green-100 text-green-700 border-2 border-green-200 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                تم التوصيل
                              </span>
                              {!order.isRated && (
                                <button
                                  onClick={() => {
                                    const rateUrl = `${window.location.origin}${window.location.pathname}#/rate/${order.id}`;
                                    navigator.clipboard.writeText(rateUrl);
                                    toast.success('تم نسخ رابط التقييم!');
                                  }}
                                  className="px-3 py-2 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-all flex items-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                                  نسخ رابط التقييم
                                </button>
                              )}
                              {order.isRated && (
                                <span className="px-3 py-2 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                                  تم التقييم
                                </span>
                              )}
                              <button
                                onClick={() => returnOrder(order.id)}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-all flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                مرتجع
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => updateOrderStatus(order.id, 'pending')}
                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${order.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                                  : 'bg-gray-100 text-gray-500 hover:bg-yellow-50 hover:text-yellow-600'
                                  }`}
                              >
                                ⏳ انتظار
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order.id, 'shipped')}
                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${order.status === 'shipped'
                                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                  : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                                  }`}
                              >
                                🚚 شحن
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-green-100 text-green-700 hover:bg-green-200 transition-all"
                              >
                                ✅ توصيل
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Order Body */}
                      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Customer Info */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border border-slate-200/50">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <p className="text-sm font-bold text-slate-700">معلومات العميل</p>
                          </div>
                          <div className="space-y-3">
                            <p className="text-lg font-black text-slate-900">{order.customer.name}</p>
                            {order.customer.phone && (
                              <div className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-2">
                                <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                </div>
                                <span className="text-sm font-semibold text-slate-700">{order.customer.phone}</span>
                              </div>
                            )}
                            {order.customer.email && (
                              <p className="text-sm text-slate-500 flex items-center gap-2">
                                <span>📧</span> {order.customer.email}
                              </p>
                            )}
                            <div className="pt-2 border-t border-slate-200/50">
                              <p className="text-sm font-semibold text-slate-700">📍 {order.customer.city}</p>
                              <p className="text-xs text-slate-500 mt-1">{order.customer.address}</p>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200/50">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <p className="text-sm font-bold text-blue-700">المنتجات</p>
                            </div>
                            <span className="bg-blue-200 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg">{order.items.length}</span>
                          </div>
                          <div className="space-y-3 max-h-36 overflow-y-auto custom-scrollbar">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-white/80 rounded-xl p-2">
                                <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover border border-blue-100" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                                </div>
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg">×{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Total */}
                        <div className="bg-gradient-to-br from-primary-50 to-teal-100 rounded-2xl p-5 border border-primary-200/50 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-primary-200 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <p className="text-sm font-bold text-primary-700">إجمالي الطلب</p>
                          </div>
                          <div className="bg-white/60 rounded-xl p-4 text-center">
                            <p className="text-4xl font-black text-primary-700">{order.total.toFixed(2)}</p>
                            <p className="text-lg font-bold text-primary-600">{settings.currency}</p>
                          </div>
                          {order.discountApplied > 0 && (
                            <div className="mt-3 bg-green-100 text-green-700 text-xs font-bold px-3 py-2 rounded-lg text-center">
                              🎉 تم تطبيق خصم {order.discountApplied}%
                            </div>
                          )}
                          <div className="mt-3 bg-white/60 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg text-center flex items-center justify-center gap-2">
                            <span>💵</span> الدفع عند الاستلام
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DISCOUNTS TAB */}
          {activeTab === 'discounts' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-gray-900">أكواد الخصم</h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">نشط: {discountCodes.length}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-purple-100 h-fit shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">كوبون جديد</h3>
                  <form onSubmit={handleAddDiscount} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1">رمز الكوبون</label>
                      <input required type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 uppercase font-mono" placeholder="SALE2024" value={discountForm.code} onChange={e => setDiscountForm({ ...discountForm, code: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">الخصم %</label>
                        <input required type="number" max="100" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" placeholder="15" value={discountForm.percentage} onChange={e => setDiscountForm({ ...discountForm, percentage: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">الانتهاء</label>
                        <input required type="date" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" value={discountForm.expiry} onChange={e => setDiscountForm({ ...discountForm, expiry: e.target.value })} />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-primary-600 text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition shadow-lg">إضافة الكوبون</button>
                  </form>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {discountCodes.map(d => (
                    <div key={d.id} className="relative bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex items-center justify-between overflow-hidden group hover:shadow-md hover:shadow-purple-100 transition-all">
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-purple-500 to-primary-500"></div>
                      <div className="pl-4">
                        <div className="text-xs text-gray-400 font-bold mb-1">كود خصم</div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-2xl font-black text-gray-900 tracking-tight">{d.code}</span>
                          <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg animate-pulse">{d.percentage}% OFF</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2 font-medium">ينتهي: {d.expiryDate}</p>
                      </div>
                      <button onClick={() => deleteDiscountCode(d.id)} className="bg-red-50 text-red-500 p-2.5 rounded-xl hover:bg-red-100 transition-all opacity-0 group-hover:opacity-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                  {discountCodes.length === 0 && <p className="text-gray-400 col-span-2 text-center py-10 flex flex-col items-center"><span className="text-2xl mb-2">🏷️</span>لا توجد أكواد خصم نشطة.</p>}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="p-8 max-w-4xl mx-auto">
              <h2 className="text-2xl font-black text-gray-900 mb-8">إعدادات المتجر</h2>
              <form onSubmit={handleSaveSettings} className="space-y-8">

                {/* Colors */}
                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-6 text-lg">الهوية البصرية</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block">اللون الأساسي (Primary)</label>
                      <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                        <input type="color" value={settingsForm.primaryColor} onChange={e => setSettingsForm({ ...settingsForm, primaryColor: e.target.value })} className="h-10 w-14 rounded-lg cursor-pointer border-none bg-transparent" />
                        <span className="font-mono text-sm text-gray-600 font-bold">{settingsForm.primaryColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block">اللون الثانوي (Dark)</label>
                      <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                        <input type="color" value={settingsForm.secondaryColor} onChange={e => setSettingsForm({ ...settingsForm, secondaryColor: e.target.value })} className="h-10 w-14 rounded-lg cursor-pointer border-none bg-transparent" />
                        <span className="font-mono text-sm text-gray-600 font-bold">{settingsForm.secondaryColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background Image */}
                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-6 text-lg">خلفية الموقع</h3>
                  <p className="text-sm text-gray-500 mb-4">أضف صورة أو GIF كخلفية لصفحات العميل (الرئيسية، المنتجات، الدفع)</p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upload Section */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block">رفع صورة/GIF</label>
                      <div className="flex items-center gap-3">
                        <input
                          ref={bgImageRef}
                          type="file"
                          accept="image/*,.gif"
                          onChange={handleBgImageUpload}
                          className="hidden"
                          id="bg-upload"
                        />
                        <label
                          htmlFor="bg-upload"
                          className="flex-1 bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all"
                        >
                          <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">اضغط لرفع صورة أو GIF</span>
                        </label>
                        {settingsForm.backgroundImage && (
                          <button
                            type="button"
                            onClick={handleRemoveBgImage}
                            className="bg-red-100 text-red-600 px-4 py-3 rounded-xl font-bold hover:bg-red-200 transition-all"
                          >
                            حذف
                          </button>
                        )}
                      </div>

                      {/* Or URL Input */}
                      <div className="mt-4">
                        <label className="text-xs font-bold text-gray-500 mb-2 block">أو أدخل رابط الصورة</label>
                        <input
                          type="url"
                          value={settingsForm.backgroundImage?.startsWith('data:') ? '' : settingsForm.backgroundImage}
                          onChange={e => setSettingsForm({ ...settingsForm, backgroundImage: e.target.value })}
                          placeholder="https://example.com/image.gif"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    {/* Preview & Opacity */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block">معاينة</label>
                      <div
                        className="relative h-40 rounded-xl border border-gray-200 overflow-hidden bg-white"
                        style={{
                          backgroundImage: settingsForm.backgroundImage ? `url(${settingsForm.backgroundImage})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        {!settingsForm.backgroundImage && (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <span>لا توجد خلفية</span>
                          </div>
                        )}
                        {settingsForm.backgroundImage && (
                          <div
                            className="absolute inset-0 bg-white"
                            style={{ opacity: 1 - (settingsForm.backgroundOpacity || 15) / 100 }}
                          />
                        )}
                      </div>

                      {/* Opacity Slider */}
                      <div className="mt-4">
                        <label className="text-xs font-bold text-gray-500 mb-2 block">
                          شفافية الخلفية: {settingsForm.backgroundOpacity}%
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          value={settingsForm.backgroundOpacity}
                          onChange={e => setSettingsForm({ ...settingsForm, backgroundOpacity: Number(e.target.value) })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>خفيفة جداً</span>
                          <span>واضحة</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banner Settings */}
                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-6 text-lg">إعدادات البانر</h3>
                  <p className="text-sm text-gray-500 mb-4">تخصيص البانر الرئيسي في الصفحة الرئيسية</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block">الشارة (Badge)</label>
                      <input
                        type="text"
                        value={settingsForm.bannerBadge}
                        onChange={e => setSettingsForm({ ...settingsForm, bannerBadge: e.target.value })}
                        placeholder="وصل حديثاً"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block">نص الزر</label>
                      <input
                        type="text"
                        value={settingsForm.bannerButtonText}
                        onChange={e => setSettingsForm({ ...settingsForm, bannerButtonText: e.target.value })}
                        placeholder="تصفح المنتجات"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 mb-2 block">العنوان الرئيسي</label>
                      <input
                        type="text"
                        value={settingsForm.bannerTitle}
                        onChange={e => setSettingsForm({ ...settingsForm, bannerTitle: e.target.value })}
                        placeholder="عروض حصرية"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 mb-2 block">الوصف</label>
                      <textarea
                        value={settingsForm.bannerDescription}
                        onChange={e => setSettingsForm({ ...settingsForm, bannerDescription: e.target.value })}
                        placeholder="أفضل المنتجات بجودة عالية..."
                        rows={2}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Currency */}
                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-6 text-lg">العملة</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block">اختر العملة</label>
                      <select
                        value={settingsForm.currency}
                        onChange={e => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 font-medium"
                      >
                        <option value="ر.س">ريال سعودي (ر.س)</option>
                        <option value="د.إ">درهم إماراتي (د.إ)</option>
                        <option value="د.ك">دينار كويتي (د.ك)</option>
                        <option value="ر.ع">ريال عماني (ر.ع)</option>
                        <option value="ر.ق">ريال قطري (ر.ق)</option>
                        <option value="د.ب">دينار بحريني (د.ب)</option>
                        <option value="ج.م">جنيه مصري (ج.م)</option>
                        <option value="$">دولار أمريكي ($)</option>
                        <option value="€">يورو (€)</option>
                        <option value="£">جنيه إسترليني (£)</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <div className="bg-white border border-gray-200 rounded-xl px-6 py-3 flex items-center gap-3">
                        <span className="text-gray-500 text-sm">معاينة:</span>
                        <span className="font-bold text-xl text-primary-600">100 {settingsForm.currency}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Branding */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-2">اسم المتجر</label>
                    <input type="text" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 font-medium" value={settingsForm.name} onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-bold text-gray-700 block mb-2">شعار نصي (حرف)</label>
                      <input type="text" maxLength={2} className="w-24 text-center px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-xl" value={settingsForm.logo} onChange={e => setSettingsForm({ ...settingsForm, logo: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700 block mb-2">صورة الشعار</label>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-colors" />
                      {settings.logoUrl && (
                        <div className="mt-3 flex items-center gap-3 bg-white w-fit p-2 pr-4 rounded-lg border border-gray-200">
                          <img src={settings.logoUrl} className="h-10 w-10 rounded-lg object-cover" alt="logo preview" />
                          <button type="button" onClick={handleResetLogo} className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded">حذف</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-primary-600 to-secondary-900 text-white py-4 rounded-xl font-bold hover:opacity-95 transition text-lg shadow-xl shadow-primary-500/20">حفظ كافة التغييرات</button>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* MODAL: ADD PRODUCT */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowProductModal(false)}>
              <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-3xl text-right overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
              <div className="bg-white p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-gray-900">إضافة منتج جديد</h3>
                  <button onClick={() => setShowProductModal(false)} className="bg-gray-50 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">&times;</button>
                </div>
                <form onSubmit={handleAddProduct} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">اسم المنتج</label>
                      <input required type="text" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" value={prodForm.name} onChange={e => setProdForm({ ...prodForm, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">صورة المنتج</label>
                      <div className="relative">
                        <input ref={prodImageRef} type="file" accept="image/*" onChange={handleProductImageUpload} className="hidden" />
                        <button type="button" onClick={() => prodImageRef.current?.click()} className="w-full px-4 py-2.5 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-500 text-sm hover:bg-gray-100 text-right truncate">
                          {prodForm.image ? 'تم اختيار صورة ✅' : 'اختر صورة من الجهاز...'}
                        </button>
                      </div>
                      {/* Hidden text input for fallback URL if needed */}
                      <input type="hidden" value={prodForm.image} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">الفئة</label>
                      <input list="categories" required type="text" placeholder="اكتب أو اختر..." className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" value={prodForm.category} onChange={e => setProdForm({ ...prodForm, category: e.target.value })} />
                      <datalist id="categories">
                        {existingCategories.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">السعر الأصلي</label>
                      <input required type="number" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" value={prodForm.price} onChange={e => setProdForm({ ...prodForm, price: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">سعر الخصم</label>
                      <input type="number" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" value={prodForm.salePrice} onChange={e => setProdForm({ ...prodForm, salePrice: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">الكمية (المخزون)</label>
                      <input required type="number" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" value={prodForm.stock} onChange={e => setProdForm({ ...prodForm, stock: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">الكمية (المخزون)</label>
                      <input type="number" min="0" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" value={prodForm.stock} onChange={e => setProdForm({ ...prodForm, stock: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-yellow-50 p-4 rounded-xl border border-yellow-100 cursor-pointer" onClick={() => setProdForm({ ...prodForm, isBestSeller: !prodForm.isBestSeller })}>
                    <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${prodForm.isBestSeller ? 'bg-yellow-400 border-yellow-400' : 'bg-white border-gray-300'}`}>
                      {prodForm.isBestSeller && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <label className="text-sm font-bold text-yellow-800 cursor-pointer select-none">تمييز كـ "الأكثر مبيعاً"؟</label>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1.5">الوصف</label>
                    <textarea required rows={3} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" value={prodForm.description} onChange={e => setProdForm({ ...prodForm, description: e.target.value })} />
                  </div>

                  {/* Options Simplified */}
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-lg">⚙️</span> خيارات المنتج (Variants)
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">أضف خيارات مثل اللون، المقاس، أو الذاكرة.</p>
                    </div>

                    <div className="grid grid-cols-5 gap-3 mb-4 items-end">
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-500 mb-1 block">اسم الخيار</label>
                        <input type="text" placeholder="مثلاً: اللون" className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" value={newOptionName} onChange={e => setNewOptionName(e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-500 mb-1 block">القيم (مفصولة بفاصلة)</label>
                        <input type="text" placeholder="أحمر، أزرق، أخضر" className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" value={newOptionValues} onChange={e => setNewOptionValues(e.target.value)} />
                      </div>
                      <div className="col-span-1">
                        <button type="button" onClick={handleAddOption} className="w-full bg-secondary-900 text-white py-2.5 rounded-lg font-bold hover:bg-black transition-colors flex items-center justify-center text-lg leading-none pb-1">+</button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {prodOptions.map((opt, i) => (
                        <div key={i} className="bg-white border border-gray-200 p-3 rounded-lg flex items-center justify-between shadow-sm">
                          <div>
                            <span className="text-xs font-bold text-gray-500 block">{opt.name}</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {opt.values.map(v => (
                                <span key={v} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">{v}</span>
                              ))}
                            </div>
                          </div>
                          <button type="button" onClick={() => handleRemoveOption(i)} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                      {prodOptions.length === 0 && <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-xs">لا توجد خيارات مضافة بعد.</div>}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button type="submit" className="w-full bg-primary-600 text-white py-4 rounded-xl hover:bg-primary-700 font-bold shadow-xl shadow-primary-500/30 transition-all text-lg">نشر المنتج في المتجر</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowEditModal(false)}>
              <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-3xl text-right overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
              <div className="bg-white p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-gray-900">تعديل المنتج</h3>
                  <button onClick={() => setShowEditModal(false)} className="bg-gray-50 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">&times;</button>
                </div>
                <form onSubmit={handleSaveEditProduct} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">اسم المنتج</label>
                      <input required type="text" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">صورة المنتج</label>
                      <div className="flex items-center gap-2">
                        <input ref={editImageRef} type="file" accept="image/*" onChange={handleEditImageUpload} className="hidden" />
                        <button type="button" onClick={() => editImageRef.current?.click()} className="px-4 py-2.5 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-500 text-sm hover:bg-gray-100 text-right truncate">
                          {editForm.image ? 'تغيير الصورة' : 'اختر صورة...'}
                        </button>
                        {editForm.image && (
                          <button type="button" onClick={handleRemoveEditImage} className="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold">حذف الصورة</button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">الفئة</label>
                      <input type="text" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">السعر الأصلي</label>
                      <input required type="number" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">سعر الخصم</label>
                      <input type="number" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" value={editForm.salePrice} onChange={e => setEditForm({ ...editForm, salePrice: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">الكمية (المخزون)</label>
                      <input required type="number" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-yellow-50 p-4 rounded-xl border border-yellow-100 cursor-pointer" onClick={() => setEditForm({ ...editForm, isBestSeller: !editForm.isBestSeller })}>
                    <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${editForm.isBestSeller ? 'bg-yellow-400 border-yellow-400' : 'bg-white border-gray-300'}`}>
                      {editForm.isBestSeller && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <label className="text-sm font-bold text-yellow-800 cursor-pointer select-none">تمييز كـ "الأكثر مبيعاً"؟</label>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1.5">الوصف</label>
                    <textarea rows={3} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                  </div>

                  {/* Options/Variants for Edit */}
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-lg">⚙️</span> خيارات المنتج (Variants)
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">أضف خيارات مثل اللون، المقاس، أو الذاكرة.</p>
                    </div>

                    <div className="grid grid-cols-5 gap-3 mb-4 items-end">
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-500 mb-1 block">اسم الخيار</label>
                        <input type="text" placeholder="مثلاً: اللون" className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" value={editOptionName} onChange={e => setEditOptionName(e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-500 mb-1 block">القيم (مفصولة بفاصلة)</label>
                        <input type="text" placeholder="أحمر، أزرق، أخضر" className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" value={editOptionValues} onChange={e => setEditOptionValues(e.target.value)} />
                      </div>
                      <div className="col-span-1">
                        <button type="button" onClick={handleAddEditOption} className="w-full bg-secondary-900 text-white py-2.5 rounded-lg font-bold hover:bg-black transition-colors flex items-center justify-center text-lg leading-none pb-1">+</button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {editOptions.map((opt, i) => (
                        <div key={i} className="bg-white border border-gray-200 p-3 rounded-lg flex items-center justify-between shadow-sm">
                          <div>
                            <span className="text-xs font-bold text-gray-500 block">{opt.name}</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {opt.values.map(v => (
                                <span key={v} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">{v}</span>
                              ))}
                            </div>
                          </div>
                          <button type="button" onClick={() => handleRemoveEditOption(i)} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                      {editOptions.length === 0 && <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-xs">لا توجد خيارات مضافة بعد.</div>}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button type="submit" className="w-full bg-primary-600 text-white py-4 rounded-xl hover:bg-primary-700 font-bold shadow-xl shadow-primary-500/30 transition-all text-lg">حفظ التعديلات</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin;
