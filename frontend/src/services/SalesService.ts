
import { db } from '../db';
import { debug } from '../utils/debug';
import { AccountingEngine } from './AccountingEngine';
import { Order, CartItem, User, AppSettings, ProductUnit, Promotion, JournalEntryLine } from '../types';
import { logActivity } from '../utils/logger';

// Helper for safe currency and inventory math (Computation Engine)
export const safeRound = (num: number, precision: number = 6) => {
    const factor = Math.pow(10, precision);
    return Math.round((num + Number.EPSILON) * factor) / factor;
};

// Computation Engine for Unit Conversion and Recipe Scaling
export class CalculationEngine {
    static calculateRecipeDeduction(recipeItems: any[], yieldQuantity: number, effectiveSaleQuantity: number) {
        const baseYield = yieldQuantity || 1;
        // Ensures floating point precision when scaling recipes (e.g. Grams to Kg)
        const scaleFactor = effectiveSaleQuantity / baseYield;
        
        return recipeItems.map(item => {
            const exactQuantity = item.quantity * scaleFactor;
            return {
                productId: item.productId,
                // Using 6 decimals max for avoiding floating point drift
                qtyToDeduct: safeRound(exactQuantity, 6)
            };
        });
    }

    /**
     * Pure Domain Logic: Calculates the financial totals for an order.
     * Separates the computation logic from UI (Fat Models, Skinny Controllers).
     */
    static calculateTotals(
        cart: CartItem[],
        discountType: 'fixed' | 'percent',
        discountValue: number,
        taxRate: number,
        orderType: string,
        deliveryFee: number = 0,
        settings?: AppSettings,
        promoResult?: { discountAmount: number, appliedPromotions: Promotion[] },
        loyaltyPointsUsed: number = 0
    ) {
        let subtotal = 0;
        cart.forEach(item => {
            const itemTotal = (item.price * item.quantity) - (item.itemDiscount || 0);
            subtotal += itemTotal; 
        });
        
        let calculatedDiscount = 0;
        
        // 1. Manual Discount
        if (subtotal > 0) {
            calculatedDiscount = discountType === 'fixed' ? discountValue : (subtotal * discountValue) / 100;
            calculatedDiscount = Math.min(calculatedDiscount, subtotal);
        }
        
        // 2. Promotions Discount 
        let appliedPromotions: Promotion[] | undefined = undefined;
        if (promoResult && promoResult.discountAmount > 0) {
           // Prevent double discounting: If there are promotions applied, ignore manual discount
           calculatedDiscount = promoResult.discountAmount;
           appliedPromotions = promoResult.appliedPromotions;
        }
        
        // 3. Loyalty Points Discount
        const loyaltyDiscount = loyaltyPointsUsed * (settings?.loyaltySettings?.currencyPerPoint || 0);
        calculatedDiscount += loyaltyDiscount;
        
        calculatedDiscount = Math.min(calculatedDiscount, subtotal);

        const tax = (subtotal - calculatedDiscount) * (taxRate / 100);
        
        let serviceChargeAmount = 0;
        if (orderType === 'dine-in' && settings?.posSettings?.dineInServiceChargeRate) {
            serviceChargeAmount = (subtotal - calculatedDiscount) * (settings.posSettings.dineInServiceChargeRate / 100);
        }
        
        const total = subtotal - calculatedDiscount + tax + serviceChargeAmount + (orderType === 'delivery' ? deliveryFee : 0);
        
        return { 
            subtotal: safeRound(subtotal, 4), 
            discountAmount: safeRound(calculatedDiscount, 4), 
            tax: safeRound(tax, 4), 
            serviceChargeAmount: safeRound(serviceChargeAmount, 4), 
            total: safeRound(total, 4), 
            appliedPromotions 
        };
    }
}

