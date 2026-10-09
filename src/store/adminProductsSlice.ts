import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CATEGORY_SUBCATEGORIES } from '../data/storeData';

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  color?: string;
  size?: string;
}

export interface TierPrice {
  minQty: number;
  price: number;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productTitle: string;
  productSku: string;
  previousStock: number;
  adjustmentQty: number;
  newStock: number;
  reason: 'Manual Audit' | 'Damaged / Broken' | 'New Batch Received' | 'Customer Return' | 'Inventory Count Correction';
  notes?: string;
  timestamp: string;
  user: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  subcategories: string[];
  imageUrl?: string;
  bannerImageUrl?: string;
  description?: string;
  status?: string;
  order?: number;
  badge?: string;
}

export interface AdminProduct {
  id: string;
  sku: string;
  title: string;
  brand?: string;
  category: string;
  subcategory?: string;
  currentPrice: number;
  originalPrice: number;
  costPrice?: number;
  discountPercentage: number;
  stock: number;
  lowStockThreshold: number;
  binLocation?: string;
  image: string;
  gallery?: string[];
  rating: number;
  reviews: number;
  status: 'Active' | 'Draft' | 'Archived';
  tag?: string;
  badges?: string[];
  variants?: ProductVariant[];
  tierPricing?: TierPrice[];
  attributes?: Record<string, string>;
  description?: string;
  dateAdded: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminProductsState {
  products: AdminProduct[];
  categories: AdminCategory[];
  inventoryLogs: InventoryLog[];
  selectedProductIds: string[];
  availableBadges: string[];
  lastUpdated: string;
}

const STORAGE_KEY = 'admin_products_store';

// Helper to seed categories from store data
const DEFAULT_CATEGORIES: AdminCategory[] = [
  {
    id: 'home-kitchen',
    name: 'Home & Kitchen',
    subcategories: CATEGORY_SUBCATEGORIES['home-kitchen'] || ['Kitchen', 'Cookware', 'Storage', 'Dining', 'Home Utility'],
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
    badge: 'Bestseller'
  },
  {
    id: 'smart-life-gadget',
    name: 'Smart Life Gadgets',
    subcategories: CATEGORY_SUBCATEGORIES['smart-life-gadget'] || ['Mobile Accessories', 'Smart Gadgets', 'USB Gadgets', 'LED & Lighting', 'Mini Electronics', 'Gaming'],
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
    badge: 'Trending'
  },
  {
    id: 'baby-items',
    name: 'Baby Items',
    subcategories: CATEGORY_SUBCATEGORIES['baby-items'] || ['Baby Care', 'Feeding', 'Baby Toys', 'Baby Accessories', 'Kids Essentials'],
    imageUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=400&q=80',
    badge: 'Popular'
  },
  {
    id: 'stationary',
    name: 'Stationery',
    subcategories: CATEGORY_SUBCATEGORIES['stationary'] || ['Writing', 'Notebooks', 'Art & Craft', 'School Supplies', 'Office Supplies'],
    imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80',
    badge: 'Lowest ₹'
  },
  {
    id: 'cleaning-housekeeping',
    name: 'Cleaning & Housekeeping',
    subcategories: CATEGORY_SUBCATEGORIES['cleaning-housekeeping'] || ['Cleaning Tools', 'Kitchen Cleaning', 'Bathroom Cleaning', 'Laundry', 'Household Utility'],
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
    badge: 'Best Value'
  },
  {
    id: 'sports-fitness',
    name: 'Sports & Fitness',
    subcategories: CATEGORY_SUBCATEGORIES['sports-fitness'] || ['Fitness', 'Yoga', 'Exercise', 'Sports Accessories', 'Outdoor Sports'],
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
    badge: 'New'
  },
  {
    id: 'tours-travels',
    name: 'Tours & Travels',
    subcategories: CATEGORY_SUBCATEGORIES['tours-travels'] || ['Travel Bags', 'Organizers', 'Luggage Accessories', 'Travel Essentials', 'Travel Gadgets'],
    imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80',
    badge: 'Hot'
  },
  {
    id: 'fashion-world',
    name: 'Fashion World',
    subcategories: CATEGORY_SUBCATEGORIES['fashion-world'] || ['Women’s Fashion', 'Men’s Fashion', 'Kids Fashion', 'Jewellery', 'Bags, Footwear & Accessories'],
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=80',
    badge: 'Flat 70% Off'
  },
  {
    id: 'gifts',
    name: 'Gifts',
    subcategories: CATEGORY_SUBCATEGORIES['gifts'] || ['Birthday & Anniversary', 'Wedding & Festival', 'Personalized Gifts', 'Gift Sets'],
    imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
    badge: 'Festive'
  },
  {
    id: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    subcategories: CATEGORY_SUBCATEGORIES['beauty-personal-care'] || ['Skincare', 'Hair Care', 'Makeup', 'Grooming', 'Beauty & Bath'],
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80',
    badge: 'Care'
  },
  {
    id: 'home-improvement',
    name: 'Home Improvement',
    subcategories: CATEGORY_SUBCATEGORIES['home-improvement'] || ['Tools & Hardware', 'Electrical', 'Lighting', 'Home Repair', 'Safety & DIY'],
    imageUrl: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=400&q=80',
    badge: 'Hardware'
  },
  {
    id: 'car-accessories',
    name: 'Car Accessories',
    subcategories: CATEGORY_SUBCATEGORIES['car-accessories'] || ['Interior', 'Exterior', 'Car Cleaning', 'Car Organizers', 'Car Utility'],
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    badge: 'Auto'
  },
  {
    id: 'corporate-gifting',
    name: 'Corporate Gifting',
    subcategories: CATEGORY_SUBCATEGORIES['corporate-gifting'] || ['Employee Gifts', 'Client Gifts', 'Promotional Gifts', 'Custom Gifts', 'Corporate Sets'],
    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80',
    badge: 'B2B'
  }
];

const DEFAULT_PRODUCTS: AdminProduct[] = [
  {
    id: 'prod-adm-1',
    sku: 'HK-COOKER-3L',
    title: 'Heavy Duty Steel Induction Pressure Cooker 3L',
    brand: 'Prestige Craft',
    category: 'Home & Kitchen',
    subcategory: 'Cookware',
    currentPrice: 399,
    originalPrice: 899,
    costPrice: 220,
    discountPercentage: 56,
    stock: 48,
    lowStockThreshold: 10,
    binLocation: 'A-12-01',
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'
    ],
    rating: 4.9,
    reviews: 3180,
    status: 'Active',
    tag: 'MEGA DEAL',
    badges: ['Bestseller', 'Trending'],
    description: 'Triple layered encapsulated base induction compatible stainless steel cooker for durable daily cooking.',
    attributes: { Material: 'Stainless Steel 304', Capacity: '3 Litres', Warranty: '5 Years' },
    dateAdded: '2026-09-15T10:00:00Z',
    createdAt: '2026-09-15T10:00:00Z',
    updatedAt: '2026-10-01T12:00:00Z'
  },
  {
    id: 'prod-adm-2',
    sku: 'HK-TIFFIN-STEEL',
    title: 'Stainless Steel Tiffin Lunch Box with Carry Pouch',
    brand: 'ApnaKitchen',
    category: 'Home & Kitchen',
    subcategory: 'Storage',
    currentPrice: 149,
    originalPrice: 399,
    costPrice: 85,
    discountPercentage: 63,
    stock: 120,
    lowStockThreshold: 15,
    binLocation: 'A-08-03',
    image: 'https://images.unsplash.com/photo-1594998893017-36147cbcae05?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviews: 1420,
    status: 'Active',
    tag: 'HOT SELLER',
    badges: ['Sale', 'Trending'],
    description: 'Leak-resistant 3-tier food grade lunch container set with insulated fabric jacket.',
    attributes: { Material: 'SS 202 Mirror Finish', Containers: '3 Tiers' },
    dateAdded: '2026-09-16T11:00:00Z',
    createdAt: '2026-09-16T11:00:00Z'
  },
  {
    id: 'prod-adm-3',
    sku: 'SL-NECKBAND-40H',
    title: 'Wireless Bluetooth Magnetic Neckband 40H Playtime',
    brand: 'SoundPulse',
    category: 'Smart Life Gadgets',
    subcategory: 'Mobile Accessories',
    currentPrice: 249,
    originalPrice: 799,
    costPrice: 130,
    discountPercentage: 69,
    stock: 7, // Low Stock Alert (<10)
    lowStockThreshold: 15,
    binLocation: 'B-02-14',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    reviews: 840,
    status: 'Active',
    tag: 'TOP RATED',
    badges: ['Hot Deal', 'Trending'],
    description: 'Environmental noise cancellation wireless audio with Type-C ultra fast charging.',
    attributes: { Bluetooth: 'v5.3', Battery: '40 Hours Playback', IPX: 'IPX5 Water Resistant' },
    dateAdded: '2026-09-18T14:30:00Z',
    createdAt: '2026-09-18T14:30:00Z'
  },
  {
    id: 'prod-adm-4',
    sku: 'HI-SENSOR-BAR',
    title: 'Wireless Motion Sensor LED Night Light Bar (Magnetic)',
    brand: 'LuminoSmart',
    category: 'Home Improvement',
    subcategory: 'Lighting',
    currentPrice: 149,
    originalPrice: 499,
    costPrice: 65,
    discountPercentage: 70,
    stock: 0, // Out of Stock Alert (0)
    lowStockThreshold: 10,
    binLocation: 'C-15-02',
    image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviews: 980,
    status: 'Active',
    tag: 'HOT SELLER',
    badges: ['Sale'],
    description: 'PIR infrared motion sensing rechargeable closet and corridor magnetic light strip.',
    dateAdded: '2026-09-20T09:00:00Z',
    createdAt: '2026-09-20T09:00:00Z'
  },
  {
    id: 'prod-adm-5',
    sku: 'GF-MOON-16COL',
    title: '3D Moon Lamp 16 Colors with Remote & Wooden Stand',
    brand: 'AuraCraft',
    category: 'Gifts',
    subcategory: 'Personalized Gifts',
    currentPrice: 249,
    originalPrice: 799,
    costPrice: 120,
    discountPercentage: 69,
    stock: 35,
    lowStockThreshold: 10,
    binLocation: 'D-01-05',
    image: 'https://images.unsplash.com/photo-1532767153582-b1a0e5145009?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviews: 1840,
    status: 'Active',
    tag: 'BEST GIFT',
    badges: ['Trending', 'Bestseller'],
    description: 'NASA lunar topography mapped romantic 16-color rechargeable dimmable orb with beechwood cradle.',
    dateAdded: '2026-09-22T13:10:00Z',
    createdAt: '2026-09-22T13:10:00Z'
  },
  {
    id: 'prod-adm-6',
    sku: 'CA-VACUUM-120W',
    title: 'High Power Portable Car Vacuum Cleaner 120W Handheld',
    brand: 'AutoCare Pro',
    category: 'Car Accessories',
    subcategory: 'Car Cleaning',
    currentPrice: 299,
    originalPrice: 999,
    costPrice: 160,
    discountPercentage: 70,
    stock: 5, // Low Stock (<10)
    lowStockThreshold: 12,
    binLocation: 'E-04-11',
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    reviews: 620,
    status: 'Active',
    tag: 'CLEARANCE',
    badges: ['Sale', 'Hot Deal'],
    description: 'High performance cyclonic cyclone motor suction for gravel, breadcrumbs and carpet dirt.',
    dateAdded: '2026-09-25T16:00:00Z',
    createdAt: '2026-09-25T16:00:00Z'
  },
  {
    id: 'prod-adm-7',
    sku: 'BB-BOTTLE-WARMER',
    title: 'Multi-Function Baby Milk Bottle Warmer & Sterilizer',
    brand: 'BabyComfort',
    category: 'Baby Items',
    subcategory: 'Feeding',
    currentPrice: 349,
    originalPrice: 899,
    costPrice: 190,
    discountPercentage: 61,
    stock: 22,
    lowStockThreshold: 8,
    binLocation: 'F-03-09',
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviews: 430,
    status: 'Active',
    tag: 'NEW LAUNCH',
    badges: ['New Launch'],
    description: 'Gentle water bath consistent temperature heating to preserve vital breastmilk nutrients.',
    dateAdded: '2026-09-28T09:30:00Z',
    createdAt: '2026-09-28T09:30:00Z'
  },
  {
    id: 'prod-adm-8',
    sku: 'ST-NOTEBOOK-SET',
    title: 'Executive Hardbound Ruled Journal Notebook Set (Pack of 3)',
    brand: 'Zenith Papers',
    category: 'Stationery',
    subcategory: 'Notebooks',
    currentPrice: 179,
    originalPrice: 499,
    costPrice: 90,
    discountPercentage: 64,
    stock: 64,
    lowStockThreshold: 10,
    binLocation: 'G-02-18',
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviews: 790,
    status: 'Draft',
    tag: 'VALUE PACK',
    badges: ['Bestseller'],
    description: '100 GSM bleed-proof ivory paper with ribbon bookmark, inner pocket and elastic closure band.',
    dateAdded: '2026-10-01T15:20:00Z',
    createdAt: '2026-10-01T15:20:00Z'
  },
  {
    id: 'prod-adm-9',
    sku: 'SF-YOGA-MAT-6MM',
    title: 'Anti-Skid Eco TPE Yoga Mat 6mm with Carry Strap',
    brand: 'FitAura',
    category: 'Sports & Fitness',
    subcategory: 'Yoga',
    currentPrice: 329,
    originalPrice: 899,
    costPrice: 170,
    discountPercentage: 63,
    stock: 41,
    lowStockThreshold: 10,
    binLocation: 'H-09-02',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviews: 1120,
    status: 'Active',
    tag: 'PRO CHOICE',
    badges: ['Trending'],
    description: 'Dual textured high density cushioning mat protecting knees and joints during intense workouts.',
    dateAdded: '2026-10-02T10:15:00Z',
    createdAt: '2026-10-02T10:15:00Z'
  },
  {
    id: 'prod-adm-10',
    sku: 'CG-HAMPER-GOLD',
    title: 'Executive Corporate Gift Hamper with Vacuum Flask & Pen',
    brand: 'Prestige B2B',
    category: 'Corporate Gifting',
    subcategory: 'Corporate Sets',
    currentPrice: 499,
    originalPrice: 1299,
    costPrice: 280,
    discountPercentage: 62,
    stock: 58,
    lowStockThreshold: 15,
    binLocation: 'J-01-01',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviews: 320,
    status: 'Active',
    tag: 'CORPORATE PICK',
    badges: ['New Launch', 'Bestseller'],
    description: 'Luxury matte finish presentation gift box with temperature display flask and premium metallic rollerball pen.',
    dateAdded: '2026-10-04T12:00:00Z',
    createdAt: '2026-10-04T12:00:00Z'
  }
];

