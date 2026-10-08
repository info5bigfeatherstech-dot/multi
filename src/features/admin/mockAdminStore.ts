// ============================================================================
// Mock Admin Store - 100% Frontend-Only LocalStorage State Manager
// Zero backend or API dependencies. All mutations persist across page refreshes.
// ============================================================================

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator';
  avatar?: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned' | 'RTO';

export interface GiftIntentPayload {
  isGift: boolean;
  recipientName: string;
  senderName: string;
  occasion: 'Birthday 🎂' | 'Anniversary 💍' | 'Festival 🪔' | 'Custom 🎁' | string;
  giftMessage: string;
  updatedAt?: string;
}

export interface AdminOrderItem {
  id: string;
  productId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  sku: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  status: OrderStatus;
  paymentMethod: 'COD' | 'UPI' | 'Card' | 'NetBanking';
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  totalAmount: number;
  subtotal: number;
  discount: number;
  items: AdminOrderItem[];
  isGiftOrder: boolean;
  giftIntent?: GiftIntentPayload;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProduct {
  id: string;
  sku: string;
  title: string;
  category: string;
  currentPrice: number;
  originalPrice: number;
  discountPercentage: number;
  stock: number;
  image: string;
  rating: number;
  reviews: number;
  status: 'Active' | 'Draft';
  tag?: string;
  createdAt: string;
}

export interface AdminAbandonedCart {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  cartValue: number;
  itemCount: number;
  items: { title: string; price: number; qty: number }[];
  abandonedAt: string;
  recoveryStatus: 'Uncontacted' | 'WhatsApp Sent' | 'Recovered';
}

export interface AdminLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  interestCategory: string;
  source: 'Organic' | 'WhatsApp' | 'Instagram' | 'Checkout Dropoff' | 'Support Form';
  createdAt: string;
  status: 'New' | 'Contacted' | 'Converted';
}

export interface AdminCoupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  usageCount: number;
  maxUsage: number;
  expiresAt: string;
  status: 'Active' | 'Expired';
}

const STORAGE_KEYS = {
  SESSION: 'abb_admin_session_v1',
  ORDERS: 'abb_admin_orders_v1',
  PRODUCTS: 'abb_admin_products_v1',
  CARTS: 'abb_admin_abandoned_carts_v1',
  LEADS: 'abb_admin_leads_v1',
  COUPONS: 'abb_admin_coupons_v1',
  SETTINGS: 'abb_admin_settings_v1',
};

// ----------------------------------------------------------------------------
// Initial Seed Data
// ----------------------------------------------------------------------------

