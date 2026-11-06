/**
 * DIWALI FESTIVE THEME MASTER CONFIG
 * 
 * Set DIWALI_THEME = true to enable the festive Diwali theme on the HOME PAGE ONLY.
 * Set DIWALI_THEME = false to instantly revert the Home page back to the default theme.
 * All other routes and flows (Cart, Checkout, Product Details, Auth, Admin, etc.)
 * remain 100% untouched regardless of this flag.
 */
export const DIWALI_THEME = true;

export const DIWALI_CONFIG = {
  // Festive sale end date for the countdown strip (Nov 15, 2026 Midnight)
  saleEndDate: '2026-11-15T23:59:59',
  announcementText: '✨ Happy Diwali! Festive Sale Live — Up to 50% OFF + Free Pan-India Delivery ✨',
  discountBadgeText: 'DIWALI SPECIAL',
  palette: {
    maroon: '#7A0C1E',
    orange: '#FF8A00',
    yellow: '#FFC107',
    gold: '#D4AF37',
    cream: '#FFF8E7',
    purple: '#1B0B2E',
  },
};

