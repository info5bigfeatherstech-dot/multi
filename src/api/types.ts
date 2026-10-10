/**
 * API Type Definitions matching backend route contracts
 */

// -------------------------------------------------------------
// Authentication & User Profile Types (auth.route.js)
// -------------------------------------------------------------
export type AuthPortal = 'ecomm' | 'wholesale' | 'admin-ecomm' | 'admin-wholesale';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'customer' | 'wholesaler' | 'admin' | 'staff';
  portal?: AuthPortal;
  avatar?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  password: string;
  email?: string;
}

export interface LoginPayload {
  identifier: string; // email or phone
  password: string;
  portal?: AuthPortal;
}

export interface GoogleAuthPayload {
  idToken: string;
  portal?: AuthPortal;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  refreshToken?: string;
  user: UserProfile;
}

export interface DeviceSession {
  id: string;
  deviceId: string;
  browser: string;
  os: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

// -------------------------------------------------------------
// Products & Storefront Types (products.route.js, categories.route.js, product-labels.route.js)
// -------------------------------------------------------------
export interface StorefrontProduct {
  id: string;
  title: string;
  slug: string;
  sku: string;
  brand?: string;
  category: string;
  categorySlug?: string;
  subcategory?: string;
  currentPrice: number;
  originalPrice: number;
  discountPercentage: number;
  wholesalePrice?: number;
  stock: number;
  images: string[];
  thumbnail: string;
  rating: number;
  reviewsCount: number;
  description: string;
  features?: string[];
  specifications?: Record<string, string>;
  labels?: string[];
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    color?: string;
    size?: string;
  }>;
}

export interface StorefrontCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  badge?: string;
  subcategories: string[];
  productCount?: number;
}

export interface ProductLabel {
  id: string;
  title: string;
  slug: string;
  color?: string;
  bgHex?: string;
  textHex?: string;
  description?: string;
}

// -------------------------------------------------------------
// Cart, Wishlist, Address & Delivery (cart, wishlist, address, delivery)
// -------------------------------------------------------------
export interface CartItem {
  id: string;
  productId: string;
  productSlug: string;
  title: string;
  sku: string;
  price: number;
  originalPrice: number;
  quantity: number;
  image: string;
  variantId?: string;
  variantName?: string;
}

export interface CartResponse {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  tax: number;
  deliveryCharge: number;
  grandTotal: number;
}

export interface WishlistItem {
  id: string;
  productId: string;
  productSlug: string;
  title: string;
  price: number;
  originalPrice: number;
  image: string;
  inStock: boolean;
  dateAdded: string;
}

export interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  alternatePhone?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  addressType: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
}

export interface DeliveryCheckResult {
  pincode: string;
  isDeliverable: boolean;
  estimatedDays: number;
  deliveryDate: string;
  codAvailable: boolean;
  deliveryCharge: number;
}

// -------------------------------------------------------------
// Checkout, Razorpay & Orders (checkout, orders)
// -------------------------------------------------------------
export interface CheckoutSettings {
  allowCod: boolean;
  allowOnline: boolean;
  freeDeliveryThreshold: number;
  standardDeliveryCharge: number;
  maxCodOrderValue: number;
  razorpayKeyId: string;
}

export interface CheckoutQuoteRequest {
  addressId: string;
  couponCode?: string;
  paymentMethod: 'razorpay' | 'cod' | 'credit';
  notes?: string;
}

export interface CheckoutQuoteResponse {
  quoteId: string;
  items: CartItem[];
  subtotal: number;
  couponDiscount: number;
  deliveryCharge: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: string;
  address: SavedAddress;
  appliedCoupon?: string;
  expiresAt: string;
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned' | 'RTO';
  items: CartItem[];
  pricing: {
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    total: number;
  };
  shippingAddress: SavedAddress;
  paymentInfo: {
    method: 'razorpay' | 'cod' | 'credit';
    status: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
    transactionId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };
  tracking?: {
    carrier: string;
    trackingNumber: string;
    currentLocation: string;
    estimatedDelivery: string;
    updates: Array<{ status: string; location: string; timestamp: string }>;
  };
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Coupons, Reviews, Notifications & Push
// -------------------------------------------------------------
export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  validUntil: string;
  usageLimit?: number;
  isActive: boolean;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  verifiedPurchase: boolean;
  createdAt: string;
  status?: 'Approved' | 'Pending' | 'Rejected';
}

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'promo' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface PushStatus {
  isSubscribed: boolean;
  eligible: boolean;
  vapidPublicKey?: string;
}

// -------------------------------------------------------------
// Wholesaler Onboarding Types (wholesaler.route.js)
// -------------------------------------------------------------
export interface WholesalerApplication {
  id: string;
  businessName: string;
  gstNumber?: string;
  panNumber?: string;
  contactPerson: string;
  mobileNumber: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  proofDocumentUrl?: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Payment Pending' | 'Approved' | 'Rejected' | 'Active';
  activationFee?: number;
  createdAt: string;
}

// -------------------------------------------------------------
// Admin Types (admin-orders, admin-analytics, staff, etc.)
// -------------------------------------------------------------
export interface AdminOrdersSummary {
  totalOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  rtoCount: number;
  returnRequestsCount: number;
}

export interface AdminAnalyticsSummary {
  dailyRevenue: number;
  monthlyRevenue: number;
  activeUsers: number;
  abandonedCartsCount: number;
  cartAbandonmentRate: number;
  wishlistSavesCount: number;
  conversionRate: number;
}

export type StaffRole = 'admin' | 'product_manager' | 'order_manager' | 'marketing_manager';

export interface PermissionAction {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface StaffPermissionsMatrix {
  orders?: PermissionAction;
  products?: PermissionAction;
  returns?: PermissionAction;
  marketing?: PermissionAction;
  reviews?: PermissionAction;
  analytics?: PermissionAction;
  utilities?: PermissionAction;
  staff?: PermissionAction;
  [key: string]: PermissionAction | undefined;
}

export interface StaffMember {
  _id?: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: StaffRole | string;
  isActive: boolean;
  twoFactorEnabled?: boolean;
  permissions?: StaffPermissionsMatrix;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminStaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Super Admin' | 'Product Manager' | 'Order Manager' | 'Marketing Manager' | 'Support Executive';
  status: 'Active' | 'Inactive';
  lastLogin?: string;
  createdAt: string;
}

export interface RTOOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  carrier: string;
  awbNumber: string;
  reason: string;
  status: 'Undelivered' | 'Returned to Origin' | 'Damaged in Transit' | 'Resolved' | 'Refunded';
  refundAmount?: number;
  date: string;
}
