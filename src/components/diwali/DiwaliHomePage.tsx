import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Toran } from './Toran';
import { DiwaliHeroSlider } from './DiwaliHeroSlider';
import { DiwaliCountdown } from './DiwaliCountdown';
import { DiwaliDivider } from './DiwaliDivider';
import { CategoriesSection } from '../CategoriesSection';
import { NewArrivalsSection } from '../NewArrivalsSection';
import { CategoryShowcaseSections } from '../CategoryShowcaseSections';
import { ProductItem } from '../../data/storeData';

export interface DiwaliHomePageProps {
  onSelectCategory?: (categoryId: string, subcategory?: string) => void;
  onSelectProduct?: (product: ProductItem) => void;
  onExploreAll?: () => void;
}

export const DiwaliHomePage: React.FC<DiwaliHomePageProps> = ({
  onSelectCategory,
  onSelectProduct,
  onExploreAll,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const sectionAnim = {
    initial: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.5, ease: 'easeOut' },
  };

  return (
    <div className="diwali-home bg-[#FFFDF9] min-h-screen relative text-slate-800">
      
      {/* 1. Traditional Marigold & Mango Leaf Toran at the very top */}
      <Toran />

      {/* 2. Diwali Hero Section with 4 Animated Festive Slides */}
      <DiwaliHeroSlider onSelectCategory={onSelectCategory} />

      {/* 3. Festive Offer Live Countdown Strip */}
      <DiwaliCountdown />

      {/* 4. Top Categories Section with Diwali Festive Accents */}
      <motion.div {...sectionAnim} className="relative">
        <CategoriesSection 
          onSelectCategory={onSelectCategory} 
          isDiwali={true} 
        />
      </motion.div>

      {/* Festive Golden Diya Divider */}
      <DiwaliDivider />

      {/* 5. New Arrivals (Fresh Festive Picks) */}
      <motion.div {...sectionAnim} className="relative">
        <NewArrivalsSection
          onProductClick={onSelectProduct}
          onExploreAll={onExploreAll}
          isDiwali={true}
        />
      </motion.div>

      {/* Festive Golden Diya Divider */}
      <DiwaliDivider />

      {/* 6. Dedicated 11 Catalog Departments */}
      <motion.div {...sectionAnim} className="relative">
        <CategoryShowcaseSections
          onProductClick={onSelectProduct}
          onCategoryClick={onSelectCategory}
          isDiwali={true}
        />
      </motion.div>

    </div>
  );
};

