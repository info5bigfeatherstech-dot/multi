/**
 * Canonical 11 Category IDs strictly ordered according to the user's specification:
 * 1. Electronics & Gadgets
 * 2. Gifts & Lifestyle
 * 3. Home & Living
 * 4. Home Decor
 * 5. Jewellery & Accessories
 * 6. Kitchen & Dining
 * 7. Stationery, Office & School
 * 8. Travel & Outdoor
 * 9. Sports & Fitness
 * 10. Beauty & Personal Care
 * 11. Mix Items
 */
export const CANONICAL_CATEGORY_ORDER = [
  'electronics-and-gadgets',
  'gifts-and-lifestyle',
  'home-and-living',
  'home-decor',
  'jewellery-and-accessories',
  'kitchen-and-dining',
  'stationery-office-and-school',
  'travel-and-outdoor',
  'sports-and-fitness',
  'beauty-and-personal-care',
  'mix-items',
] as const;

/**
 * Returns the canonical index (0 to 10) for any category item based on its slug, id, or name.
 * If not matching any canonical category, it returns 100 + (cat.order || 0) so new categories
 * will appear smoothly after the canonical 11 without disrupting their fixed sequence.
 */
export const getCategorySequenceIndex = (cat: {
  id?: string;
  _id?: string;
  slug?: string;
  name?: string;
  order?: number;
  sequence?: number;
  sortOrder?: number;
  position?: number;
}): number => {
  // 1. HIGHEST PRIORITY: Admin panel configured order / sequence
  const adminOrder = [cat.order, cat.sequence, cat.sortOrder, cat.position].find(
    (v) => typeof v === 'number' && !isNaN(v) && v >= 0
  );
  if (adminOrder !== undefined) {
    return adminOrder;
  }

  const normSlug = (cat.slug || cat.id || cat._id || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const normName = (cat.name || '').toLowerCase();

  // 1. Electronics & Gadgets
  if (
    normSlug.includes('electronic') ||
    normSlug.includes('gadget') ||
    normName.includes('electronic') ||
    normName.includes('gadget') ||
    normSlug === 'smart-life-gadget' ||
    normSlug === 'smart-life-gadgets'
  ) {
    return 0;
  }

  // 2. Gifts & Lifestyle
  if (
    normSlug.includes('gift') ||
    normSlug.includes('lifestyle') ||
    normName.includes('gift') ||
    normName.includes('lifestyle')
  ) {
    return 1;
  }

  // 4. Home Decor (check decor before general home)
  if (normSlug.includes('decor') || normName.includes('decor')) {
    return 3;
  }

  // 3. Home & Living (distinguish from Home Decor and Kitchen)
  if (
    normSlug.includes('living') ||
    normName.includes('living') ||
    normSlug.includes('cleaning') ||
    normSlug.includes('housekeeping') ||
    (normSlug.includes('home') && !normSlug.includes('kitchen') && !normSlug.includes('decor')) ||
    (normName.includes('home') && !normName.includes('kitchen') && !normName.includes('decor'))
  ) {
    return 2;
  }

  // 5. Jewellery & Accessories
  if (
    normSlug.includes('jewel') ||
    normName.includes('jewel') ||
    normSlug.includes('access') ||
    normName.includes('access') ||
    normSlug === 'fashion-world'
  ) {
    return 4;
  }

  // 6. Kitchen & Dining
  if (
    normSlug.includes('kitchen') ||
    normName.includes('kitchen') ||
    normSlug.includes('dining') ||
    normName.includes('dining') ||
    normSlug === 'home-kitchen'
  ) {
    return 5;
  }

  // 7. Stationery, Office & School
  if (
    normSlug.includes('station') ||
    normName.includes('station') ||
    normSlug.includes('office') ||
    normName.includes('office') ||
    normSlug.includes('school') ||
    normName.includes('school')
  ) {
    return 6;
  }

  // 8. Travel & Outdoor
  if (
    normSlug.includes('travel') ||
    normName.includes('travel') ||
    normSlug.includes('outdoor') ||
    normName.includes('outdoor') ||
    normSlug.includes('tour') ||
    normName.includes('tour')
  ) {
    return 7;
  }

  // 9. Sports & Fitness
  if (
    normSlug.includes('sport') ||
    normName.includes('sport') ||
    normSlug.includes('fit') ||
    normName.includes('fit')
  ) {
    return 8;
  }

  // 10. Beauty & Personal Care
  if (
    normSlug.includes('beauty') ||
    normName.includes('beauty') ||
    normSlug.includes('personal') ||
    normName.includes('personal') ||
    normSlug.includes('skin') ||
    normName.includes('skin')
  ) {
    return 9;
  }

  // 11. Mix Items
  if (
    normSlug.includes('mix') ||
    normName.includes('mix') ||
    normSlug.includes('combo') ||
    normName.includes('combo') ||
    normSlug.includes('package') ||
    normSlug.includes('wholesale')
  ) {
    return 10;
  }

  // Any other category follows after the canonical 11
  if (typeof cat.order === 'number' && cat.order >= 0) {
    return 11 + cat.order;
  }
  return 100;
};

/**
 * Sorts any list of categories maintaining the canonical 11 sequence.
 */
export const sortCategoriesByCanonicalSequence = <T extends { id?: string; _id?: string; slug?: string; name?: string; order?: number }>(
  categories: T[]
): T[] => {
  return [...categories].sort((a, b) => {
    const idxA = getCategorySequenceIndex(a);
    const idxB = getCategorySequenceIndex(b);
    if (idxA !== idxB) {
      return idxA - idxB;
    }
    return (a.name || '').localeCompare(b.name || '');
  });
};

/**
 * Returns default high-resolution banner image matching the canonical category
 */
export const getFallbackBannerImage = (cat: { id?: string; _id?: string; slug?: string; name?: string }): string => {
  const idx = getCategorySequenceIndex(cat);
  switch (idx) {
    case 0:
      return '/banners/electronics_gadgets.jpg';
    case 1:
      return '/banners/gifts_lifestyle.jpg';
    case 2:
      return '/banners/home_living.jpg';
    case 3:
      return '/banners/home_decor.jpg';
    case 4:
      return '/banners/jewellery_accessories.jpg';
    case 5:
      return '/banners/kitchen_dining.jpg';
    case 6:
      return '/banners/stationery_office_school.jpg';
    case 7:
      return '/banners/travel_outdoor.jpg';
    case 8:
      return '/banners/sports_fitness.jpg';
    case 9:
      return '/banners/beauty_personal_care.jpg';
    case 10:
      return '/banners/mix_items.jpg';
    default:
      return '/banners/mix_items.jpg';
  }
};

/**
 * Dynamically extracts all subcategories for a category from API responses.
 * Inspects:
 * 1. cat.subcategories (strings or objects with name/title)
 * 2. cat.children (nested child categories from backend)
 * 3. allCategories (searching for any category where parent matches cat._id or cat.id or cat.slug)
 *
 * If no subcategories exist in the API, returns an empty array ([]) so that the UI
 * displays the genuine catalog status without hardcoded dummy placeholders.
 */
export const extractSubcategoriesFromCategory = (
  cat: any,
  allCategories: any[] = []
): string[] => {
  if (!cat) return [];

  const isMixItems =
    cat.slug === 'mix-items' ||
    cat.slug === 'mix-item' ||
    (typeof cat.name === 'string' && cat.name.toLowerCase().includes('mix'));
  if (isMixItems) return [];

  const subs: string[] = [];
  const catId = String(cat._id || cat.id || '');
  const catSlug = String(cat.slug || '').toLowerCase();

  // 1. Direct subcategories field if present on category document
  if (Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
    cat.subcategories.forEach((s: any) => {
      if (!s) return;
      const name = typeof s === 'string' ? s : s.name || s.title || s.label;
      if (typeof name === 'string' && name.trim()) {
        subs.push(name.trim());
      }
    });
  }

  // 2. Direct children array from backend Category hierarchy
  if (Array.isArray(cat.children) && cat.children.length > 0) {
    cat.children.forEach((c: any) => {
      if (!c) return;
      const name = typeof c === 'string' ? c : c.name || c.title || c.label;
      if (typeof name === 'string' && name.trim()) {
        subs.push(name.trim());
      }
    });
  }

  // 3. Relational parent check across allCategories list
  if (Array.isArray(allCategories) && allCategories.length > 0) {
    allCategories.forEach((other: any) => {
      if (!other || other === cat) return;
      const parentVal = other.parent;
      const pId = String(parentVal?._id || parentVal?.id || parentVal || '');
      const pSlug = String(parentVal?.slug || '').toLowerCase();

      const isChild =
        (catId && pId === catId) ||
        (catSlug && (pId === catSlug || pSlug === catSlug));

      if (isChild && other.name && typeof other.name === 'string' && other.name.trim()) {
        subs.push(other.name.trim());
      }
    });
  }

  // Deduplicate and filter out empty strings
  return Array.from(new Set(subs.filter(Boolean)));
};
