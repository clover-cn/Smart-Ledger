// 原有的购物系统类型保留（暂时）
export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

export interface Inventory {
  productId: number;
  quantity: number;
  product?: Product;
}

export interface Order {
  id: number;
  customerName: string;
  items: Array<{productId: number, quantity: number}>;
  totalAmount: number;
  orderDate: string;
}

// 导出智能记账系统的类型
export * from './transaction.js';