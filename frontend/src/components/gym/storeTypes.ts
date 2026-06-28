export interface StoreItemType {
  id?: number;
  name: string;
  price: number;
  stock: number;
  barcode: string;
  category: string;
}

export interface StoreSaleItemType {
  itemId: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface StoreSaleType {
  id?: number;
  date: Date;
  customerName: string;
  items: StoreSaleItemType[];
  totalAmount: number;
  totalItemsSold: number;
  paymentMethod: 'cash' | 'bank';
  journalRef: string;
}

export interface CartItemType {
  id: number;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}
