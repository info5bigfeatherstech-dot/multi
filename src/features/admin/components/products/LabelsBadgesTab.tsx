import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Plus, 
  Tag, 
  Flame, 
  Sparkles, 
  Gift, 
  Star, 
  Box, 
  Eye, 
  EyeOff, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  Percent,
  ShoppingBag,
  Globe,
  Heart,
  Award
} from 'lucide-react';
import { useAppSelector } from '../../../../store/hooks';
import { adminLabelsApi, ProductLabelItem } from '../../../../api/adminApi';

// Default seeded labels matching the store showcase
const INITIAL_DEMO_LABELS: ProductLabelItem[] = [
  {
    id: 'lbl_today',
    name: "Today's Deal",
    slug: 'today-arrival',
    pagePath: '/today-arrival',
    showInNav: true,
    showOnHomepage: true,
    homepageLimit: 10,
    homepageSortOrder: 1,
    storefronts: ['Ecomm', 'Wholesale'],
    productCount: 19,
    isActive: true,
    isDefault: true,
    icon: 'flame',
    badgeText: 'HOT',
    badgeStyle: 'from-amber-600 to-red-600',
  },
  {
    id: 'lbl_sale',
    name: 'On Sale',
    slug: 'on-sale',
    pagePath: '/on-sale',
    showInNav: true,
    showOnHomepage: true,
    homepageLimit: 10,
    homepageSortOrder: 2,
    storefronts: ['Ecomm', 'Wholesale'],
    productCount: 12,
    isActive: true,
    isDefault: true,
    icon: 'flame',
    badgeText: 'HOT',
    badgeStyle: 'from-red-600 to-orange-600',
  },
  {
    id: 'lbl_gandhi',
    name: 'gandhi',
    slug: 'gandhi',
    pagePath: '/tagProducts/gandhi',
    showInNav: true,
    showOnHomepage: true,
    homepageLimit: 10,
    homepageSortOrder: 3,
    storefronts: ['Ecomm', 'Wholesale'],
    productCount: 6,
    isActive: true,
    isDefault: false,
    icon: 'tag',
    badgeText: 'SPECIAL',
    badgeStyle: 'from-amber-500 to-orange-600',
  },
  {
    id: 'lbl_diwali',
    name: 'diwali',
    slug: 'diwali',
    pagePath: '/TagProducts/diwali',
    showInNav: true,
    showOnHomepage: true,
    homepageLimit: 10,
    homepageSortOrder: 4,
    storefronts: ['Ecomm', 'Wholesale'],
    productCount: 5,
    isActive: true,
    isDefault: false,
    icon: 'sparkles',
    badgeText: 'FESTIVE',
    badgeStyle: 'from-yellow-500 to-amber-600',
  },
];

// Comprehensive festival list across all Indian and international celebrations
const FESTIVAL_KEYWORDS = [
  'rakhi',
  'raksha',
  'rakshabandhan',
  'raksha bandhan',
  'diwali',
  'deepavali',
  'dhanteras',
  'bhai dooj',
  'bhaidooj',
  'holi',
  'eid',
  'ramzan',
  'ramadan',
  'christmas',
  'xmas',
  'navratri',
  'navaratri',
  'durga puja',
  'durgapuja',
  'dussehra',
  'dasara',
  'vijayadashami',
  'ganesh',
  'ganpati',
  'ganesh chaturthi',
  'pongal',
  'onam',
  'karwa chauth',
  'karwachauth',
  'festive',
  'festival',
  'mela',
  'utsav',
  'makar sankranti',
  'sankranti',
  'lohri',
  'chath',
  'chhath',
  'janmashtami',
  'krishna janmashtami',
  'teej',
  'shivratri',
  'mahashivratri',
  'guru nanak',
  'gurpurab',
  'baisakhi',
  'vasant panchami',
  'saraswati puja',
  'pateti',
  'hanuman jayanti',
  'ram navami',
];

export interface DetectedTheme {
  type: 'festival' | 'special_day' | 'national' | 'deal' | 'celebration' | 'standard';
  styleName: string;
  icon: string;
  badgeText: string;
  headerStyleColor: string;
  pillContainerClasses: string;
  badgeClasses: string;
  iconClasses: string;
  descriptionText: string;
}

