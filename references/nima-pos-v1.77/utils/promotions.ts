import { Promotion, CartItem, Customer, Category } from '../types';

export const calculateDiscount = (
  cartItems: CartItem[],
  promotions: Promotion[],
  categories: Category[],
  customer?: Customer | null,
  promoCode?: string
): { discountAmount: number; appliedPromotions: Promotion[] } => {
  let totalDiscount = 0;
  let appliedPromotions: Promotion[] = [];
  
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const activePromotions = promotions.filter(promo => {
    if (!promo.isActive) return false;
    
    const now = new Date();
    if (promo.startDate && new Date(promo.startDate) > now) return false;
    if (promo.endDate && new Date(promo.endDate) < now) return false;
    
    if (promo.usageLimit && promo.usedCount && promo.usedCount >= promo.usageLimit) return false;
    
    if (promo.minOrderValue && subtotal < promo.minOrderValue) return false;
    
    if (promo.code && promo.code !== promoCode) return false;

    // Happy Hour specific checks
    if (promo.startTime || promo.endTime || (promo.daysOfWeek && promo.daysOfWeek.length > 0)) {
        const currentDay = now.getDay();
        const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (promo.daysOfWeek && promo.daysOfWeek.length > 0 && !promo.daysOfWeek.includes(currentDay)) {
            return false;
        }
        if (promo.startTime && currentTimeStr < promo.startTime) {
            return false;
        }
        if (promo.endTime && currentTimeStr > promo.endTime) {
            return false;
        }
    }
    
    return true;
  });

  // Sort promotions by value descending to apply the best one first
  activePromotions.sort((a, b) => b.value - a.value);

  let remainingSubtotal = subtotal;

  for (const promo of activePromotions) {
    let promoDiscount = 0;

    switch (promo.target) {
      case 'order':
        if (promo.type === 'combo' && promo.comboBuyProducts && promo.comboGetProducts) {
             const hasBuyProducts = promo.comboBuyProducts.every(pid => 
                 cartItems.some(item => item.id === pid && item.quantity > 0)
             );
             if (hasBuyProducts) {
                 const getItems = cartItems.filter(item => promo.comboGetProducts!.includes(item.id!));
                 if (getItems.length > 0) {
                     switch(promo.value) { // Assuming value here acts as percentage off the "get" products
                         case 100: // 100% off GET items
                            for (const item of getItems) {
                                promoDiscount += (item.price * item.quantity);
                            }
                            break;
                         default:
                             // Percentage discount
                             for (const item of getItems) {
                                promoDiscount += ((item.price * item.quantity) * (promo.value / 100));
                            }
                             break;
                     }
                 }
             }
        } else if (promo.type === 'percentage') {
          promoDiscount = remainingSubtotal * (promo.value / 100);
        } else if (promo.type === 'fixed_amount') {
          promoDiscount = Math.min(promo.value, remainingSubtotal);
        }
        break;
        
      case 'product':
        if (promo.targetIds && promo.targetIds.length > 0) {
          const eligibleItems = cartItems.filter(item => (promo.targetIds as any[]).includes(item.id!));
          const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          if (promo.type === 'percentage') {
            promoDiscount = eligibleSubtotal * (promo.value / 100);
          } else if (promo.type === 'fixed_amount') {
            promoDiscount = Math.min(promo.value, eligibleSubtotal, remainingSubtotal);
          } else if (promo.type === 'bogo' && promo.buyQuantity && promo.getQuantity) {
             for(const item of eligibleItems) {
                 const sets = Math.floor(item.quantity / (promo.buyQuantity + promo.getQuantity));
                 if (sets > 0) {
                     const freeItems = sets * promo.getQuantity;
                     const discountPerFreeItem = item.price * (promo.value / 100);
                     promoDiscount += freeItems * discountPerFreeItem;
                 }
             }
          }
        }
        break;
        
      case 'category':
        if (promo.targetIds && promo.targetIds.length > 0) {
           const targetCategoryNames = categories
             .filter(c => (promo.targetIds as any[]).includes(c.id!))
             .map(c => c.name);
             
           const eligibleItems = cartItems.filter(item => targetCategoryNames.includes(item.category));
           const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
           
           if (promo.type === 'percentage') {
             promoDiscount = eligibleSubtotal * (promo.value / 100);
           } else if (promo.type === 'fixed_amount') {
             promoDiscount = Math.min(promo.value, eligibleSubtotal, remainingSubtotal);
           }
        }
        break;
        
      case 'customer_segment':
          if (customer && promo.targetIds && promo.targetIds.length > 0) {
              const customerTags = customer.tags || [];
              const hasTag = (promo.targetIds as string[]).some(tag => customerTags.includes(tag));
              
              if (hasTag) {
                  if (promo.type === 'percentage') {
                    promoDiscount = remainingSubtotal * (promo.value / 100);
                  } else if (promo.type === 'fixed_amount') {
                    promoDiscount = Math.min(promo.value, remainingSubtotal);
                  }
              }
          }
          break;

      case 'customer_tier':
        if (customer && promo.targetIds && promo.targetIds.length > 0) {
           let customerTier = 'bronze';
           if (customer.totalSpent > 10000) customerTier = 'platinum';
           else if (customer.totalSpent > 5000) customerTier = 'gold';
           else if (customer.totalSpent > 1000) customerTier = 'silver';
           
           if ((promo.targetIds as any[]).includes(customerTier)) {
               if (promo.type === 'percentage') {
                 promoDiscount = remainingSubtotal * (promo.value / 100);
               } else if (promo.type === 'fixed_amount') {
                 promoDiscount = Math.min(promo.value, remainingSubtotal);
               }
           }
        }
        break;
    }

    if (promoDiscount > 0) {
      // Prevent discounts from exceeding the remaining subtotal
      promoDiscount = Math.min(promoDiscount, remainingSubtotal);
      
      // Rounding to 2 decimal places to avoid floating point issues
      promoDiscount = Math.round(promoDiscount * 100) / 100;
      
      totalDiscount += promoDiscount;
      remainingSubtotal -= promoDiscount;
      appliedPromotions.push(promo);
      
      // Stop applying further order-wide promotions if one is already applied to prevent stacking conflicts
      if (promo.target === 'order' && promo.type !== 'combo') {
          break;
      }
    }
  }

  // Final rounding
  totalDiscount = Math.round(totalDiscount * 100) / 100;

  return { discountAmount: totalDiscount, appliedPromotions };
};
