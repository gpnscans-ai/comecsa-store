"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { computeCartPricing, type CartPricing } from "@/lib/promo";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  priceUsd: number;
  depositPct: number;
  quantity: number;
  promoType?: "2x1" | null;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalPrice: number;
  totalDeposit: number;
  count: number;
  pricing: CartPricing;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "comecsa_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeItem = (productId: string) => setItems((prev) => prev.filter((i) => i.productId !== productId));

  const setQuantity = (productId: string, quantity: number) =>
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );

  const clear = () => setItems([]);

  const pricing = useMemo(() => computeCartPricing(items), [items]);
  const totalPrice = pricing.totalPrice;
  const totalDeposit = pricing.totalDeposit;
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQuantity, clear, totalPrice, totalDeposit, count, pricing }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
