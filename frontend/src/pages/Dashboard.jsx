import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useToast } from "../components/Toast.jsx";
import {
  BoxIcon,
  CartIcon,
  TrendingUpIcon,
  UsersIcon,
} from "../components/Icons.jsx";

export default function Dashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboard()
      .then(setData)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="card">Loading…</div>;
  if (!data) return <div className="card">Could not load dashboard.</div>;

  const stats = [
    {
      label: "Total Revenue",
      value: `$${Number(data.total_revenue).toFixed(2)}`,
      Icon: TrendingUpIcon,
      tone: "green",
    },
    { label: "Total Orders", value: data.total_orders, Icon: CartIcon, tone: "blue" },
    { label: "Total Products", value: data.total_products, Icon: BoxIcon, tone: "purple" },
    {
      label: "Total Customers",
      value: data.total_customers,
      Icon: UsersIcon,
      tone: "orange",
    },
  ];

  return (
    <div>
      <h1 className="page-title">Dashboard Overview</h1>

      <div className="stat-grid">
        {stats.map(({ label, value, Icon, tone }) => (
          <div className="stat-card" key={label}>
            <div className="stat-text">
              <div className="stat-label">{label}</div>
              <div className="stat-value">{value}</div>
            </div>
            <span className={`stat-icon stat-icon-${tone}`}>
              <Icon />
            </span>
          </div>
        ))}
      </div>

      <div className="card low-stock-card">
        <div className="card-head">
          <h2 className="section-title">Low Stock Alerts</h2>
          <span className="pill pill-danger">
            {data.low_stock_products.length} items
          </span>
        </div>

        {data.low_stock_products.length === 0 ? (
          <p className="muted">All products are well stocked. 🎉</p>
        ) : (
          <ul className="alert-list">
            {data.low_stock_products.map((p) => (
              <li className="alert-row" key={p.id}>
                <div>
                  <div className="alert-name">{p.name}</div>
                  <div className="alert-sku">SKU: {p.sku}</div>
                </div>
                <div className="alert-right">
                  <div
                    className={`alert-qty ${p.quantity === 0 ? "qty-zero" : "qty-low"}`}
                  >
                    {p.quantity} left
                  </div>
                  <div className="alert-hint">Reorder soon</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
