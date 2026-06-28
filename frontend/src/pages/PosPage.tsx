import { ScanBarcode, Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { getCustomers } from "../app/api/customers";
import { checkoutCashSale } from "../app/api/orders";
import { getProducts } from "../app/api/products";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

type CartLine = {
  id: number;
  name: string;
  price: number;
  qty: number;
};

export function PosPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.pos;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerId, setCustomerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const { data, loading, error } = useAsyncValue(session ? () => getProducts(session.token) : null, [session?.token]);
  const { data: customers } = useAsyncValue(session ? () => getCustomers(session.token) : null, [session?.token]);
  const visibleProducts = (data?.items ?? []).filter((product) => product.name.includes(deferredQuery.trim()));
  const cartTotal = useMemo(() => cart.reduce((sum, product) => sum + product.price * product.qty, 0), [cart]);
  const selectedCustomer = customers?.items.find((item) => String(item.id) === customerId);
  const paymentMethodLabel = copy.paymentMethods[paymentMethod as keyof typeof copy.paymentMethods] || paymentMethod;

  const addToCart = (id: number, name: string, price: number) => {
    setCheckoutMessage(null);
    setCheckoutError(null);
    setCart((lines) => {
      const existing = lines.find((line) => line.id === id);
      if (!existing) {
        return [...lines, { id, name, price, qty: 1 }];
      }
      return lines.map((line) => (line.id === id ? { ...line, qty: line.qty + 1 } : line));
    });
  };

  const updateQty = (id: number, nextQty: number) => {
    setCart((lines) =>
      lines
        .map((line) => (line.id === id ? { ...line, qty: Math.max(nextQty, 0) } : line))
        .filter((line) => line.qty > 0)
    );
  };

  const handleCheckout = async () => {
    if (!session || cart.length === 0) return;

    setSubmitting(true);
    setCheckoutMessage(null);
    setCheckoutError(null);

    try {
      const result = await checkoutCashSale(session.token, {
        items: cart.map((line) => ({
          product_id: line.id,
          qty: line.qty,
          unit_price: line.price,
          name: line.name
        })),
        payments: [{ method: paymentMethod, amount: cartTotal }],
        customer_id: customerId ? Number(customerId) : null,
        notes: "Created from frontend starter"
      });
      setCart([]);
      setCheckoutMessage(
        `${copy.successMessagePrefix} ${result.invoice_id} ${copy.successMessageSuffix}${selectedCustomer ? ` ${copy.successMessageCustomerPrefix} ${selectedCustomer.name}` : ""}.`
      );
    } catch (caught) {
      setCheckoutError(getReadableAuthError(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        actions={
          <button className="secondary-button" type="button">
            {copy.holdAction}
          </button>
        }
      />

      <section className="pos-layout">
        <div className="surface-panel">
          <div className="search-shell">
            <Search size={18} />
            <input
              aria-label={copy.searchLabel}
              placeholder={copy.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="scan-button" type="button">
              <ScanBarcode size={16} />
              {copy.scanAction}
            </button>
          </div>

          <div className="form-grid form-grid-tight">
            <label>
              <span>{copy.fields.customer}</span>
              <select onChange={(event) => setCustomerId(event.target.value)} value={customerId}>
                <option value="">{copy.cashCustomer}</option>
                {(customers?.items ?? []).map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>{copy.fields.paymentMethod}</span>
              <select onChange={(event) => setPaymentMethod(event.target.value)} value={paymentMethod}>
                <option value="cash">{copy.paymentMethods.cash}</option>
                <option value="card">{copy.paymentMethods.card}</option>
                <option value="credit">{copy.paymentMethods.credit}</option>
                <option value="wallet">{copy.paymentMethods.wallet}</option>
              </select>
            </label>
          </div>

          {loading ? (
            <QueryFeedback title={copy.loadingTitle} message={copy.loadingMessage} />
          ) : error ? (
            <QueryFeedback title={copy.errorTitle} message={error} tone="error" />
          ) : (
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <span className="product-state">
                    {product.stock_qty && product.stock_qty > 0 ? copy.productStateAvailable : copy.productStateLowStock}
                  </span>
                  <h3>{product.name}</h3>
                  <strong>{(product.price ?? 0).toLocaleString(numberLocale)}</strong>
                  <button
                    className="secondary-button"
                    onClick={() => addToCart(product.id, product.name, product.price ?? 0)}
                    type="button"
                  >
                    {copy.addToCart}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="cart-panel">
          <span className="eyebrow">{copy.cartEyebrow}</span>
          <h3>{copy.cartTitle}</h3>
          <ul className="mini-list">
            {cart.length > 0 ? (
              cart.map((product) => (
                <li key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.qty} x {product.price.toLocaleString(numberLocale)}</span>
                  </div>
                  <div className="qty-controls">
                    <button className="secondary-button compact-button" onClick={() => updateQty(product.id, product.qty - 1)} type="button">
                      -
                    </button>
                    <span>{product.qty}</span>
                    <button className="secondary-button compact-button" onClick={() => updateQty(product.id, product.qty + 1)} type="button">
                      +
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li>
                <strong>{copy.emptyCartTitle}</strong>
                <span>{copy.emptyCartMessage}</span>
              </li>
            )}
          </ul>
          <div className="totals-block">
            <div><span>{copy.totals.customer}</span><strong>{selectedCustomer?.name || copy.cashCustomer}</strong></div>
            <div><span>{copy.totals.paymentMethod}</span><strong>{paymentMethodLabel}</strong></div>
            <div><span>{copy.totals.total}</span><strong>{cartTotal.toLocaleString(numberLocale)}</strong></div>
            <div><span>{copy.totals.tax}</span><strong>0.00</strong></div>
            <div><span>{copy.totals.net}</span><strong>{cartTotal.toLocaleString(numberLocale)}</strong></div>
          </div>
          <button className="primary-button wide-button" disabled={submitting || cart.length === 0} onClick={handleCheckout} type="button">
            {submitting ? copy.checkoutPending : copy.checkoutSubmit}
          </button>
          {checkoutMessage ? <QueryFeedback title={copy.successTitle} message={checkoutMessage} /> : null}
          {checkoutError ? <QueryFeedback title={copy.errorCheckoutTitle} message={checkoutError} tone="error" /> : null}
        </aside>
      </section>
    </div>
  );
}
