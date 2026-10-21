import { ProductItem, getAllProducts, getProductById } from '../data/storeData';
import { apiClient } from '../api/client';
import { storefrontProductsApi } from '../api/storefrontApi';

/**
 * Converts text into a clean, SEO-friendly URL slug.
 * Example: "Artificial Radha Krishna Temple Motif Jhumka Earrings for Women"
 * => "artificial-radha-krishna-temple-motif-jhumka-earrings-for-women"
 */
export const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars except spaces & hyphens
    .replace(/[\s_-]+/g, '-') // convert spaces and underscores to single hyphen
    .replace(/^-+|-+$/g, ''); // trim leading and trailing hyphens
};

/**
 * Extracts or generates the clean URL slug for a product.
 * Guarantees URLs look like `/product/artificial-radha-krishna-temple-motif-jhumka-earrings-for-women`
 */
export const getProductSlug = (product: {
  slug?: string;
  title?: string;
  name?: string;
  id?: string;
}): string => {
  // If product has an existing readable slug that is NOT a raw 24-char hex MongoDB ID
  if (
    product.slug &&
    product.slug.trim() &&
    !/^[0-9a-fA-F]{24}$/.test(product.slug.trim()) &&
    product.slug.trim().length > 3
  ) {
    return slugify(product.slug);
  }

  // Derive slug from title or name
  const candidate = product.title || product.name || '';
  if (candidate && candidate.trim()) {
    const s = slugify(candidate);
    if (s) return s;
  }

  return slugify(product.slug || product.id || 'product');
};

/**
 * Validates whether a product is currently active and eligible for storefront display.
 */
export const isProductActive = (p: any): boolean => {
  if (!p) return false;

  // Status check
  const status = String(p.status || '').trim().toLowerCase();
  if (status === 'inactive' || status === 'draft' || status === 'archived') {
    return false;
  }

  // Explicit flags
  if (p.isActive === false || p.isArchived === true) {
    return false;
  }

  // Channel status checks (ecommerce)
  const ecommStatus = String(
    p.channelStatus?.ecomm ||
    p.channelVisibility?.ecomm ||
    (typeof p.channelStatus === 'string' ? p.channelStatus : '')
  ).trim().toLowerCase();
  if (ecommStatus === 'inactive' || ecommStatus === 'draft' || ecommStatus === 'archived') {
    return false;
  }

  return true;
};

/**
 * Normalizes raw backend product data into the standard ProductItem interface.
 */
export const mapBackendProductToItem = (p: any): ProductItem => {
  const img =
    p.variants?.[0]?.images?.[0]?.url ||
    (typeof p.variants?.[0]?.images?.[0] === 'string' ? p.variants?.[0]?.images?.[0] : null) ||
    p.cardImage?.url ||
    (Array.isArray(p.images) && p.images[0]?.url) ||
    (typeof p.thumbnail === 'string' && p.thumbnail.startsWith('http') ? p.thumbnail : null) ||
    p.image ||
    p.category?.cardImage?.url ||
    p.category?.image?.url ||
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80';

  const currentPrice = Number(
    p.minPrice ||
    p.variants?.[0]?.finalPrice ||
    p.variants?.[0]?.price?.current ||
    p.variants?.[0]?.price?.sale ||
    p.price ||
    99
  );

  const originalPrice = Number(
    p.variants?.[0]?.price?.base ||
    p.originalPrice ||
    Math.round(currentPrice * 1.6)
  );

  const discountPercentage = Number(
    p.maxDiscountPercentage ||
    p.variants?.[0]?.discountPercentage ||
    Math.max(10, Math.round(((originalPrice - currentPrice) / (originalPrice || 1)) * 100))
  );

  const catName = p.category
    ? typeof p.category === 'string'
      ? p.category
      : p.category.name || p.category.slug || ''
    : 'General';

  const title = p.title || p.name || 'Product';
  const cleanSlug = getProductSlug({ slug: p.slug, title, name: p.name, id: p._id || p.id });

  return {
    id: p._id || p.id || cleanSlug,
    slug: cleanSlug,
    title,
    category: catName || 'General',
    currentPrice,
    originalPrice,
    discountPercentage,
    image: img,
    rating: typeof p.rating === 'number' ? p.rating : (p.rating?.value || 4.8),
    reviews: p.rating?.count || p.soldInfo?.count || 142,
    inStock: p.inStock !== undefined ? p.inStock : true,
    isTopDeal: discountPercentage >= 40,
    tag: p.appliedTags?.[0] || (discountPercentage >= 50 ? 'MEGA DEAL' : undefined),
    status: p.status,
    isActive: isProductActive(p),
  };
};

