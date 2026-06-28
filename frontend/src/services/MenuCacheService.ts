import { db } from '../db';
import { Product, Category } from '../types';

class MenuCacheService {
    private productsCache: Product[] = [];
    private categoriesCache: Category[] = [];
    private productsByCategory: Record<string, Product[]> = {};
    private isLoaded = false;
    private listeners: (() => void)[] = [];

    async initialize() {
        if (this.isLoaded) return;
        await this.refreshCache();
    }

    async refreshCache() {
        this.productsCache = await db.products.toArray();
        this.categoriesCache = await db.categories.toArray();
        
        this.productsByCategory = {};
        this.productsCache.forEach(p => {
            const cat = p.category || 'Uncategorized';
            if (!this.productsByCategory[cat]) {
                this.productsByCategory[cat] = [];
            }
            this.productsByCategory[cat].push(p);
        });
        
        this.isLoaded = true;
        this.notifyListeners();
    }

    getProducts(category?: string): Product[] {
        if (!category || category === 'all') {
            return this.productsCache;
        }
        return this.productsByCategory[category] || [];
    }

    getCategories(): Category[] {
        return this.categoriesCache;
    }

    getAllProducts(): Product[] {
        return this.productsCache;
    }

    searchProducts(term: string, category?: string): Product[] {
        const list = this.getProducts(category);
        if (!term) return list;
        const lowerTerm = term.toLowerCase();
        return list.filter(p => 
            p.name.toLowerCase().includes(lowerTerm) || 
            (p.barcode && p.barcode.includes(term))
        );
    }
    
    subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    
    private notifyListeners() {
        this.listeners.forEach(l => l());
    }
}

export const menuCache = new MenuCacheService();