export const INITIAL_SEED_ORDERS: AdminOrder[] = [
  {
    id: "ord-101",
    orderNumber: "ABB-2026-9041",
    customerName: "Aarav Sharma",
    customerEmail: "aarav.sharma@gmail.com",
    customerPhone: "+91 98201 44521",
    shippingAddress: "Flat 402, Sunshine Heights, Andheri West, Mumbai, Maharashtra - 400053",
    status: "Pending",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    totalAmount: 548,
    subtotal: 548,
    discount: 0,
    isGiftOrder: true,
    giftIntent: {
      isGift: true,
      recipientName: "Rohan Sharma",
      senderName: "Aarav Sharma",
      occasion: "Birthday 🎂",
      giftMessage: "Happy 25th Birthday bhai! Hope this pressure cooker and tiffin set helps with your new flat cooking adventures. Have a fantastic year ahead!",
      updatedAt: "2026-10-08T09:30:00Z"
    },
    items: [
      {
        id: "item-1",
        productId: "hk-1",
        title: "Heavy Duty Steel Induction Pressure Cooker 3L",
        image: "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80",
        price: 399,
        quantity: 1,
        sku: "HK-COOKER-3L"
      },
      {
        id: "item-2",
        productId: "hk-2",
        title: "Stainless Steel Tiffin Lunch Box with Pouch",
        image: "https://images.unsplash.com/photo-1594998893017-36147cbcae05?auto=format&fit=crop&w=600&q=80",
        price: 149,
        quantity: 1,
        sku: "HK-TIFFIN-STEEL"
      }
    ],
    createdAt: "2026-10-08T09:15:00Z",
    updatedAt: "2026-10-08T09:30:00Z"
  },
  {
    id: "ord-102",
    orderNumber: "ABB-2026-9042",
    customerName: "Pooja Patel",
    customerEmail: "pooja.patel@yahoo.com",
    customerPhone: "+91 99130 88219",
    shippingAddress: "B-12 Shukan Residency, Vastrapur, Ahmedabad, Gujarat - 380015",
    status: "Confirmed",
    paymentMethod: "COD",
    paymentStatus: "Pending",
    totalAmount: 498,
    subtotal: 498,
    discount: 0,
    isGiftOrder: true,
    giftIntent: {
      isGift: true,
      recipientName: "Meera & Kunal",
      senderName: "Pooja & Family",
      occasion: "Anniversary 💍",
      giftMessage: "Wishing both of you a wonderful 5th Wedding Anniversary! May your home always be filled with love and delightful food.",
      updatedAt: "2026-10-08T08:10:00Z"
    },
    items: [
      {
        id: "item-3",
        productId: "gf-1",
        title: "3D Moon Lamp 16 Colors with Remote & Wooden Stand",
        image: "https://images.unsplash.com/photo-1532767153582-b1a0e5145009?auto=format&fit=crop&w=600&q=80",
        price: 249,
        quantity: 2,
        sku: "GF-MOON-16COL"
      }
    ],
    createdAt: "2026-10-08T08:00:00Z",
    updatedAt: "2026-10-08T08:10:00Z"
  },
  {
    id: "ord-103",
    orderNumber: "ABB-2026-9043",
    customerName: "Vikram Malhotra",
    customerEmail: "vikram.m@rediffmail.com",
    customerPhone: "+91 98110 55432",
    shippingAddress: "Plot 88, Sector 14, Gurugram, Haryana - 122001",
    status: "Processing",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    totalAmount: 648,
    subtotal: 648,
    discount: 0,
    isGiftOrder: false,
    items: [
      {
        id: "item-4",
        productId: "ca-1",
        title: "360° Rotatable Dashboard & Windshield Car Phone Mount",
        image: "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=600&q=80",
        price: 199,
        quantity: 1,
        sku: "CA-MOUNT-360"
      },
      {
        id: "item-5",
        productId: "ca-2",
        title: "High Power 120W Portable Handheld Car Vacuum Cleaner",
        image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80",
        price: 399,
        quantity: 1,
        sku: "CA-VACUUM-120W"
      }
    ],
    createdAt: "2026-10-08T07:20:00Z",
    updatedAt: "2026-10-08T07:45:00Z"
  },
  {
    id: "ord-104",
    orderNumber: "ABB-2026-9044",
    customerName: "Deepak Verma",
    customerEmail: "deepak.verma88@gmail.com",
    customerPhone: "+91 94150 11982",
    shippingAddress: "House 24, Civil Lines, Jaipur, Rajasthan - 302006",
    status: "Shipped",
    paymentMethod: "Card",
    paymentStatus: "Paid",
    totalAmount: 796,
    subtotal: 796,
    discount: 0,
    isGiftOrder: true,
    giftIntent: {
      isGift: true,
      recipientName: "Aditi Verma",
      senderName: "Deepak Verma",
      occasion: "Festival 🪔",
      giftMessage: "Happy Diwali dearest Aditi! Enjoy this special wellness gift and sparkling decorative light set for your study desk.",
      updatedAt: "2026-10-07T18:40:00Z"
    },
    items: [
      {
        id: "item-6",
        productId: "bp-1",
        title: "Natural Rose Quartz Facial Jade Roller & Gua Sha Set",
        image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80",
        price: 149,
        quantity: 2,
        sku: "BP-JADE-GUASHA"
      },
      {
        id: "item-7",
        productId: "sl-1",
        title: "Wireless Bluetooth Magnetic Neckband 40H Playtime",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        price: 249,
        quantity: 2,
        sku: "SL-NECKBAND-40H"
      }
    ],
    createdAt: "2026-10-07T18:00:00Z",
    updatedAt: "2026-10-07T21:15:00Z"
  },
  {
    id: "ord-105",
    orderNumber: "ABB-2026-9045",
    customerName: "Sneha Mukherjee",
    customerEmail: "sneha.mukh@gmail.com",
    customerPhone: "+91 98300 77123",
    shippingAddress: "Flat 3C, Lake View Enclave, Salt Lake Sector 1, Kolkata, West Bengal - 700064",
    status: "Delivered",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    totalAmount: 398,
    subtotal: 398,
    discount: 0,
    isGiftOrder: false,
    items: [
      {
        id: "item-8",
        productId: "sf-1",
        title: "Pro Resistance Loop Bands Set (5-Pack with Pouch)",
        image: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=600&q=80",
        price: 199,
        quantity: 2,
        sku: "SF-LOOP-BANDS"
      }
    ],
    createdAt: "2026-10-06T14:10:00Z",
    updatedAt: "2026-10-08T06:30:00Z"
  },
  {
    id: "ord-106",
    orderNumber: "ABB-2026-9046",
    customerName: "Karthik Rajan",
    customerEmail: "karthik.rajan@outlook.com",
    customerPhone: "+91 94440 22910",
    shippingAddress: "12, 4th Cross Street, Indiranagar, Bengaluru, Karnataka - 560038",
    status: "Delivered",
    paymentMethod: "Card",
    paymentStatus: "Paid",
    totalAmount: 299,
    subtotal: 299,
    discount: 0,
    isGiftOrder: true,
    giftIntent: {
      isGift: true,
      recipientName: "Little Aryan",
      senderName: "Karthik Chachu",
      occasion: "Custom 🎁",
      giftMessage: "To our little champion! Have fun with your new flying boomerang ball and stay awesome!",
      updatedAt: "2026-10-06T10:10:00Z"
    },
    items: [
      {
        id: "item-9",
        productId: "gf-2",
        title: "Magic Flying Spinner Boomerang Orb Drone Ball with LED",
        image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80",
        price: 299,
        quantity: 1,
        sku: "GF-FLYING-BALL"
      }
    ],
    createdAt: "2026-10-05T12:00:00Z",
    updatedAt: "2026-10-07T11:20:00Z"
  },
  {
    id: "ord-107",
    orderNumber: "ABB-2026-9047",
    customerName: "Manish Reddy",
    customerEmail: "manish.reddy@gmail.com",
    customerPhone: "+91 98490 66201",
    shippingAddress: "Plot 15, Jubilee Hills Road No 36, Hyderabad, Telangana - 500033",
    status: "Cancelled",
    paymentMethod: "COD",
    paymentStatus: "Pending",
    totalAmount: 399,
    subtotal: 399,
    discount: 0,
    isGiftOrder: false,
    items: [
      {
        id: "item-10",
        productId: "hi-2",
        title: "Multipurpose Electric Screwdriver & Drill Bits 47-Piece Kit",
        image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80",
        price: 399,
        quantity: 1,
        sku: "HI-DRILL-KIT"
      }
    ],
    createdAt: "2026-10-06T16:45:00Z",
    updatedAt: "2026-10-06T17:15:00Z"
  },
  {
    id: "ord-108",
    orderNumber: "ABB-2026-9048",
    customerName: "Ananya Deshmukh",
    customerEmail: "ananya.d@gmail.com",
    customerPhone: "+91 97650 33918",
    shippingAddress: "Apartment 101, Kothrud, Pune, Maharashtra - 411038",
    status: "Pending",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    totalAmount: 428,
    subtotal: 428,
    discount: 0,
    isGiftOrder: true,
    giftIntent: {
      isGift: true,
      recipientName: "Tanvi Deshmukh",
      senderName: "Ananya",
      occasion: "Birthday 🎂",
      giftMessage: "Happy Birthday di! Sending you the cute silicone feeding kit & teether set for baby Advik. Love you heaps!",
      updatedAt: "2026-10-08T11:00:00Z"
    },
    items: [
      {
        id: "item-11",
        productId: "bi-1",
        title: "BPA-Free Silicone Fresh Fruit Food Feeder Pacifier",
        image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80",
        price: 79,
        quantity: 2,
        sku: "BI-SILICONE-FEED"
      },
      {
        id: "item-12",
        productId: "bi-3",
        title: "Anti-Colic Feeding Bottle with Dual Handles 250ml",
        image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80",
        price: 149,
        quantity: 1,
        sku: "BI-FEEDING-BOTTLE"
      }
    ],
    createdAt: "2026-10-08T10:50:00Z",
    updatedAt: "2026-10-08T11:00:00Z"
  },
  {
    id: "ord-109",
    orderNumber: "ABB-2026-9049",
    customerName: "Rakesh Tiwari",
    customerEmail: "rakesh.tiwari@gmail.com",
    customerPhone: "+91 94500 88291",
    shippingAddress: "Gomti Nagar, Lucknow, Uttar Pradesh - 226010",
    status: "Returned",
    paymentMethod: "COD",
    paymentStatus: "Refunded",
    totalAmount: 179,
    subtotal: 179,
    discount: 0,
    isGiftOrder: false,
    items: [
      {
        id: "item-13",
        productId: "ch-1",
        title: "Rechargeable Electric Lint Remover Fabric Shaver",
        image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=600&q=80",
        price: 179,
        quantity: 1,
        sku: "CH-LINT-REMOVER"
      }
    ],
    createdAt: "2026-10-04T09:00:00Z",
    updatedAt: "2026-10-07T14:00:00Z"
  },
  {
    id: "ord-110",
    orderNumber: "ABB-2026-9050",
    customerName: "Sanjay Singhania",
    customerEmail: "sanjay.s@gmail.com",
    customerPhone: "+91 98290 11429",
    shippingAddress: "Sector 5, Mansarovar, Jaipur, Rajasthan - 302020",
    status: "RTO",
    paymentMethod: "COD",
    paymentStatus: "Pending",
    totalAmount: 299,
    subtotal: 299,
    discount: 0,
    isGiftOrder: false,
    items: [
      {
        id: "item-14",
        productId: "fw-1",
        title: "Pure Cotton Regular Fit Casual Formal Shirt",
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
        price: 299,
        quantity: 1,
        sku: "FW-SHIRT-COTTON"
      }
    ],
    createdAt: "2026-10-03T11:00:00Z",
    updatedAt: "2026-10-06T15:30:00Z"
  }
];