interface SaleParams {
    cart: CartItem[];
    totals: { subtotal: number; discountAmount: number; tax: number; total: number; appliedPromotions?: Promotion[] };
    paymentMethod: 'cash' | 'card' | 'credit' | 'wallet' | 'split';
    splitDetails?: { cash: number; card: number };
    customerId?: number | null;
    user: User; // Current cashier
    settings: AppSettings;
    note?: string;
    orderType: 'takeaway' | 'dine-in' | 'delivery' | 'direct' | 'receive' | 'deliver' | 'maintenance' | 'reservation';
    tableNumber?: string;
    tipAmount?: number;
    warehouseId: number;
    deliveryAddress?: string;
    deliveryPhone?: string;
    deliveryFee?: number;
    dueDate?: Date;
    deviceSerial?: string;
    issueDescription?: string;
    deviceAttachments?: string;
    loyaltyPointsUsed?: number;
    paidAmount?: number;
    salespersonId?: number;
    serviceChargeAmount?: number;
    existingOrderId?: number;
    giftCardCode?: string;
    giftCardAmount?: number;
    referenceNumber: string;
    isReservation?: boolean;
    reservationDetails?: {
        depositAmount: number;
        remainingAmount: number;
        dueDate?: Date | string;
        deliveryStatus: "not_delivered" | "partially_delivered" | "fully_delivered";
        deliveredItems: { productId: number; quantity: number }[];
    };
    journalLinesOverride?: any[];
    costCenterId?: number;
}

export class SalesService {
    