const DEFAULT_INVENTORY_LOGS: InventoryLog[] = [
  {
    id: 'log-1',
    productId: 'prod-adm-1',
    productTitle: 'Heavy Duty Steel Induction Pressure Cooker 3L',
    productSku: 'HK-COOKER-3L',
    previousStock: 28,
    adjustmentQty: 20,
    newStock: 48,
    reason: 'New Batch Received',
    notes: 'Inbound PO #ABB-9042 from Pune manufacturing unit',
    timestamp: '2026-10-07T14:30:00Z',
    user: 'Admin (Warehouse)'
  },
  {
    id: 'log-2',
    productId: 'prod-adm-3',
    productTitle: 'Wireless Bluetooth Magnetic Neckband 40H Playtime',
    productSku: 'SL-NECKBAND-40H',
    previousStock: 12,
    adjustmentQty: -5,
    newStock: 7,
    reason: 'Damaged / Broken',
    notes: 'Transit packaging rupture on pallet 4',
    timestamp: '2026-10-08T09:15:00Z',
    user: 'Admin (QC)'
  },
  {
    id: 'log-3',
    productId: 'prod-adm-4',
    productTitle: 'Wireless Motion Sensor LED Night Light Bar (Magnetic)',
    productSku: 'HI-SENSOR-BAR',
    previousStock: 4,
    adjustmentQty: -4,
    newStock: 0,
    reason: 'Inventory Count Correction',
    notes: 'Physical count reconciled - marked out of stock',
    timestamp: '2026-10-08T16:00:00Z',
    user: 'Admin (Audit)'
  }
];

