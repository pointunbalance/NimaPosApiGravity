import { db } from '../../db';
import { Rental, Product, Customer } from '../../types';
import { AccountingEngine } from '../../services/AccountingEngine';

interface SaveRentalParams {
  rentalForm: Partial<Rental>;
  editingRental: Rental | null;
  rentalItems: Product[] | undefined;
  rentals: Rental[] | undefined;
  customers: Customer[] | undefined;
  success: (msg: string) => void;
  showError: (msg: string) => void;
}

interface ConfirmReturnParams {
  rentalId: number;
  lateFee: number;
  damageFee: number;
  depositReturned: number;
  notes?: string;
  returnedParts?: string[];
  returnStatus: 'returned' | 'in_laundry';
  success: (msg: string) => void;
  showError: (msg: string) => void;
}

export const useRentalsTransactions = () => {
  const saveRental = async ({
    rentalForm,
    editingRental,
    rentalItems,
    rentals,
    customers,
    success,
    showError,
  }: SaveRentalParams): Promise<boolean> => {
    if (!rentalForm.productId || !rentalForm.customerName || !rentalForm.pickupDate || !rentalForm.returnDate) {
      showError('يرجى تعبئة الحقول المطلوبة (القطعة، العميل، التواريخ)');
      return false;
    }

    const product = rentalItems?.find((p) => p.id === rentalForm.productId);

    if (product) {
      const newStart = new Date(rentalForm.pickupDate!).setHours(0, 0, 0, 0);
      const newEnd = new Date(rentalForm.returnDate!).setHours(23, 59, 59, 999);

      if (newEnd < newStart) {
        showError('عذراً، تاريخ الإرجاع لا يمكن أن يكون قبل تاريخ الاستلام.');
        return false;
      }

      const overlappingRentals =
        rentals?.filter((r) => {
          if (r.id === editingRental?.id) return false;
          if (r.productId !== rentalForm.productId) return false;
          if (r.status === 'returned' || r.status === 'cancelled') return false;

          const existingStart = new Date(r.pickupDate).setHours(0, 0, 0, 0);
          const existingEnd = new Date(r.returnDate).setHours(23, 59, 59, 999);

          return newStart <= existingEnd && newEnd >= existingStart;
        }) || [];

      let hasConflict = false;
      for (let time = newStart; time <= newEnd; time += 86400000) {
        const activeCountOnDay = overlappingRentals.filter((r) => {
          const s = new Date(r.pickupDate).setHours(0, 0, 0, 0);
          const e = new Date(r.returnDate).setHours(23, 59, 59, 999);
          return time >= s && time <= e;
        }).length;

        if (activeCountOnDay >= product.stock) {
          hasConflict = true;
          break;
        }
      }

      if (hasConflict) {
        showError(`عذراً، هذا الصنف محجوز بالكامل واستوفى مخزونه (${product.stock}) في أحد الأيام ضمن الفترة المحددة!`);
        return false;
      }
    }

    const rentalData: Rental = {
      ...(rentalForm as Rental),
      productName: product?.name || rentalForm.productName || 'Unknown',
      productImage: product?.image,
      bookingDate: rentalForm.bookingDate || new Date(),
    };

    try {
      await (db as any).transaction('rw', db.rentals, db.customers, db.shifts, db.journalEntries, db.accounts, async () => {
        let customerId = rentalForm.customerId;
        if (!customerId && rentalForm.customerName) {
          const existingCustomer = customers?.find(
            (c) => c.name.toLowerCase() === rentalForm.customerName?.toLowerCase()
          );
          if (existingCustomer) {
            customerId = existingCustomer.id!;
          } else {
            customerId = await db.customers.add({
              name: rentalForm.customerName,
              phone: rentalForm.customerPhone || '',
              address: '',
              balance: 0,
              totalSpent: 0,
            });
          }
        }
        rentalData.customerId = customerId || 0;

        let rentalId;
        if (editingRental?.id) {
          await db.rentals.update(editingRental.id, rentalData as any);
          rentalId = editingRental.id;
        } else {
          rentalId = await db.rentals.add(rentalData);

          if (rentalData.price > 0 || rentalData.deposit > 0) {
            const amountToReceive = rentalData.deposit || 0;
            const openShift = await db.shifts.where('status').equals('open').first();
            if (openShift && amountToReceive > 0) {
              await db.shifts.update(openShift.id!, {
                expectedCash: openShift.expectedCash + amountToReceive,
                cashSales: openShift.cashSales + amountToReceive,
              });
            }
          }

          // Accounting Integration
          try {
            const cashAccount = await db.accounts.where('code').equals('1010').first();
            const revenueAccount = await db.accounts.where('code').equals('4010').first();
            const depositAccount = await db.accounts.where('code').equals('2040').first();
            const arAccount = await db.accounts.where('code').equals('1030').first();

            const customerName = rentalData.customerName || 'عميل تأجير';
            const lines = [];

            if (cashAccount) {
              if (rentalData.price > 0 && revenueAccount && arAccount) {
                lines.push({
                  accountId: arAccount.id!,
                  accountName: arAccount.name,
                  debit: rentalData.price,
                  credit: 0,
                  description: `ذمم تأجير للعميل ${customerName}`,
                });
                lines.push({
                  accountId: revenueAccount.id!,
                  accountName: revenueAccount.name,
                  debit: 0,
                  credit: rentalData.price,
                  description: `إيراد تأجير (مستحق) للعميل ${customerName}`,
                });
              }

              if (rentalData.deposit > 0 && depositAccount) {
                lines.push({
                  accountId: cashAccount.id!,
                  accountName: cashAccount.name,
                  debit: rentalData.deposit,
                  credit: 0,
                  description: `تأمين مستلم`,
                });
                lines.push({
                  accountId: depositAccount.id!,
                  accountName: depositAccount.name,
                  debit: 0,
                  credit: rentalData.deposit,
                  description: `تأمين للعميل ${customerName}`,
                });
              }
            }

            if (lines.length > 0) {
              await AccountingEngine.postEntry({
                date: new Date(),
                reference: `RNTL-${rentalId}`,
                description: `عملية تأجير ${rentalData.productName}`,
                lines: lines,
              });
            }
          } catch (err) {
            console.error('Failed to post automatic journal entry for rental:', err);
          }
        }
      });
      success('تم حفظ عملية التأجير بنجاح');
      return true;
    } catch (err) {
      console.error('Error saving rental:', err);
      showError('حدث خطأ أثناء حفظ عملية التأجير');
      return false;
    }
  };

  const confirmReturn = async ({
    rentalId,
    lateFee,
    damageFee,
    depositReturned,
    notes,
    returnedParts,
    returnStatus,
    success,
    showError,
  }: ConfirmReturnParams): Promise<boolean> => {
    try {
      await (db as any).transaction('rw', db.rentals, db.shifts, db.journalEntries, db.accounts, async () => {
        const rental = await db.rentals.get(rentalId);
        if (!rental) return;

        const updates: Partial<Rental> = {
          status: returnStatus,
          actualReturnDate: new Date(),
          lateFee,
          damageFee,
          isDepositReturned: depositReturned > 0,
          returnedParts,
        };

        let finalNotes = rental.notes || '';
        if (notes) {
          finalNotes = finalNotes + (finalNotes ? '\n' : '') + '[ملاحظات الإرجاع]: ' + notes;
        }
        if (finalNotes) {
          updates.notes = finalNotes;
        }

        await db.rentals.update(rentalId, updates);

        const remainingAmount = rental.price - 0;
        const totalToCollect = remainingAmount + lateFee + damageFee;
        const netCashEffect = totalToCollect - depositReturned;

        if (netCashEffect !== 0) {
          const openShift = await db.shifts.where('status').equals('open').first();
          if (openShift) {
            await db.shifts.update(openShift.id!, {
              expectedCash: openShift.expectedCash + netCashEffect,
              cashSales: openShift.cashSales + (netCashEffect > 0 ? netCashEffect : 0),
            });
          }
        }

        // Accounting Integration
        try {
          const cashAccount = await db.accounts.where('code').equals('1010').first();
          const revenueAccount = await db.accounts.where('code').equals('4010').first();
          const otherRevAccount = await db.accounts.where('code').equals('4020').first();
          const depositAccount = await db.accounts.where('code').equals('2040').first();

          if (cashAccount) {
            const lines = [];

            if (remainingAmount > 0 && revenueAccount) {
              lines.push({
                accountId: cashAccount.id!,
                accountName: cashAccount.name,
                debit: remainingAmount,
                credit: 0,
                description: `سداد باقي إيجار المستحق`,
              });
              lines.push({
                accountId: revenueAccount.id!,
                accountName: revenueAccount.name,
                debit: 0,
                credit: remainingAmount,
                description: `إيراد باقي للأمر ${rentalId}`,
              });
            }

            const fees = lateFee + damageFee;
            if (fees > 0 && otherRevAccount) {
              lines.push({
                accountId: cashAccount.id!,
                accountName: cashAccount.name,
                debit: fees,
                credit: 0,
                description: `غرامات ورسوم إضافية تأجير`,
              });
              lines.push({
                accountId: otherRevAccount.id!,
                accountName: otherRevAccount.name,
                debit: 0,
                credit: fees,
                description: `إيرادات غرامات`,
              });
            }

            if (depositReturned > 0 && depositAccount) {
              lines.push({
                accountId: depositAccount.id!,
                accountName: depositAccount.name,
                debit: depositReturned,
                credit: 0,
                description: `استرداد تأمين للعميل`,
              });
              lines.push({
                accountId: cashAccount.id!,
                accountName: cashAccount.name,
                debit: 0,
                credit: depositReturned,
                description: `صرف تأمين مسترد`,
              });
            }

            if (lines.length > 0) {
              await AccountingEngine.postEntry({
                date: new Date(),
                reference: `RNTL-RET-${rentalId}`,
                description: `إرجاع مأجور وتصفية الحساب`,
                lines: lines,
              });
            }
          }
        } catch (err) {
          console.error('Failed to post automatic journal entry for rental return:', err);
        }
      });
      success('تم تأكيد إرجاع وتصفية مأجور بنجاح');
      return true;
    } catch (err) {
      console.error('Error recording return:', err);
      showError('حدث خطأ أثناء تسجيل عملية الإرجاع');
      return false;
    }
  };

  return { saveRental, confirmReturn };
};