export const INITIAL_SEED_PRODUCTS: AdminProduct[] = [
  {
    id: "prod-adm-1",
    sku: "HK-COOKER-3L",
    title: "Heavy Duty Steel Induction Pressure Cooker 3L",
    category: "Home & Kitchen",
    currentPrice: 399,
    originalPrice: 899,
    discountPercentage: 56,
    stock: 48,
    image: "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    reviews: 3180,
    status: "Active",
    tag: "MEGA DEAL",
    createdAt: "2026-09-15T10:00:00Z"
  },
  {
    id: "prod-adm-2",
    sku: "HK-TIFFIN-STEEL",
    title: "Stainless Steel Tiffin Lunch Box with Carry Pouch",
    category: "Home & Kitchen",
    currentPrice: 149,
    originalPrice: 399,
    discountPercentage: 63,
    stock: 120,
    image: "https://images.unsplash.com/photo-1594998893017-36147cbcae05?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    reviews: 1420,
    status: "Active",
    tag: "HOT SELLER",
    createdAt: "2026-09-16T11:00:00Z"
  },
  {
    id: "prod-adm-3",
    sku: "SL-NECKBAND-40H",
    title: "Wireless Bluetooth Magnetic Neckband 40H Playtime",
    category: "Smart Life Gadget",
    currentPrice: 249,
    originalPrice: 799,
    discountPercentage: 69,
    stock: 75,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    rating: 4.6,
    reviews: 840,
    status: "Active",
    tag: "TOP RATED",
    createdAt: "2026-09-18T14:30:00Z"
  },
  {
    id: "prod-adm-4",
    sku: "HI-SENSOR-BAR",
    title: "Wireless Motion Sensor LED Night Light Bar (Magnetic)",
    category: "Home Improvement",
    currentPrice: 149,
    originalPrice: 499,
    discountPercentage: 70,
    stock: 62,
    image: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    reviews: 980,
    status: "Active",
    tag: "HOT SELLER",
    createdAt: "2026-09-20T09:00:00Z"
  },
  {
    id: "prod-adm-5",
    sku: "GF-MOON-16COL",
    title: "3D Moon Lamp 16 Colors with Remote & Wooden Stand",
    category: "Gifts & Novelties",
    currentPrice: 249,
    originalPrice: 799,
    discountPercentage: 69,
    stock: 35,
    image: "https://images.unsplash.com/photo-1532767153582-b1a0e5145009?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    reviews: 1840,
    status: "Active",
    tag: "BEST GIFT",
    createdAt: "2026-09-22T13:10:00Z"
  },
  {
    id: "prod-adm-6",
    sku: "CA-MOUNT-360",
    title: "360° Rotatable Dashboard & Windshield Car Phone Mount",
    category: "Car Accessories",
    currentPrice: 199,
    originalPrice: 699,
    discountPercentage: 72,
    stock: 94,
    image: "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    reviews: 920,
    status: "Active",
    tag: "AUTO CARE",
    createdAt: "2026-09-25T15:20:00Z"
  },
  {
    id: "prod-adm-7",
    sku: "SF-LOOP-BANDS",
    title: "Pro Resistance Loop Bands Set (5-Pack with Pouch)",
    category: "Sports & Fitness",
    currentPrice: 199,
    originalPrice: 599,
    discountPercentage: 67,
    stock: 14,
    image: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    reviews: 650,
    status: "Active",
    tag: "LOW STOCK",
    createdAt: "2026-09-28T16:00:00Z"
  },
  {
    id: "prod-adm-8",
    sku: "ST-TABLET-85",
    title: "8.5 Inch LCD Writing & Drawing Tablet with Stylus",
    category: "Stationary",
    currentPrice: 149,
    originalPrice: 499,
    discountPercentage: 70,
    stock: 0,
    image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    reviews: 1430,
    status: "Active",
    tag: "OUT OF STOCK",
    createdAt: "2026-10-01T10:45:00Z"
  },
  {
    id: "prod-adm-9",
    sku: "BP-JADE-ROLLER",
    title: "Natural Rose Quartz Facial Jade Roller & Gua Sha Set",
    category: "Beauty & Personal Care",
    currentPrice: 149,
    originalPrice: 499,
    discountPercentage: 70,
    stock: 55,
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    reviews: 1780,
    status: "Active",
    tag: "GLOW KIT",
    createdAt: "2026-10-02T12:00:00Z"
  },
  {
    id: "prod-adm-10",
    sku: "FW-PREMIUM-POLO",
    title: "Premium Knitted Collar Polo T-Shirt (Draft Prototype)",
    category: "Fashion World",
    currentPrice: 349,
    originalPrice: 999,
    discountPercentage: 65,
    stock: 50,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
    rating: 4.5,
    reviews: 12,
    status: "Draft",
    tag: "PREVIEW",
    createdAt: "2026-10-05T14:00:00Z"
  }
];