export const detectLabelTheme = (name: string): DetectedTheme => {
  const normalized = (name || '').toLowerCase().trim();
  if (!normalized) {
    return {
      type: 'standard',
      styleName: 'Standard Nav Pill',
      icon: 'tag',
      badgeText: '',
      headerStyleColor: 'text-slate-400',
      pillContainerClasses: 'bg-stone-900 border border-stone-700/80 text-white',
      badgeClasses: 'bg-slate-700 text-white',
      iconClasses: 'text-slate-400',
      descriptionText: 'Standard label. Will appear with clean colors and default styling in the storefront top navbar.',
    };
  }

  // 1. Festivals
  const isFestive = FESTIVAL_KEYWORDS.some((fest) => normalized.includes(fest));
  if (isFestive) {
    return {
      type: 'festival',
      styleName: 'Festive Gold / Diwali',
      icon: 'sparkles',
      badgeText: 'FESTIVE',
      headerStyleColor: 'text-amber-400',
      pillContainerClasses: 'bg-black/75 border border-amber-500/80 text-white shadow-[0_0_15px_rgba(245,158,11,0.35)]',
      badgeClasses: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
      iconClasses: 'text-amber-400 fill-amber-400/20',
      descriptionText: 'Festival celebration detected! Applied festive gold theme, glowing border, and FESTIVE badge.',
    };
  }

  // 2. National Observances & Leaders
  const NATIONAL_KEYWORDS = [
    'gandhi', 'republic', 'independence', 'tiranga', 'desh', 'rashtriya', 'azadi', 'jayanti', 'nehru', 'ambedkar', 'patel'
  ];
  if (NATIONAL_KEYWORDS.some((kw) => normalized.includes(kw))) {
    return {
      type: 'national',
      styleName: 'National Special',
      icon: 'award',
      badgeText: 'SPECIAL',
      headerStyleColor: 'text-orange-400',
      pillContainerClasses: 'bg-stone-900 border border-orange-500/70 text-white shadow-[0_0_12px_rgba(249,115,22,0.3)]',
      badgeClasses: 'bg-gradient-to-r from-orange-600 via-amber-500 to-emerald-600 text-white',
      iconClasses: 'text-orange-400',
      descriptionText: 'National observance detected! Styled with national tricolor accents and SPECIAL badge.',
    };
  }

  // 3. Day Specials (Sunday Special, Weekend Special, etc.)
  const DAY_SPECIAL_KEYWORDS = [
    'sunday', 'weekend', 'saturday', 'friday', 'monday', 'wednesday', 'thursday', 'tuesday',
    'day special', 'today special', 'super sunday', 'mega monday', 'weekend special', 'daily special'
  ];
  if (DAY_SPECIAL_KEYWORDS.some((kw) => normalized.includes(kw))) {
    let badge = 'DAY SPECIAL';
    if (normalized.includes('sunday')) badge = 'SUNDAY';
    else if (normalized.includes('weekend')) badge = 'WEEKEND';
    else if (normalized.includes('friday')) badge = 'FRIDAY';
    else if (normalized.includes('monday')) badge = 'MONDAY';

    return {
      type: 'special_day',
      styleName: 'Day Special',
      icon: 'flame',
      badgeText: badge,
      headerStyleColor: 'text-red-400',
      pillContainerClasses: 'bg-stone-900 border border-red-500/70 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]',
      badgeClasses: 'bg-gradient-to-r from-red-600 to-orange-500 text-white',
      iconClasses: 'text-red-400 fill-red-400/20',
      descriptionText: 'Day Special detected! Applied high-energy day deal styling and badge.',
    };
  }

  // 4. Celebrations (New Year, Valentine, Mother's Day, etc.)
  if (normalized.includes('valentine') || normalized.includes('love') || normalized.includes('rose day')) {
    return {
      type: 'celebration',
      styleName: 'Valentine Special',
      icon: 'heart',
      badgeText: 'SPECIAL',
      headerStyleColor: 'text-rose-400',
      pillContainerClasses: 'bg-stone-900 border border-rose-500/70 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]',
      badgeClasses: 'bg-gradient-to-r from-pink-600 to-rose-600 text-white',
      iconClasses: 'text-rose-400 fill-rose-400/20',
      descriptionText: 'Valentine Special detected! Styled with romantic accents and special badge.',
    };
  }

  if (normalized.includes('new year') || normalized.includes('newyear') || normalized.includes('31st')) {
    return {
      type: 'celebration',
      styleName: 'New Year Special',
      icon: 'sparkles',
      badgeText: 'NEW YEAR',
      headerStyleColor: 'text-purple-400',
      pillContainerClasses: 'bg-stone-900 border border-purple-500/70 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]',
      badgeClasses: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white',
      iconClasses: 'text-purple-400',
      descriptionText: 'New Year celebration detected! Styled with celebration purple accents and NEW YEAR badge.',
    };
  }

  // 5. Flash Deals / Sales / Dhamaka
  const DEAL_KEYWORDS = ['sale', 'deal', 'flash', 'dhamaka', 'loot', 'clearance', 'offer', 'bestseller'];
  if (DEAL_KEYWORDS.some((kw) => normalized.includes(kw))) {
    return {
      type: 'deal',
      styleName: 'Flash Deal / Sale',
      icon: 'flame',
      badgeText: 'HOT',
      headerStyleColor: 'text-orange-400',
      pillContainerClasses: 'bg-stone-900 border border-orange-500/70 text-white shadow-[0_0_12px_rgba(234,88,12,0.3)]',
      badgeClasses: 'bg-gradient-to-r from-red-600 to-amber-600 text-white',
      iconClasses: 'text-orange-400 fill-orange-400/20',
      descriptionText: 'Hot Deal/Sale detected! Applied vibrant deal badge and flame icon.',
    };
  }

  // Standard Default
  return {
    type: 'standard',
    styleName: 'Standard Nav Pill',
    icon: 'tag',
    badgeText: '',
    headerStyleColor: 'text-slate-400',
    pillContainerClasses: 'bg-stone-900 border border-stone-700/80 text-white',
    badgeClasses: 'bg-slate-700 text-white',
    iconClasses: 'text-slate-400',
    descriptionText: 'Standard label. Will appear with standard colors and styling in the storefront top navbar.',
  };
};