const DEFAULT_BADGES = ['Trending', 'Sale', 'New Launch', 'Hot Deal', 'Bestseller', 'Limited Edition', 'Clearance'];

// Load state from localStorage or return default initial state
const loadInitialState = (): AdminProductsState => {
  if (typeof window === 'undefined') {
    return {
      products: DEFAULT_PRODUCTS,
      categories: DEFAULT_CATEGORIES,
      inventoryLogs: DEFAULT_INVENTORY_LOGS,
      selectedProductIds: [],
      availableBadges: DEFAULT_BADGES,
      lastUpdated: new Date().toISOString()
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
        return {
          products: parsed.products,
          categories: parsed.categories || DEFAULT_CATEGORIES,
          inventoryLogs: parsed.inventoryLogs || DEFAULT_INVENTORY_LOGS,
          selectedProductIds: [],
          availableBadges: parsed.availableBadges || DEFAULT_BADGES,
          lastUpdated: parsed.lastUpdated || new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.error('Failed to parse admin_products_store from localStorage:', err);
  }

  return {
    products: DEFAULT_PRODUCTS,
    categories: DEFAULT_CATEGORIES,
    inventoryLogs: DEFAULT_INVENTORY_LOGS,
    selectedProductIds: [],
    availableBadges: DEFAULT_BADGES,
    lastUpdated: new Date().toISOString()
  };
};

const saveStateToStorage = (state: AdminProductsState) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      products: state.products,
      categories: state.categories,
      inventoryLogs: state.inventoryLogs,
      availableBadges: state.availableBadges,
      lastUpdated: state.lastUpdated
    }));
  } catch (err) {
    console.error('Failed to sync to localStorage:', err);
  }
};