export const INITIAL_SEED_CARTS: AdminAbandonedCart[] = [
  {
    id: "cart-1",
    customerName: "Rahul Saxena",
    customerPhone: "+91 98199 44321",
    customerEmail: "rahul.saxena@gmail.com",
    cartValue: 748,
    itemCount: 2,
    items: [
      { title: "Induction Pressure Cooker 3L", price: 399, qty: 1 },
      { title: "Wireless Neckband 40H", price: 249, qty: 1 }
    ],
    abandonedAt: "12 minutes ago",
    recoveryStatus: "Uncontacted"
  },
  {
    id: "cart-2",
    customerName: "Nisha Gupta",
    customerPhone: "+91 97233 11849",
    customerEmail: "nisha.g@yahoo.com",
    cartValue: 498,
    itemCount: 2,
    items: [
      { title: "3D Moon Lamp 16 Colors", price: 249, qty: 2 }
    ],
    abandonedAt: "45 minutes ago",
    recoveryStatus: "WhatsApp Sent"
  },
  {
    id: "cart-3",
    customerName: "Pradeep Joshi",
    customerPhone: "+91 94220 99823",
    customerEmail: "pradeep.j@rediff.com",
    cartValue: 399,
    itemCount: 1,
    items: [
      { title: "Electric Screwdriver 47-Piece Kit", price: 399, qty: 1 }
    ],
    abandonedAt: "2 hours ago",
    recoveryStatus: "Recovered"
  }
];

