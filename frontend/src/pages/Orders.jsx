import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import Modal from "../components/Modal.jsx";
import { useToast } from "../components/Toast.jsx";
import { EyeIcon, PlusIcon, SearchIcon, TrashIcon } from "../components/Icons.jsx";

function orderNo(o) {
  const year = new Date(o.created_at).getFullYear();
  return `ORD-${year}-${String(o.id).padStart(3, "0")}`;
}

export default function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.listOrders(), api.listProducts(), api.listCustomers()])
      .then(([o, p, c]) => {
        setOrders(o);
        setProducts(p);
        setCustomers(c);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const customerName = (id) =>
    customers.find((c) => c.id === id)?.full_name || `#${id}`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        orderNo(o).toLowerCase().includes(q) ||
        customerName(o.customer_id).toLowerCase().includes(q)
    );
  }, [orders, customers, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDetail = async (id) => {
    try {
      setDetail(await api.getOrder(id));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (o) => {
    if (!window.confirm(`Delete ${orderNo(o)}? Stock will be restored.`)) return;
    try {
      await api.deleteOrder(o.id);
      toast.success("Order deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <button
          className="btn btn-primary"
          onClick={() => setCreateOpen(true)}
          disabled={customers.length === 0 || products.length === 0}
          title={
            customers.length === 0 || products.length === 0
              ? "Add at least one customer and one product first"
              : ""
          }
        >
          <PlusIcon width={16} height={16} /> Create Order
        </button>
      </div>

      <div className="card">
        <div className="search-box">
          <SearchIcon width={18} height={18} />
          <input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="muted">No orders found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th className="num">Total</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div className="primary-text">{orderNo(o)}</div>
                    <div className="sub-text">{o.items.length} items</div>
                  </td>
                  <td>{customerName(o.customer_id)}</td>
                  <td className="muted">
                    {new Date(o.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="num primary-text">
                    ${Number(o.total_amount).toFixed(2)}
                  </td>
                  <td className="actions-col">
                    <button
                      className="icon-btn"
                      onClick={() => openDetail(o.id)}
                      aria-label="View"
                      title="View"
                    >
                      <EyeIcon width={18} height={18} />
                    </button>
                    <button
                      className="icon-btn icon-btn-danger"
                      onClick={() => remove(o)}
                      aria-label="Delete"
                      title="Delete"
                    >
                      <TrashIcon width={18} height={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {createOpen && (
        <CreateOrder
          products={products}
          customers={customers}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}

      {detail && (
        <OrderDetail
          order={detail}
          products={products}
          title={orderNo(detail)}
          customerName={customerName(detail.customer_id)}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

function CreateOrder({ products, customers, onClose, onCreated }) {
  const toast = useToast();
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([{ product_id: "", quantity: 1 }]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const productById = useMemo(
    () => Object.fromEntries(products.map((p) => [String(p.id), p])),
    [products]
  );

  const total = lines.reduce((sum, l) => {
    const p = productById[l.product_id];
    return sum + (p ? Number(p.price) * Number(l.quantity || 0) : 0);
  }, 0);

  const setLine = (i, patch) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () => setLines((ls) => [...ls, { product_id: "", quantity: 1 }]);
  const removeLine = (i) => setLines((ls) => ls.filter((_, idx) => idx !== i));

  const validate = () => {
    const e = {};
    if (!customerId) e.customer = "Select a customer";
    lines.forEach((l, i) => {
      if (!l.product_id) e[`line${i}`] = "Select a product";
      else if (!(Number(l.quantity) > 0)) e[`line${i}`] = "Quantity must be > 0";
      else {
        const p = productById[l.product_id];
        if (p && Number(l.quantity) > p.quantity)
          e[`line${i}`] = `Only ${p.quantity} in stock`;
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.createOrder({
        customer_id: Number(customerId),
        items: lines.map((l) => ({
          product_id: Number(l.product_id),
          quantity: Number(l.quantity),
        })),
      });
      toast.success("Order created");
      onCreated();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Create Order" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label>Customer</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">— Select customer —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} ({c.email})
              </option>
            ))}
          </select>
          {errors.customer && <span className="field-error">{errors.customer}</span>}
        </div>

        <label className="label-block">Line items</label>
        {lines.map((l, i) => (
          <div className="order-line" key={i}>
            <select
              value={l.product_id}
              onChange={(e) => setLine(i, { product_id: e.target.value })}
            >
              <option value="">— Product —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${Number(p.price).toFixed(2)}, {p.quantity} in stock)
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={l.quantity}
              onChange={(e) => setLine(i, { quantity: e.target.value })}
              className="qty-input"
            />
            {lines.length > 1 && (
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => removeLine(i)}
              >
                ×
              </button>
            )}
            {errors[`line${i}`] && (
              <span className="field-error line-error">{errors[`line${i}`]}</span>
            )}
          </div>
        ))}

        <button type="button" className="btn btn-sm" onClick={addLine}>
          + Add line item
        </button>

        <div className="order-total">
          Estimated total: <strong>${total.toFixed(2)}</strong>
        </div>

        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Placing…" : "Place Order"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function OrderDetail({ order, products, title, customerName, onClose }) {
  const productName = (id) => products.find((p) => p.id === id)?.name || `#${id}`;
  return (
    <Modal title={title} onClose={onClose}>
      <p>
        <strong>Customer:</strong> {customerName}
      </p>
      <p>
        <strong>Date:</strong> {new Date(order.created_at).toLocaleString()}
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th className="num">Qty</th>
            <th className="num">Unit</th>
            <th className="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it) => (
            <tr key={it.id}>
              <td>{productName(it.product_id)}</td>
              <td className="num">{it.quantity}</td>
              <td className="num">${Number(it.unit_price).toFixed(2)}</td>
              <td className="num">${Number(it.subtotal).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="num">
              <strong>Total</strong>
            </td>
            <td className="num">
              <strong>${Number(order.total_amount).toFixed(2)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </Modal>
  );
}