/**
 * Caches product in sessionStorage for instant retrieval on page reload.
 */
export const cacheProduct = (product: ProductItem): void => {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(product);
    sessionStorage.setItem('abb_selected_product', serialized);

    if (product.id) {
      sessionStorage.setItem(`abb_prod_${product.id}`, serialized);
    }
    if (product.slug) {
      sessionStorage.setItem(`abb_prod_${slugify(product.slug)}`, serialized);
    }
    const titleSlug = slugify(product.title || '');
    if (titleSlug) {
      sessionStorage.setItem(`abb_prod_${titleSlug}`, serialized);
    }
  } catch (err) {
    console.warn('Failed to cache product to sessionStorage:', err);
  }
};

/**
 * Synchronously retrieves cached product from mock catalog or sessionStorage.
 */
export const getCachedProduct = (identifier: string): ProductItem | null => {
  if (typeof window === 'undefined' || !identifier) return null;

  const rawClean = identifier.trim().toLowerCase();
  const slugClean = slugify(identifier);

  // 1. Direct ID match in storeData
  const localDirect = getProductById(identifier) || getProductById(rawClean);
  if (localDirect && isProductActive(localDirect)) return localDirect;

  // 2. Check all products in catalog
  const all = getAllProducts();
  const foundLocal = all.find((p) => {
    const pSlug = slugify(p.slug || '');
    const pTitleSlug = slugify(p.title || '');
    return (
      p.id?.toLowerCase() === rawClean ||
      p.id === identifier ||
      pSlug === slugClean ||
      pTitleSlug === slugClean ||
      (pTitleSlug && slugClean && (pTitleSlug.includes(slugClean) || slugClean.includes(pTitleSlug)))
    );
  });
  if (foundLocal && isProductActive(foundLocal)) return foundLocal;

  // 3. Check sessionStorage
  try {
    const specific =
      sessionStorage.getItem(`abb_prod_${slugClean}`) ||
      sessionStorage.getItem(`abb_prod_${rawClean}`) ||
      sessionStorage.getItem(`abb_prod_${identifier}`);
    if (specific) {
      const parsed = JSON.parse(specific);
      if (isProductActive(parsed)) {
        return parsed;
      } else {
        sessionStorage.removeItem(`abb_prod_${slugClean}`);
        sessionStorage.removeItem(`abb_prod_${rawClean}`);
        sessionStorage.removeItem(`abb_prod_${identifier}`);
      }
    }

    const last = sessionStorage.getItem('abb_selected_product');
    if (last) {
      const parsed = JSON.parse(last);
      const parsedSlug = slugify(parsed.slug || '');
      const parsedTitleSlug = slugify(parsed.title || '');
      if (
        parsed.id === identifier ||
        parsed.id?.toLowerCase() === rawClean ||
        parsedSlug === slugClean ||
        parsedTitleSlug === slugClean ||
        (parsedTitleSlug && slugClean && (parsedTitleSlug.includes(slugClean) || slugClean.includes(parsedTitleSlug)))
      ) {
        if (isProductActive(parsed)) {
          return parsed;
        } else {
          sessionStorage.removeItem('abb_selected_product');
        }
      }
    }
  } catch (err) {
    console.warn('Failed reading product from sessionStorage:', err);
  }

  return null;
};

