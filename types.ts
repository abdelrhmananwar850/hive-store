
export interface ProductOption {
  name: string; // e.g., "Color", "Size"
  values: string[]; // e.g., ["Red", "Blue"], ["S", "M", "L"]
}

export interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number; // New: Discounted price
  isBestSeller?: boolean; // New: Admin controlled best seller flag
  stock: number; // New: Inventory count (Hidden from customer exact number, used for Sold Out)
  description: string;
  image: string;
  category: string;
  salesCount: number;
  options?: ProductOption[];
  sku?: string;
  barcode?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
}

export interface CartItem extends Product {
  quantity: number;
  cartItemId: string; 
  selectedOptions?: { [key: string]: string };
}

export interface User {
  email?: string;
  name: string;
  phone: string;
  phone2?: string;
  address: string;
  city: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  discountApplied: number;
  date: string;
  status: 'pending' | 'shipped' | 'delivered' | 'returned';
  customer: User;
  isRated?: boolean; // Has the customer rated this order?
}

export interface Review {
  id: string;
  productId: string;
  orderId: string;
  customerName: string;
  rating: number; // 1-5 stars
  comment: string;
  date: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  percentage: number;
  expiryDate: string;
  isActive: boolean;
}

export interface SiteSettings {
  storeName: string;
  logoText: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  backgroundImage?: string;
  backgroundOpacity?: number; // 0-100
  // Banner settings
  bannerBadge?: string;
  bannerTitle?: string;
  bannerDescription?: string;
  bannerButtonText?: string;
}

export enum PageState {
  HOME,
  PRODUCT_DETAILS,
  CART,
  CHECKOUT,
  ADMIN
}