export const INITIAL_SEED_LEADS: AdminLead[] = [
  {
    id: "lead-1",
    name: "Sunil Bajaj",
    phone: "+91 98200 12345",
    email: "sunil.bajaj@gmail.com",
    interestCategory: "Home & Kitchen",
    source: "Checkout Dropoff",
    createdAt: "2026-10-08T08:00:00Z",
    status: "New"
  },
  {
    id: "lead-2",
    name: "Meenakshi Sundaram",
    phone: "+91 94440 98765",
    email: "meenakshi@gmail.com",
    interestCategory: "Gifts & Novelties",
    source: "WhatsApp",
    createdAt: "2026-10-07T16:30:00Z",
    status: "Contacted"
  },
  {
    id: "lead-3",
    name: "Tarun Kapoor",
    phone: "+91 98111 23456",
    email: "tarun.k@hotmail.com",
    interestCategory: "Car Accessories",
    source: "Instagram",
    createdAt: "2026-10-07T11:15:00Z",
    status: "Converted"
  }
];

export const INITIAL_SEED_COUPONS: AdminCoupon[] = [
  {
    id: "coup-1",
    code: "DHAMAKA10",
    discountType: "percentage",
    discountValue: 10,
    minOrderValue: 499,
    usageCount: 184,
    maxUsage: 500,
    expiresAt: "2026-12-31",
    status: "Active"
  },
  {
    id: "coup-2",
    code: "GIFT50",
    discountType: "fixed",
    discountValue: 50,
    minOrderValue: 399,
    usageCount: 92,
    maxUsage: 250,
    expiresAt: "2026-11-15",
    status: "Active"
  },
  {
    id: "coup-3",
    code: "FREESHIP",
    discountType: "fixed",
    discountValue: 40,
    minOrderValue: 299,
    usageCount: 420,
    maxUsage: 1000,
    expiresAt: "2026-12-31",
    status: "Active"
  }
];