/**
 * Asynchronously resolves a product from cache, slug lookup, or full catalog search.
 */
export const fetchProductByIdentifier = async (identifier: string): Promise<ProductItem | null> => {
  if (!identifier) return null;

  // 1. Fast path: check synchronous cache first
  const cached = getCachedProduct(identifier);
  if (cached && isProductActive(cached)) return cached;

  const cleanSlug = slugify(identifier);
  const rawParam = identifier.trim();

  // 2. Attempt fetching via getBySlug
  try {
    const res = await storefrontProductsApi.getBySlug(cleanSlug);
    const detail = res?.product || res?.data || res;
    if (detail && (detail._id || detail.id || detail.title || detail.name)) {
      if (!isProductActive(detail)) return null;
      const mapped = mapBackendProductToItem(detail);
      cacheProduct(mapped);
      return mapped;
    }
  } catch {
    // If slug lookup failed, fallback to raw parameter or catalog search
  }

  if (rawParam !== cleanSlug) {
    try {
      const res = await storefrontProductsApi.getBySlug(rawParam);
      const detail = res?.product || res?.data || res;
      if (detail && (detail._id || detail.id || detail.title || detail.name)) {
        if (!isProductActive(detail)) return null;
        const mapped = mapBackendProductToItem(detail);
        cacheProduct(mapped);
        return mapped;
      }
    } catch {}
  }

  // 3. Fallback: Search all catalog products by slug, title slug, _id, or SKU
  try {
    const listRes: any = await apiClient.get('/products/all?limit=250');
    const rawList = listRes.data?.products || listRes.data?.data || (Array.isArray(listRes.data) ? listRes.data : []);
    if (Array.isArray(rawList) && rawList.length > 0) {
      const match = rawList.find((p: any) => {
        if (!isProductActive(p)) return false;
        const pSlug = slugify(p.slug || '');
        const pTitleSlug = slugify(p.title || p.name || '');
        return (
          p._id === rawParam ||
          p.id === rawParam ||
          pSlug === cleanSlug ||
          pTitleSlug === cleanSlug ||
          (pTitleSlug && cleanSlug && (pTitleSlug.includes(cleanSlug) || cleanSlug.includes(pTitleSlug))) ||
          p.sku === rawParam ||
          p.variants?.some(
            (v: any) =>
              v._id === rawParam ||
              v.id === rawParam ||
              v.sku === rawParam ||
              v.productCode === rawParam
          )
        );
      });

      if (match) {
        const mapped = mapBackendProductToItem(match);
        cacheProduct(mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('Failed fetching catalog fallback for product:', err);
  }

  // 4. Fallback: Search endpoint with keyword tokens extracted from slug
  try {
    const words = cleanSlug
      .split('-')
      .filter((w) => w.length > 3 && !['with', 'from', 'this', 'that', 'your'].includes(w))
      .slice(0, 4)
      .join(' ');

    if (words) {
      const searchResults = await storefrontProductsApi.search(words, 10);
      const list = Array.isArray(searchResults) ? searchResults : [];
      if (list.length > 0) {
        const match =
          list.find((p: any) => {
            if (!isProductActive(p)) return false;
            const pSlug = slugify(p.slug || '');
            const pTitleSlug = slugify(p.title || p.name || '');
            return (
              pSlug === cleanSlug ||
              pTitleSlug === cleanSlug ||
              (pTitleSlug && cleanSlug && (pTitleSlug.includes(cleanSlug) || cleanSlug.includes(pTitleSlug)))
            );
          });

        if (match) {
          const mapped = mapBackendProductToItem(match);
          cacheProduct(mapped);
          return mapped;
        }
      }
    }
  } catch {}

  return null;
};
