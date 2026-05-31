import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useToast } from "../components/Toast.jsx";

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

  const cards = [
    { label: "Total Products", value: data.total_products },
    { label: "Total Customers", value: data.total_customers },
    { label: "Total Orders", value: data.total_orders },
    { label: "Low Stock Items", value: data.low_stock_products.length },
  ];

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      <div className="stat-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="section-title">Low Stock Products</h2>
        {data.low_stock_products.length === 0 ? (
          <p className="muted">All products are well stocked. 🎉</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th className="num">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {data.low_stock_products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.sku}</td>
                  <td className="num">
                    <span className="badge badge-warn">{p.quantity}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
