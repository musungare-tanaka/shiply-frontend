import type { PaymentCurrency } from "./types";

export const PRICING_CURRENCY_KEY = "shiply-pricing-currency";
export const validCurrency = (value: string | null): value is PaymentCurrency => value === "USD" || value === "ZWG";
export const storedCurrency = (fallback: PaymentCurrency = "USD"): PaymentCurrency => {
  try { const value = window.localStorage.getItem(PRICING_CURRENCY_KEY); return validCurrency(value) ? value : fallback; }
  catch { return fallback; }
};
export const saveCurrency = (currency: PaymentCurrency) => {
  try { window.localStorage.setItem(PRICING_CURRENCY_KEY, currency); } catch { /* storage may be disabled */ }
};
export const currencyLabel = (currency: PaymentCurrency) => currency === "ZWG" ? "ZiG" : "USD";
export const formatPrice = (currency: PaymentCurrency, amount: number) => `${currencyLabel(currency)} ${amount.toFixed(2)}`;
