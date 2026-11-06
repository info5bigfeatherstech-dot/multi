import React from 'react';
import {
  SameDayOption,
  ShippingSpeed,
} from './types';

interface CheckoutShippingSpeedCardsProps {
  selected?: ShippingSpeed;
  standardCharges?: number | null;
  sameDayOption?: SameDayOption;
  standardEnabled?: boolean;
  unavailableMessage?: string | null;
  disabled?: boolean;
  onSelect?: (speed: ShippingSpeed) => void;
}

/**
 * CheckoutShippingSpeedCards
 * Same-day delivery has been removed from customer UI. Orders use standard pan-India delivery.
 */
export const CheckoutShippingSpeedCards: React.FC<CheckoutShippingSpeedCardsProps> = () => {
  return null;
};