export const LabelsBadgesTab: React.FC = () => {
  // Store products from Redux for the assign modal
  const { products } = useAppSelector((state) => state.adminProducts);

  const [labels, setLabels] = useState<ProductLabelItem[]>(() => {
    try {
      const saved = localStorage.getItem('abb_admin_product_labels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_DEMO_LABELS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<ProductLabelItem | null>(null);
  const [assigningLabel, setAssigningLabel] = useState<ProductLabelItem | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<ProductLabelItem | null>(null);

  // Form State matching screenshot - defaults to clean neutral state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formPagePath, setFormPagePath] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStyle, setFormStyle] = useState('Standard Nav Pill');
  const [formShowInNav, setFormShowInNav] = useState(true);
  const [formShowOnHomepage, setFormShowOnHomepage] = useState(false);
  const [formHomepageLimit, setFormHomepageLimit] = useState(10);
  const [formHomepageSortOrder, setFormHomepageSortOrder] = useState(50);
  const [formStorefronts, setFormStorefronts] = useState<string[]>(['Ecomm', 'Wholesale']);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIcon, setFormIcon] = useState('tag');
  const [formBadgeText, setFormBadgeText] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Assign Modal Selection State
  const [assignSearch, setAssignSearch] = useState('');
  const [selectedProductSlugs, setSelectedProductSlugs] = useState<string[]>([]);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Prevent background scrolling whenever any modal popup is open
  useEffect(() => {
    if (isFormModalOpen || assigningLabel || deletingLabel) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFormModalOpen, assigningLabel, deletingLabel]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Sync from live API
  const fetchLabels = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminLabelsApi.getAll();
      const serverList = Array.isArray(res) ? res : res?.data || [];
      if (serverList.length > 0) {
        setLabels(serverList);
        localStorage.setItem('abb_admin_product_labels', JSON.stringify(serverList));
      }
    } catch (err) {
      console.warn('API labels fetch fallback to local store:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  // Lock body scroll while any modal is open
  useEffect(() => {
    if (isFormModalOpen || assigningLabel || deletingLabel) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFormModalOpen, assigningLabel, deletingLabel]);

  // Save to local storage on change
  const persistLabels = (updated: ProductLabelItem[]) => {
    setLabels(updated);
    try {
      localStorage.setItem('abb_admin_product_labels', JSON.stringify(updated));
    } catch {}
  };

  // Open Form Modal for Create
  const handleOpenCreateModal = () => {
    setEditingLabel(null);
    setFormName('');
    setFormSlug('');
    setFormPagePath('');
    setFormDescription('');
    setFormStyle('Standard Nav Pill');
    setFormShowInNav(true);
    setFormShowOnHomepage(false);
    setFormHomepageLimit(10);
    setFormHomepageSortOrder(50);
    setFormStorefronts(['Ecomm', 'Wholesale']);
    setFormIsActive(true);
    setFormIcon('tag');
    setFormBadgeText('');
    setIsFormModalOpen(true);
  };

  // Open Form Modal for Edit
  const handleOpenEditModal = (lbl: ProductLabelItem) => {
    const detected = detectLabelTheme(lbl.name);
    setEditingLabel(lbl);
    setFormName(lbl.name);
    setFormSlug(lbl.slug);
    setFormPagePath(lbl.pagePath || `/TagProducts/${lbl.slug}`);
    setFormDescription(lbl.description || '');
    setFormStyle(lbl.style || detected.styleName);
    setFormShowInNav(lbl.showInNav !== false);
    setFormShowOnHomepage(lbl.showOnHomepage === true);
    setFormHomepageLimit(lbl.homepageLimit || 10);
    setFormHomepageSortOrder(lbl.homepageSortOrder || 50);
    setFormStorefronts(lbl.storefronts || ['Ecomm', 'Wholesale']);
    setFormIsActive(lbl.isActive !== false);
    setFormIcon(lbl.icon || detected.icon);
    setFormBadgeText(lbl.badgeText !== undefined ? lbl.badgeText : detected.badgeText);
    setIsFormModalOpen(true);
  };

  // Auto-generate slug, page path, and dynamically detect festival or day special
  const handleNameChange = (val: string) => {
    setFormName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!editingLabel) {
      setFormSlug(generatedSlug);
      setFormPagePath(generatedSlug ? `/TagProducts/${generatedSlug}` : '');
    }

    // Dynamic detection: if festival or day special is typed, fetch style accordingly; otherwise keep standard!
    const theme = detectLabelTheme(val);
    setFormStyle(theme.styleName);
    setFormIcon(theme.icon);
    setFormBadgeText(theme.badgeText);
  };

  // Submit Create or Edit Label
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) {
      showToast('Name and slug are required fields', 'error');
      return;
    }

    setIsSubmittingForm(true);
    const payload: ProductLabelItem = {
      id: editingLabel?.id || `lbl_${Date.now()}`,
      name: formName.trim(),
      slug: formSlug.trim(),
      pagePath: formPagePath.trim() || `/TagProducts/${formSlug.trim()}`,
      description: formDescription.trim(),
      style: formStyle,
      showInNav: formShowInNav,
      showOnHomepage: formShowOnHomepage,
      homepageLimit: Number(formHomepageLimit) || 10,
      homepageSortOrder: Number(formHomepageSortOrder) || 50,
      storefronts: formStorefronts,
      isActive: formIsActive,
      isDefault: editingLabel ? editingLabel.isDefault : false,
      productCount: editingLabel ? editingLabel.productCount || 0 : 0,
      icon: formIcon,
      badgeText: formBadgeText.trim(),
      badgeStyle: detectLabelTheme(formName).badgeClasses,
    };

    try {
      if (editingLabel) {
        await adminLabelsApi.update(editingLabel.slug || editingLabel.id || '', payload);
        const updated = labels.map((l) => (l.id === editingLabel.id || l.slug === editingLabel.slug ? { ...l, ...payload } : l));
        persistLabels(updated);
        showToast(`Label "${payload.name}" updated successfully!`);
      } else {
        await adminLabelsApi.create(payload);
        const updated = [payload, ...labels];
        persistLabels(updated);
        showToast(`New label "${payload.name}" created!`);
      }
      setIsFormModalOpen(false);
    } catch (err: any) {
      console.warn('Backend label update note:', err);
      // Optimistic local update
      if (editingLabel) {
        const updated = labels.map((l) => (l.id === editingLabel.id ? { ...l, ...payload } : l));
        persistLabels(updated);
        showToast(`Label "${payload.name}" saved!`);
      } else {
        const updated = [payload, ...labels];
        persistLabels(updated);
        showToast(`New label "${payload.name}" saved!`);
      }
      setIsFormModalOpen(false);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Toggle Visibility / Status
  const handleToggleStatus = async (lbl: ProductLabelItem) => {
    const updatedStatus = !lbl.isActive;
    const updatedItem = { ...lbl, isActive: updatedStatus };
    const updatedList = labels.map((l) => (l.id === lbl.id ? updatedItem : l));
    persistLabels(updatedList);

    try {
      await adminLabelsApi.update(lbl.slug || lbl.id || '', { isActive: updatedStatus });
      showToast(`Label "${lbl.name}" ${updatedStatus ? 'activated' : 'deactivated'}.`);
    } catch {
      showToast(`Status updated.`);
    }
  };

  // Toggle Nav Visibility
  const handleToggleNavVisibility = async (lbl: ProductLabelItem) => {
    const updatedNav = !lbl.showInNav;
    const updatedItem = { ...lbl, showInNav: updatedNav };
    const updatedList = labels.map((l) => (l.id === lbl.id ? updatedItem : l));
    persistLabels(updatedList);

    try {
      await adminLabelsApi.update(lbl.slug || lbl.id || '', { showInNav: updatedNav });
      showToast(`Nav visibility set to ${updatedNav ? 'Visible' : 'Hidden'}.`);
    } catch {
      showToast(`Nav visibility toggled.`);
    }
  };

  // Delete Label
  const handleDeleteLabel = async () => {
    if (!deletingLabel) return;
    const target = deletingLabel;
    const updated = labels.filter((l) => l.id !== target.id && l.slug !== target.slug);
    persistLabels(updated);
    setDeletingLabel(null);

    try {
      await adminLabelsApi.delete(target.slug || target.id || '');
      showToast(`Label "${target.name}" removed.`);
    } catch {
      showToast(`Label removed.`);
    }
  };

  // Open Assign Products Modal
  const handleOpenAssignModal = (lbl: ProductLabelItem) => {
    setAssigningLabel(lbl);
    setAssignSearch('');

    // Pre-select products that currently have this flag/badge
    const matched = products
      .filter((p) => {
        const flagType = lbl.slug.toLowerCase();
        const hasBadge = p.badges?.some((b: string) => b.toLowerCase() === flagType || b.toLowerCase() === lbl.name.toLowerCase());
        const hasTag = p.tag?.toLowerCase() === flagType || p.tag?.toLowerCase() === lbl.name.toLowerCase();
        return hasBadge || hasTag;
      })
      .map((p) => (p as any).slug || p.sku || p.id);

    setSelectedProductSlugs(matched);
  };

  // Submit Assigned Products
  const handleSubmitAssign = async () => {
    if (!assigningLabel) return;
    setIsSubmittingAssign(true);

    try {
      await adminLabelsApi.updateFlags({
        slugs: selectedProductSlugs,
        flagType: assigningLabel.slug,
        value: true,
      });

      // Update product count for this label
      const newCount = selectedProductSlugs.length;
      const updatedList = labels.map((l) => (l.id === assigningLabel.id ? { ...l, productCount: newCount } : l));
      persistLabels(updatedList);

      showToast(`Updated! ${newCount} products now assigned to "${assigningLabel.name}".`);
      setAssigningLabel(null);
    } catch (err: any) {
      console.warn('Assign flag notice:', err);
      const newCount = selectedProductSlugs.length;
      const updatedList = labels.map((l) => (l.id === assigningLabel.id ? { ...l, productCount: newCount } : l));
      persistLabels(updatedList);
      showToast(`Assigned ${newCount} products to "${assigningLabel.name}".`);
      setAssigningLabel(null);
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Filtered Labels List
  const filteredLabels = useMemo(() => {
    if (!searchQuery.trim()) return labels;
    const q = searchQuery.toLowerCase().trim();
    return labels.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.slug.toLowerCase().includes(q) ||
        (l.pagePath && l.pagePath.toLowerCase().includes(q))
    );
  }, [labels, searchQuery]);

  // Filtered Products for Assign Modal
  const assignFilteredProducts = useMemo(() => {
    if (!assignSearch.trim()) return products;
    const q = assignSearch.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, assignSearch]);

  // Helper: Render Icon component
  const renderLabelIcon = (iconName?: string) => {
    switch (iconName) {
      case 'sparkles':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />;
      case 'gift':
        return <Gift className="w-3.5 h-3.5 text-rose-400" />;
      case 'heart':
        return <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />;
      case 'award':
      case 'flag':
        return <Award className="w-3.5 h-3.5 text-orange-400" />;
      case 'star':
        return <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/20" />;
      case 'percent':
        return <Percent className="w-3.5 h-3.5 text-emerald-400" />;
      case 'flame':
        return <Flame className="w-3.5 h-3.5 text-red-400 fill-red-400/20 animate-pulse" />;
      case 'tag':
      default:
        return <Tag className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 font-roboto">
      {/* 1. TOP HEADER & SEARCH BAR */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-navy tracking-tight flex items-center gap-2.5">
              <Tag className="w-5 h-5 text-[#A44101]" />
              <span>Product Labels &amp; Marketing Badges</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create dynamic header navigation pills, automated homepage shelves, and product ribbon flags
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLabels}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Refresh Labels"
            >
              <RefreshCw className={`w-4 h-4 text-[#A44101] ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Label</span>
            </button>
          </div>
        </div>

        {/* Global Search Bar exactly matching screenshot */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Labels by Name, Slug, or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy focus:outline-none focus:border-[#A44101] focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-fadeIn flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 2. LABELS TABLE (EXACT VISUAL MATCH TO SCREENSHOT) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-5 sm:px-6">LABEL</th>
                <th className="py-4 px-4">CLICK URL</th>
                <th className="py-4 px-4">STOREFRONTS</th>
                <th className="py-4 px-4">PRODUCTS</th>
                <th className="py-4 px-4">STATUS</th>
                <th className="py-4 px-5 sm:px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLabels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <span>No product labels found matching "{searchQuery}"</span>
                  </td>
                </tr>
              ) : (
                filteredLabels.map((lbl) => {
                  const isActive = lbl.isActive !== false;
                  return (
                    <tr key={lbl.id || lbl.slug} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. LABEL & STOREFRONT NAV PILL PREVIEW */}
                      <td className="py-4 px-5 sm:px-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-navy text-sm">{lbl.name}</span>
                            {lbl.isDefault && (
                              <span className="bg-orange-50 text-[#A44101] border border-orange-200/80 text-[10px] font-black px-1.5 py-0.2 rounded uppercase">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-slate-400 block -mt-1">
                            {lbl.slug}
                          </span>

                          {/* EXACT LIVE STOREFRONT NAV PILL PREVIEW */}
                          <div className="pt-0.5">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c1917] border border-stone-800 shadow-sm text-white select-none hover:scale-102 transition-transform cursor-default">
                              {renderLabelIcon(lbl.icon)}
                              <span className="font-extrabold text-xs tracking-tight text-stone-100 capitalize">
                                {lbl.name}
                              </span>
                              {lbl.badgeText && (
                                <span className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                                  {lbl.badgeText}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. CLICK URL & DISPLAY TARGETS */}
                      <td className="py-4 px-4 align-top pt-4.5">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-slate-800 block text-xs">
                            {lbl.pagePath || `/TagProducts/${lbl.slug}`}
                          </span>
                          {lbl.showInNav !== false && (
                            <span className="text-emerald-600 font-semibold text-[11px] block">
                              Shown in storefront nav
                            </span>
                          )}
                          {lbl.showOnHomepage !== false && (
                            <span className="text-[#A44101] font-semibold text-[11px] block">
                              Homepage - up to {lbl.homepageLimit || 10} products
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. STOREFRONTS */}
                      <td className="py-4 px-4 align-top pt-4.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(lbl.storefronts && lbl.storefronts.length > 0 ? lbl.storefronts : ['Ecomm', 'Wholesale']).map((sf) => (
                            <span
                              key={sf}
                              className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200/90"
                            >
                              {sf}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* 4. PRODUCTS COUNT */}
                      <td className="py-4 px-4 align-top pt-4.5">
                        <span className="font-extrabold text-navy text-sm">
                          {lbl.productCount ?? 0}
                        </span>
                      </td>

                      {/* 5. STATUS PILL */}
                      <td className="py-4 px-4 align-top pt-4.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(lbl)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border cursor-pointer transition-all ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                          title={`Click to ${isActive ? 'deactivate' : 'activate'}`}
                        >
                          {isActive ? 'ACTIVE' : 'DRAFT'}
                        </button>
                      </td>

                      {/* 6. ACTIONS (EXACT 4 ICONS) */}
                      <td className="py-4 px-5 sm:px-6 align-top pt-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* 1. Assign Products (Package/Box Icon) */}
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(lbl)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Assign & Manage Products"
                          >
                            <Box className="w-4 h-4" />
                          </button>

                          {/* 2. Visibility Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleNavVisibility(lbl)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#A44101] hover:bg-orange-50 transition-colors cursor-pointer"
                            title={lbl.showInNav ? 'Hide from Header Nav' : 'Show in Header Nav'}
                          >
                            {lbl.showInNav ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-slate-300" />}
                          </button>

                          {/* 3. Edit (Pencil Icon) */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(lbl)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Label Configuration"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* 4. Delete (Trash Icon) */}
                          <button
                            type="button"
                            onClick={() => setDeletingLabel(lbl)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Label"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: CREATE OR EDIT LABEL (MATCHING SCREENSHOT)
          ========================================================================= */}
      {isFormModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-[#333333]/85 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFormModalOpen(false);
          }}
        >
          <div className="bg-white rounded-[26px] max-w-[500px] w-full p-7 sm:p-8 shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4 animate-scaleUp text-slate-800">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {editingLabel ? 'Edit Label' : 'Add Label'}
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  {editingLabel ? `PUT /admin/product-labels/${editingLabel.id}` : 'POST /admin/product-labels'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Name * Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. rakhi, diwali, holi"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#f97316] text-sm text-slate-900 focus:outline-none focus:border-[#f97316] font-medium"
                />
              </div>

              {/* Slug Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Slug
                </label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => {
                    setFormSlug(e.target.value);
                    if (!editingLabel) setFormPagePath(`/TagProducts/${e.target.value}`);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 bg-white focus:outline-none focus:border-[#f97316]"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Lowercase letters, numbers, hyphens. Used in ?tags=
                </span>
              </div>

              {/* Click URL (page path) Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Click URL (page path)
                </label>
                <input
                  type="text"
                  value={formPagePath}
                  onChange={(e) => setFormPagePath(e.target.value)}
                  placeholder="/TagProducts/rakhi"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 bg-white focus:outline-none focus:border-[#f97316]"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Relative path only. Storefront opens this when the label is clicked.
                </span>
              </div>

              {/* STOREFRONT NAVBAR APPEARANCE (Live preview card matching dynamic theme) */}
              {(() => {
                const currentTheme = detectLabelTheme(formName);
                return (
                  <div className="rounded-2xl bg-[#0d1527] p-4 text-white space-y-2.5 border border-slate-800 shadow-md">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                      <span className="text-slate-300">STOREFRONT NAVBAR APPEARANCE</span>
                      <span className={`font-bold ${currentTheme.headerStyleColor}`}>Style: {formStyle}</span>
                    </div>

                    <div className="pt-0.5 pb-0.5">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full select-none transition-all ${currentTheme.pillContainerClasses}`}>
                        {renderLabelIcon(formIcon)}
                        <span className="font-extrabold text-sm tracking-tight text-white lowercase">
                          {formName || 'label-name'}
                        </span>
                        {formBadgeText && (
                          <span className={`text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs ${currentTheme.badgeClasses}`}>
                            {formBadgeText}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed font-normal">
                      {currentTheme.descriptionText}
                    </p>
                  </div>
                );
              })()}

              {/* Description Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#f97316] resize-none"
                />
              </div>

              {/* Sort order + Checkboxes Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Sort order
                  </label>
                  <input
                    type="number"
                    value={formHomepageSortOrder}
                    onChange={(e) => setFormHomepageSortOrder(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#f97316]"
                  />
                </div>

                <div className="space-y-2 pt-2 sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Active</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formShowInNav}
                      onChange={(e) => setFormShowInNav(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Show in nav</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formShowOnHomepage}
                      onChange={(e) => setFormShowOnHomepage(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Show on homepage</span>
                  </label>
                </div>
              </div>

              {/* Storefronts Row */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span>Storefronts</span>
                </div>
                <div className="flex items-center gap-5">
                  {['Ecomm', 'Wholesale'].map((sf) => (
                    <label key={sf} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formStorefronts.includes(sf)}
                        onChange={(e) => {
                          if (e.target.checked) setFormStorefronts((prev) => [...prev, sf]);
                          else setFormStorefronts((prev) => prev.filter((s) => s !== sf));
                        }}
                        className="w-4 h-4 rounded text-blue-600 accent-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>{sf}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-6 py-2.5 rounded-full border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-6 py-2.5 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center gap-2 transition-all active:scale-98 disabled:opacity-60"
                >
                  {isSubmittingForm && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingLabel ? 'Save changes' : 'Create label'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          MODAL 2: ASSIGN PRODUCTS TO LABEL (BOX ICON)
          ========================================================================= */}
      {assigningLabel && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-[#333333]/85 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAssigningLabel(null);
          }}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[90vh] flex flex-col space-y-4 animate-scaleUp">
            <button
              type="button"
              onClick={() => setAssigningLabel(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-navy text-white flex items-center justify-center shrink-0">
                <Box className="w-5 h-5 text-[#A44101]" />
              </div>
              <div>
                <h3 className="text-base font-black text-navy flex items-center gap-2">
                  <span>Assign Products to "{assigningLabel.name}"</span>
                  <span className="text-xs bg-[#A44101]/10 text-[#A44101] px-2 py-0.5 rounded-full font-mono">
                    {assigningLabel.slug}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select products to attach to this marketing collection and storefront shelf
                </p>
              </div>
            </div>

            {/* Search and Bulk Select */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products by title, SKU, category..."
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy focus:outline-none focus:border-[#A44101]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allSlugs = assignFilteredProducts.map((p) => (p as any).slug || p.sku || p.id);
                    setSelectedProductSlugs(allSlugs);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProductSlugs([])}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Products Selection List */}
            <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-100 pr-1 text-xs">
              {assignFilteredProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <span>No products found matching "{assignSearch}"</span>
                </div>
              ) : (
                assignFilteredProducts.map((p) => {
                  const pKey = (p as any).slug || p.sku || p.id;
                  const isChecked = selectedProductSlugs.includes(pKey);

                  return (
                    <label
                      key={pKey}
                      className={`py-3 px-2 flex items-center justify-between gap-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${
                        isChecked ? 'bg-orange-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductSlugs([...selectedProductSlugs, pKey]);
                            } else {
                              setSelectedProductSlugs(selectedProductSlugs.filter((s) => s !== pKey));
                            }
                          }}
                          className="w-4 h-4 rounded text-[#A44101] focus:ring-[#A44101] shrink-0"
                        />
                        <img
                          src={p.image || (p as any).imageUrl || 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=200&q=80'}
                          alt={p.title}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=200&q=80';
                          }}
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-navy truncate text-xs">{p.title}</h4>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            SKU: {p.sku || p.id} • {p.category || 'General'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-navy text-xs block">
                          ₹{p.currentPrice || (p as any).price || 0}
                        </span>
                        <span className={`text-[10px] font-bold ${p.stock > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                <strong className="text-navy font-bold">{selectedProductSlugs.length}</strong> products selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningLabel(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAssign}
                  disabled={isSubmittingAssign}
                  className="px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isSubmittingAssign ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Flag Assignments</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          MODAL 3: DELETE CONFIRMATION
          ========================================================================= */}
      {deletingLabel && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-[#333333]/85 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingLabel(null);
          }}
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-navy">Delete Label?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>"{deletingLabel.name}"</strong>? It will no longer appear on storefront navigation or homepage shelves.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingLabel(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteLabel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer"
              >
                Delete Label
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LabelsBadgesTab;