    static async processSale(params: SaleParams): Promise<number> {
        const { 
            cart, totals, paymentMethod, splitDetails, 
            customerId, user, note, orderType, tableNumber, tipAmount, warehouseId,
            deliveryAddress, deliveryPhone, deliveryFee, dueDate, deviceSerial, issueDescription, deviceAttachments, loyaltyPointsUsed, paidAmount, salespersonId, serviceChargeAmount, existingOrderId, giftCardCode, giftCardAmount, referenceNumber,
            isReservation, reservationDetails, journalLinesOverride, costCenterId
        } = params;

        // Validation
        if (cart.length === 0) throw new Error("السلة فارغة");
        if (!warehouseId) throw new Error("لم يتم تحديد المخزن");

        // Transaction
        return await (db as any).transaction('rw', [db.orders, db.recipes, db.products, db.customers, db.inventory, db.batches, db.productSerials, db.logs, db.shifts, db.promotions, db.periodicMaintenanceSchedules, db.journalEntries, db.accounts, db.loyaltyTransactions, db.giftCards, db.auditLogs], async () => {
            debug("--- BEGIN ATOMIC TRANSACTION ---");
            debug("1. حفظ الفاتورة (Save Order)");
            debug("2. خصم المكونات من المخزن (Deduct Inventory)");
            debug("3. تسجيل حركة الصندوق (Register Cash Movement)");

            try {
                // Process Gift Card
            if (giftCardCode && giftCardAmount && giftCardAmount > 0) {
                const giftCard = await db.giftCards.where('code').equals(giftCardCode).first();
                if (!giftCard) throw new Error("بطاقة الهدايا غير موجودة");
                if (giftCard.status !== 'active') throw new Error("بطاقة الهدايا غير نشطة");
                if (new Date(giftCard.expiryDate) < new Date()) throw new Error("بطاقة الهدايا منتهية الصلاحية");
                if (giftCard.currentBalance < giftCardAmount) throw new Error("رصيد بطاقة الهدايا غير كافٍ");
                
                // Deduct balance
                await db.giftCards.update(giftCard.id!, {
                    currentBalance: Math.round((giftCard.currentBalance - giftCardAmount) * 100) / 100
                });
            }

            
            // 1. Fetch existing order if any to preserve original creation date
            let existingOrder;
            if (existingOrderId) {
                existingOrder = await db.orders.get(existingOrderId);
            }

            // 1.5. Create Order with precise math
            const newOrder: Order = {
                referenceNumber,
                date: existingOrder ? existingOrder.date : new Date(),
                completedAt: new Date(),
                subtotalAmount: safeRound(totals.subtotal),
                discountAmount: safeRound(totals.discountAmount),
                taxAmount: safeRound(totals.tax),
                totalAmount: safeRound(totals.total),
                serviceChargeAmount: serviceChargeAmount ? safeRound(serviceChargeAmount) : undefined,
                tipAmount: paymentMethod === 'card' ? safeRound(tipAmount || 0) : 0,
                paymentMethod,
                splitDetails,
                status: 'completed',
                fulfillmentStatus: 'pending',
                customerId: customerId || undefined,
                cashierName: user.name,
                userId: user.id || undefined,
                warehouseId: warehouseId,
                salespersonId: salespersonId || undefined,
                note: note,
                orderType,
                tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
                deliveryAddress,
                deliveryPhone,
                deliveryFee,
                dueDate,
                deviceSerial,
                issueDescription,
                deviceAttachments,
                loyaltyPointsUsed,
                appliedPromotions: totals.appliedPromotions,
                paidAmount: paymentMethod === 'credit' ? paidAmount : undefined,
                isReservation,
                reservationDetails,
                items: cart.map(item => {
                    const lineTotal = safeRound((item.price * item.quantity) - (item.itemDiscount || 0));
                    return {
                        productId: item.id!,
                        name: item.name,
                        price: item.price,
                        costPrice: item.costPrice || 0,
                        quantity: item.quantity,
                        total: lineTotal,
                        discount: item.itemDiscount,
                        note: item.itemNote,
                        variantName: item.variantName,
                        // Store unit details
                        unitName: item.selectedUnit ? item.selectedUnit.name : undefined,
                        conversionFactor: item.selectedUnit ? item.selectedUnit.conversionFactor : 1,
                        serials: item.serials,
                        selectedModifiers: item.selectedModifiers
                    };
                })
            };

            let orderId: number;
            if (existingOrderId) {
                newOrder.id = existingOrderId;
                await db.orders.put(newOrder);
                orderId = existingOrderId;
            } else {
                orderId = await db.orders.add(newOrder) as number;
            }

            // 2. Update Customer Balance / Wallet
            if (customerId) {
                const customer = await db.customers.get(customerId);
                if (customer) {
                    const updates: any = { totalSpent: safeRound((customer.totalSpent || 0) + totals.total) };
                    if (paymentMethod === 'credit') {
                        // The deferred amount is total - paidAmount
                        const deferredAmount = totals.total - (paidAmount || 0);
                        updates.balance = safeRound((customer.balance || 0) + deferredAmount);
                    } else if (paymentMethod === 'wallet') {
                        if (totals.total > 0 && (customer.walletBalance || 0) < totals.total) {
                            throw new Error("رصيد المحفظة غير كافي");
                        }
                        updates.walletBalance = safeRound((customer.walletBalance || 0) - totals.total);
                    }
                    if (loyaltyPointsUsed && loyaltyPointsUsed > 0) {
                        updates.loyaltyPoints = Math.max(0, (customer.loyaltyPoints || 0) - loyaltyPointsUsed);
                    }

                    // Record purchased prices for this customer if it's a new sale and they have this setting
                    const isRefund = totals.total < 0;
                    if (!isRefund) {
                        const lastPurchasedPrices = customer.lastPurchasedPrices || {};
                        cart.forEach(item => {
                            if (item.id) {
                                lastPurchasedPrices[item.id] = {
                                    price: item.price,
                                    unitName: item.selectedUnit?.name,
                                    date: new Date(),
                                    orderId: orderId,
                                    orderTotal: totals.total
                                };
                            }
                        });
                        updates.lastPurchasedPrices = lastPurchasedPrices;
                    }

                    // --- Loyalty Accumulation Logic ---
                    if (params.settings?.loyaltySettings?.enabled && paymentMethod !== 'wallet') { // Don't award points if paying by wallet? Or maybe yes? Let's award on the total amount minus discounts.
                        let pointsAwarded = 0;
                        const pointsPerCurrency = params.settings.loyaltySettings.pointsPerCurrency || 0;
                        
                        // Calculate base points using Math.floor to avoid fractions
                        if (pointsPerCurrency > 0 && totals.total > 0) {
                            pointsAwarded = Math.floor(totals.total * pointsPerCurrency);
                        }

                        if (pointsAwarded > 0) {
                            // Check tier multipliers
                            let multiplier = 1;
                            if (params.settings.loyaltySettings.enableTiers && params.settings.loyaltySettings.tiers) {
                                // Sort tiers by minPoints descending
                                const sortedTiers = [...params.settings.loyaltySettings.tiers].sort((a,b) => b.minPoints - a.minPoints);
                                const currentPoints = updates.loyaltyPoints !== undefined ? updates.loyaltyPoints : (customer.loyaltyPoints || 0);
                                
                                const activeTier = sortedTiers.find(t => currentPoints >= t.minPoints);
                                if (activeTier && activeTier.multiplier) {
                                    multiplier = activeTier.multiplier;
                                }
                            }
                            
                            pointsAwarded = Math.floor(pointsAwarded * multiplier);
                            updates.loyaltyPoints = (updates.loyaltyPoints !== undefined ? updates.loyaltyPoints : (customer.loyaltyPoints || 0)) + pointsAwarded;

                            // Create Loyalty Transaction Record
                            await db.loyaltyTransactions.add({
                                customerId: customerId,
                                orderId: orderId,
                                points: pointsAwarded,
                                type: 'earn',
                                date: new Date(),
                                note: `نقاط مكتسبة من الطلب #${orderId}`
                            });
                        }
                    }

                    // --- Record Loyalty Redemption History ---
                    if (loyaltyPointsUsed && loyaltyPointsUsed > 0) {
                        await db.loyaltyTransactions.add({
                            customerId: customerId,
                            orderId: orderId,
                            points: Math.floor(loyaltyPointsUsed), // ensure integers
                            type: 'redeem',
                            date: new Date(),
                            note: `استبدال نقاط في الطلب #${orderId}`
                        });
                    }

                    await db.customers.update(customerId, updates);
                }
            } else if (paymentMethod === 'credit' || paymentMethod === 'wallet') {
                throw new Error("يجب تحديد عميل للدفع الآجل أو بالمحفظة");
            }

            // 3. Deduct Inventory & Batches & Serials
            for (const item of cart) {
                if (item.id && item.id < 100000000000) { // Skip custom items
                    const product = await db.products.get(item.id);
                    if (product) {
                        
                        // Update Serial Status (If tracked)
                        if (product.trackSerial && item.serials && item.serials.length > 0) {
                              const isRefund = item.quantity < 0;
                              const deliveredQty = isReservation && reservationDetails?.deliveredItems 
                                  ? (reservationDetails.deliveredItems.find(d => d.productId === item.id)?.quantity || 0)
                                  : item.quantity;
                              const serialsToProcess = isReservation ? item.serials.slice(0, deliveredQty) : item.serials;
                              
                              for (const sn of serialsToProcess) {
                                 const serialEntry = await db.productSerials
                                    .where({ serialNumber: sn, productId: item.id })
                                    .first();
                                 
                                 const isRefund = item.quantity < 0;
                                 
                                 if (serialEntry) {
                                     if (!isRefund && serialEntry.status === 'sold') {
                                         throw new Error(`السيريال ${sn} مباع مسبقاً!`);
                                     }
                                     if (isRefund && serialEntry.status === 'available') {
                                         throw new Error(`السيريال ${sn} متاح بالفعل!`);
                                     }
                                     
                                     await db.productSerials.update(serialEntry.id!, { 
                                         status: isRefund ? 'available' : 'sold', 
                                         orderId: isRefund ? undefined : (orderId as number) 
                                     });
                                 } else {
                                     if (isRefund) {
                                         // If returning an unknown serial, add it to inventory
                                         await db.productSerials.add({
                                             serialNumber: sn,
                                             productId: item.id,
                                             warehouseId: warehouseId,
                                             status: 'available',
                                             dateAdded: new Date()
                                         });
                                     } else {
                                         throw new Error(`السيريال ${sn} غير موجود في المخزن`);
                                     }
                                 }
                             }
                        }

                        // Calculate effective quantity to remove
                        const factor = item.selectedUnit ? item.selectedUnit.conversionFactor : 1;
                        let effectiveQty = item.quantity * factor;
                        if (isReservation && reservationDetails?.deliveredItems) {
                            const deliveredEntry = reservationDetails.deliveredItems.find(d => d.productId === item.id);
                            effectiveQty = (deliveredEntry ? deliveredEntry.quantity : 0) * factor;
                        }

                        // Check for Recipe first
                        const recipe = await db.recipes.where('productId').equals(item.id).first();
                        
                        if (effectiveQty > 0) {
                            if (recipe && recipe.items && recipe.items.length > 0) {
                                // It's a recipe-based product. Deduct ingredients using Computation Engine.
                                const deductions = CalculationEngine.calculateRecipeDeduction(recipe.items, recipe.yieldQuantity || 1, effectiveQty);
                                for (const d of deductions) {
                                    await SalesService.updateStock(d.productId, warehouseId, d.qtyToDeduct, params.settings?.posSettings?.allowNegativeStock);
                                }
                            } 
                            // A. Composite Products (Legacy support)
                            else if (product.type === 'composite' && product.composition) {
                                for (const comp of product.composition) {
                                    const qtyToDeduct = safeRound(comp.quantity * effectiveQty);
                                    await SalesService.updateStock(comp.productId, warehouseId, qtyToDeduct, params.settings?.posSettings?.allowNegativeStock);
                                }
                            } 
                            // B. Simple Products
                            else if (product.type === 'simple') {
                                await SalesService.updateStock(item.id, warehouseId, effectiveQty, params.settings?.posSettings?.allowNegativeStock);
                            }
                        }
                        // C. Service Products
                        // Do not deduct stock for service products
                    }
                }
            }

            // 4. Update Shift
            const openShift = await db.shifts.where('status').equals('open').first();
            if (openShift) {
                let cashToAdd = 0;
                let cardToAdd = 0;

                if (paymentMethod === 'cash') {
                    cashToAdd = totals.total;
                } else if (paymentMethod === 'card') {
                    cardToAdd = totals.total;
                } else if (paymentMethod === 'split' && splitDetails) {
                    cashToAdd = splitDetails.cash;
                    cardToAdd = splitDetails.card;
                } else if (paymentMethod === 'credit' && paidAmount && paidAmount !== 0) {
                    cashToAdd = paidAmount; // Assume down payment is cash
                }
                
                await db.shifts.update(openShift.id!, {
                    expectedCash: safeRound(openShift.expectedCash + cashToAdd),
                    cashSales: safeRound(openShift.cashSales + cashToAdd),
                    cardSales: safeRound(openShift.cardSales + cardToAdd)
                });
            }

            // 5. Update Promotions Used Count
            if (totals.appliedPromotions && totals.appliedPromotions.length > 0) {
                for (const promo of totals.appliedPromotions) {
                    if (promo.id) {
                        const existingPromo = await db.promotions.get(promo.id);
                        if (existingPromo) {
                            await db.promotions.update(promo.id, { usedCount: (existingPromo.usedCount || 0) + 1 });
                        }
                    }
                }
            }

            // 6. Generate Periodic Maintenance Schedules
            if (customerId) {
                for (const item of cart) {
                    if (item.id) {
                        const product = await db.products.get(item.id);
                        if (product && product.requiresPeriodicMaintenance && product.maintenancePeriodDays) {
                            const nextMaintenanceDate = new Date();
                            nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + product.maintenancePeriodDays);
                            
                            // If sold with serials, create a schedule for each serial, else one for the item pack
                            const serials = item.serials || [];
                            const iterations = serials.length > 0 ? serials.length : item.quantity;
                            
                            for (let i = 0; i < iterations; i++) {
                                await db.periodicMaintenanceSchedules.add({
                                    customerId: customerId,
                                    orderId: orderId as number,
                                    productId: item.id,
                                    productSerial: serials[i],
                                    purchaseDate: new Date(),
                                    nextMaintenanceDate: nextMaintenanceDate,
                                    maintenanceIntervalDays: product.maintenancePeriodDays,
                                    status: 'upcoming'
                                });
                            }
                        }
                    }
                }
            }

            // 7. Auto Accounting Integration (Journal Entry)
            if (journalLinesOverride && journalLinesOverride.length > 0) {
                const lines = [];
                for (const overrideLine of journalLinesOverride) {
                    const acc = await this.getOrCreateAccountByCode(overrideLine.accountCode, overrideLine.accountName);
                    const isDebit = overrideLine.debit > 0;
                    const val = isDebit ? overrideLine.debit : overrideLine.credit;
                    if (val > 0) {
                        lines.push({
                            accountId: acc.id!,
                            accountName: acc.name,
                            debit: isDebit ? val : 0,
                            credit: isDebit ? 0 : val,
                            description: overrideLine.notes || `توجيه محاسبي تلقائي - فاتورة مبيعات جملة #${orderId}`,
                            costCenterId: costCenterId || overrideLine.costCenterId
                        });
                    }
                }
                
                if (lines.length > 0) {
                    await AccountingEngine.postEntry({
                        date: new Date(),
                        reference: `POS-${orderId}`,
                        description: `قيد تلقائي مبيعات جملة موجه ومحسوب #${orderId}`,
                        lines: lines,
                    });
                }
            } else {
                // Determine accounts based on payment method
                let debitAccountCode = '1010'; // Default Cash
                if (paymentMethod === 'card') debitAccountCode = '1020'; // Bank
                else if (paymentMethod === 'credit' || paymentMethod === 'wallet') debitAccountCode = '1030'; // Accounts Receivable
                
                const debitAccount = await db.accounts.where('code').equals(debitAccountCode).first();
                const revenueAccount = await db.accounts.where('code').equals('4010').first();
                const taxAccount = await db.accounts.where('code').equals('2020').first();
                const cogsAccount = await db.accounts.where('code').equals('5010').first();
                const inventoryAccount = await db.accounts.where('code').equals('1040').first();

                // Calculate total cost for COGS
                let totalCost = 0;
                for (const item of cart) {
                    if (item.id && item.id < 100000000000) {
                        const product = await db.products.get(item.id);
                        if (product && product.costPrice) {
                            const factor = item.selectedUnit ? item.selectedUnit.conversionFactor : 1;
                            totalCost += safeRound(product.costPrice * item.quantity * factor);
                        }
                    }
                }

                if (debitAccount && revenueAccount) {
                    const lines = [];
                    const isRefund = totals.total < 0;
                    
                    const absTotal = Math.abs(totals.total);
                    const absRevenue = Math.abs(totals.subtotal - totals.discountAmount + (serviceChargeAmount || 0) + (deliveryFee || 0));
                    const absTax = Math.abs(totals.tax);
                    const absCost = Math.abs(totalCost);

                    // Cash / Bank / Customer Account
                    if (paymentMethod === 'split' && splitDetails) {
                        const cashAcc = await db.accounts.where('code').equals('1010').first();
                        const bankAcc = await db.accounts.where('code').equals('1020').first();
                        if (cashAcc && splitDetails.cash !== 0) {
                             const aCash = Math.abs(splitDetails.cash);
                             lines.push({ accountId: cashAcc.id!, accountName: cashAcc.name, debit: isRefund ? 0 : aCash, credit: isRefund ? aCash : 0, description: `نقدية - مبيعات #${orderId}` });
                        }
                        if (bankAcc && splitDetails.card !== 0) {
                             const aCard = Math.abs(splitDetails.card);
                             lines.push({ accountId: bankAcc.id!, accountName: bankAcc.name, debit: isRefund ? 0 : aCard, credit: isRefund ? aCard : 0, description: `بطاقة - مبيعات #${orderId}` });
                        }
                    } else if (paymentMethod === 'credit' && paidAmount && paidAmount !== 0) {
                        const cashAcc = await db.accounts.where('code').equals('1010').first();
                        const deferred = totals.total - paidAmount;
                        if (cashAcc) {
                             const aPaid = Math.abs(paidAmount);
                             lines.push({ accountId: cashAcc.id!, accountName: cashAcc.name, debit: isRefund ? 0 : aPaid, credit: isRefund ? aPaid : 0, description: `دفعة مقدمة - مبيعات #${orderId}` });
                        }
                        if (debitAccount && deferred !== 0) {
                             const aDef = Math.abs(deferred);
                             lines.push({ accountId: debitAccount.id!, accountName: debitAccount.name, debit: isRefund ? 0 : aDef, credit: isRefund ? aDef : 0, description: `آجل - مبيعات #${orderId}` });
                        }
                    } else {
                        lines.push({ accountId: debitAccount.id!, accountName: debitAccount.name, debit: isRefund ? 0 : absTotal, credit: isRefund ? absTotal : 0, description: `مدفوعات فاتورة مبيعات #${orderId}` });
                    }
                    
                    // Revenue
                    lines.push({ accountId: revenueAccount.id!, accountName: revenueAccount.name, debit: isRefund ? absRevenue : 0, credit: isRefund ? 0 : absRevenue, description: `الفاتورة #${orderId}` });
                    // Tax
                    if (absTax > 0 && taxAccount) {
                        lines.push({ accountId: taxAccount.id!, accountName: taxAccount.name, debit: isRefund ? absTax : 0, credit: isRefund ? 0 : absTax, description: ` ضريبة الفاتورة #${orderId}` });
                    }
                    // COGS (if calculated)
                    if (absCost > 0 && cogsAccount && inventoryAccount) {
                        lines.push({ accountId: cogsAccount.id!, accountName: cogsAccount.name, debit: isRefund ? 0 : absCost, credit: isRefund ? absCost : 0, description: `تكلفة البضاعة المباعة للفاتورة #${orderId}` });
                        lines.push({ accountId: inventoryAccount.id!, accountName: inventoryAccount.name, debit: isRefund ? absCost : 0, credit: isRefund ? 0 : absCost, description: `مخزون الفاتورة #${orderId}` });
                    }
                    
                    await AccountingEngine.postEntry({
                        date: new Date(),
                        reference: `POS-${orderId}`,
                        description: `قيد تلقائي لفاتورة المبيعات #${orderId}`,
                        lines: lines,
                    });
                }
            }

            // 8. Log
            await logActivity('sale', `فاتورة بيع #${orderId}`, `قيمة: ${totals.total}`, totals.total, orderId as number, 'success');

            debug("--- COMMIT ATOMIC TRANSACTION ---");
            return orderId;
            } catch (error) {
                console.error("--- ROLLBACK ATOMIC TRANSACTION ---", error);
                throw error;
            }
        });
    }

    public static async processRefundInventory(productId: number, warehouseId: number, qtyToAdd: number) {
        await this.updateStock(productId, warehouseId, -qtyToAdd);
    }

    private static async getOrCreateAccountByCode(code: string, defaultName: string) {
        let acc = await db.accounts.where('code').equals(code).first();
        if (!acc) {
            let type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' = 'asset';
            const firstDigit = code.trim().charAt(0);
            if (firstDigit === '2') type = 'liability';
            else if (firstDigit === '3') type = 'equity';
            else if (firstDigit === '4') type = 'revenue';
            else if (firstDigit === '5') type = 'expense';
            
            const id = await db.accounts.add({
                code,
                name: defaultName,
                type,
                isSystem: false
            }) as number;
            acc = { id, code, name: defaultName, type };
        }
        return acc;
    }

    private static async updateStock(productId: number, warehouseId: number, qtyToRemove: number, allowNegativeStock?: boolean) {
        // Handle Refunds (adding back to stock)
        if (qtyToRemove < 0) {
            const qtyToAdd = Math.abs(qtyToRemove);
            
            const product = await db.products.get(productId);
            // 1. Add back to Batches
            // Try to find an existing batch with no expiry or the latest expiry to add to
            const matchingBatches = await db.batches
                .where({ productId, warehouseId })
                .toArray();
                
            let latestBatch = matchingBatches.sort((a,b) => (b.expiryDate?.getTime()||0) - (a.expiryDate?.getTime()||0))[0];

            if (latestBatch) {
                await db.batches.update(latestBatch.id!, { quantity: safeRound(latestBatch.quantity + qtyToAdd) });
            } else {
                // If no batches exist, create a new 'Returned' batch
                await db.batches.add({
                    productId,
                    productName: product?.name || 'Unknown Product',
                    warehouseId,
                    batchNumber: 'RETURN-' + new Date().getTime().toString().slice(-6),
                    quantity: safeRound(qtyToAdd),
                    receivedDate: new Date(),
                    costPrice: product?.costPrice || 0
                });
            }
            
            // 2. Update Warehouse Inventory
            const inventoryItem = await db.inventory.where({ warehouseId, productId }).first();
            if (inventoryItem) {
                await db.inventory.update(inventoryItem.id!, { quantity: safeRound(inventoryItem.quantity + qtyToAdd) });
            } else {
                await db.inventory.add({ warehouseId, productId, quantity: safeRound(qtyToAdd) });
            }

            // 3. Update Global Product Stock
            if (product) {
                await db.products.update(productId, { stock: safeRound(product.stock + qtyToAdd) });
            }
            return;
        }

        const product = await db.products.get(productId);
        
        // Handle Sales (removing from stock)
        // Check out of stock
        const inventoryItem = await db.inventory.where({ warehouseId, productId }).first();
        const currentQty = inventoryItem ? inventoryItem.quantity : 0;
        
        if (!allowNegativeStock && currentQty < qtyToRemove) {
             throw new Error(`الكمية غير كافية في المخزن للصنف ${product?.name}. المطلوبة: ${qtyToRemove}, المتوفرة: ${currentQty}`);
        }

        // 1. Deduct from Batches (FIFO)
        const batches = await db.batches
            .where({ productId, warehouseId })
            .sortBy('expiryDate'); 
        
        let remainingToDeduct = qtyToRemove;

        for (const batch of batches) {
            if (remainingToDeduct <= 0) break;
            
            if (qtyToRemove > 0) {
                 if (batch.quantity > remainingToDeduct) {
                    // Batch has enough
                    await db.batches.update(batch.id!, { quantity: batch.quantity - remainingToDeduct });
                    remainingToDeduct = 0;
                } else {
                    // Batch consumed
                    remainingToDeduct -= batch.quantity;
                    await db.batches.delete(batch.id!);
                }
            }
        }
        
        // 2. Update Warehouse Inventory (Aggregate)
        if (inventoryItem) {
            await db.inventory.update(inventoryItem.id!, { quantity: safeRound(inventoryItem.quantity - qtyToRemove) });
        } else {
            // Create negative inventory entry for tracking
            await db.inventory.add({ warehouseId, productId, quantity: safeRound(-qtyToRemove) });
        }

        // 3. Update Global Product Stock (Cache)
        if (product) {
            const newStock = safeRound(product.stock - qtyToRemove);
            await db.products.update(productId, { stock: newStock });
            
            // Reorder Point Alert (Advanced Inventory & Recipe System)
            if (product.alertThreshold !== undefined && product.alertThreshold > 0 && newStock <= product.alertThreshold) {
                import('../utils/notifications').then(({ notificationService }) => {
                    notificationService.addNotification(
                        "تنبيه: مخزون منخفض", 
                        `تنبيه المخزن: رصيد "${product.name}" قارب على النفاد (المتبقي: ${newStock}). يرجى التحقق وإصدار أمر شراء إن لزم الأمر.`,
                        "error"
                    );
                });
                // Check if there is already an active purchase request for this product
                const existingRequests = await db.purchaseRequests
                    .where('status')
                    .anyOf(['draft', 'pending', 'in_workflow'])
                    .toArray();
                
                const hasActiveRequestForProduct = existingRequests.some(pr => 
                    pr.items && pr.items.some(item => item.productId === productId)
                );

                if (!hasActiveRequestForProduct) {
                     debug(`[Reorder System] 🔴 Threshold reached for ${product.name} (Stock: ${newStock}, Threshold: ${product.alertThreshold}). Automatically generating Purchase Request.`);
                     
                     await db.purchaseRequests.add({
                         requestNumber: 'PR-AUTO-' + Date.now().toString().slice(-6),
                         date: new Date(),
                         requestedBy: 1, // System admin user id
                         status: 'pending',
                         department: 'Inventory Management',
                         items: [{
                             productId: product.id!,
                             quantity: Math.max(product.alertThreshold * 2, 10)
                         }],
                         notes: `تم إنشاء الطلب تلقائياً لأن رصيد الصنف "${product.name}" (${newStock}) وصل إلى حد النقص المسموح (${product.alertThreshold}).`
                     });
                     
                     // Optional: Trigger WhatsApp or SMS to manager here.
                }
            }
        }
    }
}