// ----------------------------------------------------------------------------
// LocalStorage Store Engine
// ----------------------------------------------------------------------------

class MockAdminStoreEngine {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.ensureInitialized();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Error in mockAdminStore listener', err);
      }
    });
  }

  public ensureInitialized(): void {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_SEED_ORDERS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_SEED_PRODUCTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.CARTS)) {
        localStorage.setItem(STORAGE_KEYS.CARTS, JSON.stringify(INITIAL_SEED_CARTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.LEADS)) {
        localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(INITIAL_SEED_LEADS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.COUPONS)) {
        localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(INITIAL_SEED_COUPONS));
      }
    } catch (e) {
      console.warn('localStorage access failed in MockAdminStoreEngine', e);
    }
  }

  public resetToFactoryDefaults(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_SEED_ORDERS));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_SEED_PRODUCTS));
      localStorage.setItem(STORAGE_KEYS.CARTS, JSON.stringify(INITIAL_SEED_CARTS));
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(INITIAL_SEED_LEADS));
      localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(INITIAL_SEED_COUPONS));
      this.notify();
    } catch (e) {
      console.error(e);
    }
  }

  // --------------------------------------------------------------------------
  // Authentication & Session
  // --------------------------------------------------------------------------

  public getCurrentUser(): AdminUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!data) return null;
      return JSON.parse(data) as AdminUser;
    } catch {
      return null;
    }
  }

  public isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  public login(email: string, _password?: string): AdminUser {
    const user: AdminUser = {
      id: 'usr-admin-01',
      name: 'Admin Manager',
      email: email.trim() || 'admin@store.com',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    };
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    this.notify();
    return user;
  }

  public logout(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch (e) {
      console.error(e);
    }
    this.notify();
  }

  // --------------------------------------------------------------------------
  // Orders & Gift Intent
  // --------------------------------------------------------------------------

  public getOrders(): AdminOrder[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (!raw) return INITIAL_SEED_ORDERS;
      return JSON.parse(raw) as AdminOrder[];
    } catch {
      return INITIAL_SEED_ORDERS;
    }
  }

  public getOrderById(orderId: string): AdminOrder | undefined {
    return this.getOrders().find((o) => o.id === orderId);
  }

  public updateOrderStatus(orderId: string, status: OrderStatus): boolean {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return false;

    orders[idx] = {
      ...orders[idx],
      status,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      this.notify();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  public updateGiftIntent(orderId: string, giftData: Partial<GiftIntentPayload>): boolean {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return false;

    const currentGift = orders[idx].giftIntent || {
      isGift: true,
      recipientName: '',
      senderName: orders[idx].customerName,
      occasion: 'Birthday 🎂',
      giftMessage: '',
    };

    const updatedGift: GiftIntentPayload = {
      ...currentGift,
      ...giftData,
      isGift: true,
      updatedAt: new Date().toISOString(),
    };

    orders[idx] = {
      ...orders[idx],
      isGiftOrder: true,
      giftIntent: updatedGift,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      this.notify();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  public deleteGiftIntent(orderId: string): boolean {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return false;

    orders[idx] = {
      ...orders[idx],
      isGiftOrder: false,
      giftIntent: undefined,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      this.notify();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // Products Management
  // --------------------------------------------------------------------------

  public getProducts(): AdminProduct[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!raw) return INITIAL_SEED_PRODUCTS;
      return JSON.parse(raw) as AdminProduct[];
    } catch {
      return INITIAL_SEED_PRODUCTS;
    }
  }

  public addProduct(productData: Omit<AdminProduct, 'id' | 'createdAt'>): AdminProduct {
    const products = this.getProducts();
    const newProduct: AdminProduct = {
      ...productData,
      id: `prod-adm-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    products.unshift(newProduct);
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      this.notify();
    } catch (e) {
      console.error(e);
    }
    return newProduct;
  }

  public updateProduct(productId: string, updates: Partial<AdminProduct>): boolean {
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) return false;

    products[idx] = {
      ...products[idx],
      ...updates,
    };

    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      this.notify();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  public deleteProduct(productId: string): boolean {
    const products = this.getProducts().filter((p) => p.id !== productId);
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      this.notify();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // Leads & Abandoned Carts
  // --------------------------------------------------------------------------

  public getAbandonedCarts(): AdminAbandonedCart[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CARTS);
      if (!raw) return INITIAL_SEED_CARTS;
      return JSON.parse(raw) as AdminAbandonedCart[];
    } catch {
      return INITIAL_SEED_CARTS;
    }
  }

  public updateCartStatus(cartId: string, status: AdminAbandonedCart['recoveryStatus']): boolean {
    const carts = this.getAbandonedCarts();
    const idx = carts.findIndex((c) => c.id === cartId);
    if (idx === -1) return false;
    carts[idx].recoveryStatus = status;
    try {
      localStorage.setItem(STORAGE_KEYS.CARTS, JSON.stringify(carts));
      this.notify();
      return true;
    } catch {
      return false;
    }
  }

  public getLeads(): AdminLead[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LEADS);
      if (!raw) return INITIAL_SEED_LEADS;
      return JSON.parse(raw) as AdminLead[];
    } catch {
      return INITIAL_SEED_LEADS;
    }
  }

  public getCoupons(): AdminCoupon[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COUPONS);
      if (!raw) return INITIAL_SEED_COUPONS;
      return JSON.parse(raw) as AdminCoupon[];
    } catch {
      return INITIAL_SEED_COUPONS;
    }
  }

  // --------------------------------------------------------------------------
  // Dashboard Metrics & Bucket Counters
  // --------------------------------------------------------------------------

  public getDashboardKPIs() {
    const orders = this.getOrders();
    const products = this.getProducts();
    const carts = this.getAbandonedCarts();
    const leads = this.getLeads();

    const totalRevenue = orders
      .filter((o) => o.status !== 'Cancelled' && o.status !== 'Returned')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const giftOrderCount = orders.filter((o) => o.isGiftOrder).length;

    // Bucket counts
    const buckets = {
      pending: orders.filter((o) => o.status === 'Pending').length,
      confirmed: orders.filter((o) => o.status === 'Confirmed').length,
      processing: orders.filter((o) => o.status === 'Processing').length,
      shipped: orders.filter((o) => o.status === 'Shipped').length,
      delivered: orders.filter((o) => o.status === 'Delivered').length,
      cancelled: orders.filter((o) => o.status === 'Cancelled').length,
      returned: orders.filter((o) => o.status === 'Returned').length,
      rto: orders.filter((o) => o.status === 'RTO').length,
    };

    const activeProductsCount = products.filter((p) => p.status === 'Active').length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;

    return {
      totalRevenue,
      totalOrders: orders.length,
      giftOrders: giftOrderCount,
      totalCustomers: leads.length + orders.length,
      activeProducts: activeProductsCount,
      outOfStockCount,
      abandonedCartsCount: carts.length,
      buckets,
    };
  }
}

export const mockAdminStore = new MockAdminStoreEngine();