const initialState: AdminProductsState = loadInitialState();

export const adminProductsSlice = createSlice({
  name: 'adminProducts',
  initialState,
  reducers: {
    // 1. Add Product: Generates unique ID, sets dateAdded, default status Active, unshifts
    addProduct: (state, action: PayloadAction<Omit<AdminProduct, 'id' | 'dateAdded'> & { id?: string; dateAdded?: string }>) => {
      const now = new Date().toISOString();
      const newProduct: AdminProduct = {
        ...action.payload,
        id: action.payload.id || `prod-${Date.now()}`,
        dateAdded: action.payload.dateAdded || now,
        status: action.payload.status || 'Active',
        rating: action.payload.rating || 5.0,
        reviews: action.payload.reviews || 0,
        lowStockThreshold: action.payload.lowStockThreshold ?? 10,
        createdAt: now,
        updatedAt: now
      };
      state.products.unshift(newProduct);
      state.lastUpdated = now;
      saveStateToStorage(state);
    },

    // 2. Update Product: Finds and mutates in place
    updateProduct: (state, action: PayloadAction<{ id: string; updates: Partial<AdminProduct> }>) => {
      const index = state.products.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = {
          ...state.products[index],
          ...action.payload.updates,
          updatedAt: new Date().toISOString()
        };
        state.lastUpdated = new Date().toISOString();
        saveStateToStorage(state);
      }
    },

    // 3. Delete Product: Permanently removes from array
    deleteProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter((p) => p.id !== action.payload);
      state.selectedProductIds = state.selectedProductIds.filter((id) => id !== action.payload);
      state.lastUpdated = new Date().toISOString();
      saveStateToStorage(state);
    },

    // 4. Archive Product: Marks status as 'Archived'
    archiveProduct: (state, action: PayloadAction<string>) => {
      const prod = state.products.find((p) => p.id === action.payload);
      if (prod) {
        prod.status = 'Archived';
        prod.updatedAt = new Date().toISOString();
        state.lastUpdated = new Date().toISOString();
        saveStateToStorage(state);
      }
    },

    // 5. Toggle Status between Active and Draft
    toggleProductStatus: (state, action: PayloadAction<string>) => {
      const prod = state.products.find((p) => p.id === action.payload);
      if (prod) {
        prod.status = prod.status === 'Active' ? 'Draft' : 'Active';
        prod.updatedAt = new Date().toISOString();
        state.lastUpdated = new Date().toISOString();
        saveStateToStorage(state);
      }
    },

    // 6. Adjust Stock: Updates stock and prepends to inventoryLogs
    adjustStock: (state, action: PayloadAction<{ 
      id: string; 
      adjustmentQty: number; 
      reason: InventoryLog['reason']; 
      notes?: string; 
      user?: string; 
    }>) => {
      const prod = state.products.find((p) => p.id === action.payload.id);
      if (prod) {
        const previousStock = prod.stock;
        const newStock = Math.max(0, previousStock + action.payload.adjustmentQty);
        prod.stock = newStock;
        prod.updatedAt = new Date().toISOString();

        const log: InventoryLog = {
          id: `log-${Date.now()}`,
          productId: prod.id,
          productTitle: prod.title,
          productSku: prod.sku,
          previousStock,
          adjustmentQty: action.payload.adjustmentQty,
          newStock,
          reason: action.payload.reason,
          notes: action.payload.notes,
          timestamp: new Date().toISOString(),
          user: action.payload.user || 'Admin User'
        };

        state.inventoryLogs.unshift(log);
        state.lastUpdated = new Date().toISOString();
        saveStateToStorage(state);
      }
    },

    // 7. Add Category
    addCategory: (state, action: PayloadAction<Omit<AdminCategory, 'id'> & { id?: string }>) => {
      const id = action.payload.id || action.payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = state.categories.find((c) => c.id === id);
      if (!existing) {
        state.categories.push({
          ...action.payload,
          id
        });
        state.lastUpdated = new Date().toISOString();
        saveStateToStorage(state);
      }
    },

    // 8. Update Category
    updateCategory: (state, action: PayloadAction<{ id: string; updates: Partial<AdminCategory> }>) => {
      const cat = state.categories.find((c) => c.id === action.payload.id);
      if (cat) {
        Object.assign(cat, action.payload.updates);
        state.lastUpdated = new Date().toISOString();
        saveStateToStorage(state);
      }
    },

    // 9. Delete Category
    deleteCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter((c) => c.id !== action.payload);
      state.lastUpdated = new Date().toISOString();
      saveStateToStorage(state);
    },

    // 10. Bulk CSV Add Products
    bulkAddProducts: (state, action: PayloadAction<Array<Partial<AdminProduct>>>) => {
      const now = new Date().toISOString();
      action.payload.forEach((raw, idx) => {
        if (!raw.title) return;
        const currentPrice = Number(raw.currentPrice) || 199;
        const originalPrice = Number(raw.originalPrice) || (currentPrice * 2);
        const discountPercentage = Math.max(0, Math.round(((originalPrice - currentPrice) / originalPrice) * 100));

        const item: AdminProduct = {
          id: `prod-${Date.now()}-${idx}`,
          sku: raw.sku || `ABB-${Date.now().toString().slice(-5)}${idx}`,
          title: raw.title,
          brand: raw.brand || 'Generic',
          category: raw.category || 'Home & Kitchen',
          subcategory: raw.subcategory || '',
          currentPrice,
          originalPrice,
          costPrice: Number(raw.costPrice) || Math.round(currentPrice * 0.6),
          discountPercentage,
          stock: Number(raw.stock) || 50,
          lowStockThreshold: Number(raw.lowStockThreshold) || 10,
          binLocation: raw.binLocation || 'Warehouse Main',
          image: raw.image || 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
          rating: 4.8,
          reviews: 12,
          status: (raw.status as any) || 'Active',
          tag: raw.tag || '',
          badges: raw.badges || [],
          description: raw.description || '',
          dateAdded: now,
          createdAt: now
        };
        state.products.unshift(item);
      });
      state.lastUpdated = now;
      saveStateToStorage(state);
    },

    // 11. Bulk Selection Management
    toggleSelectProduct: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selectedProductIds.includes(id)) {
        state.selectedProductIds = state.selectedProductIds.filter((pId) => pId !== id);
      } else {
        state.selectedProductIds.push(id);
      }
    },

    selectAllProducts: (state, action: PayloadAction<string[]>) => {
      state.selectedProductIds = action.payload;
    },

    clearSelection: (state) => {
      state.selectedProductIds = [];
    },

    // 12. Bulk Assign Badge
    assignBadges: (state, action: PayloadAction<{ productIds: string[]; badge: string }>) => {
      const { productIds, badge } = action.payload;
      state.products.forEach((prod) => {
        if (productIds.includes(prod.id)) {
          prod.badges = prod.badges || [];
          if (!prod.badges.includes(badge)) {
            prod.badges.push(badge);
          }
          prod.tag = badge; // also update primary tag
        }
      });
      state.lastUpdated = new Date().toISOString();
      saveStateToStorage(state);
    },

    // 13. Remove Badge from products
    removeBadge: (state, action: PayloadAction<{ productIds: string[]; badge: string }>) => {
      const { productIds, badge } = action.payload;
      state.products.forEach((prod) => {
        if (productIds.includes(prod.id) && prod.badges) {
          prod.badges = prod.badges.filter((b) => b !== badge);
          if (prod.tag === badge) prod.tag = prod.badges[0] || '';
        }
      });
      state.lastUpdated = new Date().toISOString();
      saveStateToStorage(state);
    },

    // 14. Bulk Archive
    bulkArchiveProducts: (state, action: PayloadAction<string[]>) => {
      const ids = action.payload;
      state.products.forEach((prod) => {
        if (ids.includes(prod.id)) {
          prod.status = 'Archived';
        }
      });
      state.selectedProductIds = [];
      state.lastUpdated = new Date().toISOString();
      saveStateToStorage(state);
    },

    // 16. Load Live Products from Backend
    setProductsFromApi: (state, action: PayloadAction<AdminProduct[]>) => {
      if (Array.isArray(action.payload) && action.payload.length > 0) {
        state.products = action.payload;
        state.lastUpdated = new Date().toISOString();
        saveStateToStorage(state);
      }
    },

    // 17. Load Live Categories from Backend
    setCategoriesFromApi: (state, action: PayloadAction<AdminCategory[]>) => {
      if (Array.isArray(action.payload) && action.payload.length > 0) {
        state.categories = action.payload;
        state.lastUpdated = new Date().toISOString();
        saveStateToStorage(state);
      }
    },

    // 18. Reset to default store state
    resetToDefaultStore: (state) => {
      state.products = DEFAULT_PRODUCTS;
      state.categories = DEFAULT_CATEGORIES;
      state.inventoryLogs = DEFAULT_INVENTORY_LOGS;
      state.selectedProductIds = [];
      state.availableBadges = DEFAULT_BADGES;
      state.lastUpdated = new Date().toISOString();
      saveStateToStorage(state);
    }
  }
});

export const {
  addProduct,
  updateProduct,
  deleteProduct,
  archiveProduct,
  toggleProductStatus,
  adjustStock,
  addCategory,
  updateCategory,
  deleteCategory,
  bulkAddProducts,
  toggleSelectProduct,
  selectAllProducts,
  clearSelection,
  assignBadges,
  removeBadge,
  bulkArchiveProducts,
  resetToDefaultStore,
  setProductsFromApi,
  setCategoriesFromApi
} = adminProductsSlice.actions;

export default adminProductsSlice.reducer;
