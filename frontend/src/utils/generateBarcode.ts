import { db } from '../db';
import { Product } from '../types';

export const generateBarcode = async (
  categoryCode?: string,
  price?: number,
  cost?: number,
  expiryDate?: Date
): Promise<string> => {
  try {
    const settings = await db.settings.toCollection().first();
    const config = settings?.barcodeConfig;

    if (!config || config.mode === 'random') {
      return Math.floor(100000000000 + Math.random() * 900000000000).toString();
    }

    const padding = config.customPadding || 5;
    
    // Get next sequence
    let seqVal = 1;
    let pfx = '';

    let matchedSeq = config.productSequences?.find(s => 
      (s.targetType === 'category' && s.targetId === categoryCode)
    );

    if (matchedSeq) {
      seqVal = matchedSeq.currentSequence;
      pfx = matchedSeq.prefix;

      // Auto-increment the sequence in settings
      const updatedSequences = config.productSequences!.map(s => {
        if (s === matchedSeq) {
          return { ...s, currentSequence: s.currentSequence + 1 };
        }
        return s;
      });
      
      if (settings.id) {
        // Fire and forget update
        db.settings.update(settings.id, { 
          barcodeConfig: { ...config, productSequences: updatedSequences } 
        });
      }
    } else {
      const lastProduct = await db.products.orderBy('id').last();
      seqVal = lastProduct && lastProduct.id ? lastProduct.id + 1 : 1;
    }

    const seqStr = seqVal.toString().padStart(padding, '0');

    if (config.mode === 'sequential') {
      return pfx ? pfx + seqStr : seqStr;
    }

    if (config.mode === 'advanced') {
      let format = config.advancedFormat || '{SEQ}';
      
      format = format.replace('{SEQ}', pfx ? pfx + seqStr : seqStr);
      format = format.replace('{C}', categoryCode || '10');

      // Helper to pad prices (e.g. 15.5 -> 01550)
      if (config.includePrice) {
         const p = price ? Math.round(price * 100).toString().padStart(5, '0') : '00000';
         format = format.replace('{P}', p);
         if (!format.includes(p)) format += p;
      }
      if (config.includeCost) {
         const c = cost ? Math.round(cost * 10).toString().padStart(4, '0') : '0000';
         if (!format.includes('{COST}')) format += c;
      }
      if (config.includeExpiry) {
         const e = expiryDate ? 
            `${(expiryDate.getMonth()+1).toString().padStart(2, '0')}${expiryDate.getFullYear().toString().slice(-2)}` 
            : '0000';
         if (!format.includes('{EXP}')) format += e;
      }

      return format;
    }

    return seqStr;
  } catch (e) {
    console.error("Error generating barcode:", e);
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
  }
};
