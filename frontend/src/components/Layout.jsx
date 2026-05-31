import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/products", label: "Products" },
  { to: "/customers", label: "Customers" },
  { to: "/orders", label: "Orders" },
];

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="hamburger"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>
        <span className="brand">📦 Inventory & Orders</span>
      </header>

      <div className="app-body">
        <nav className={`sidebar ${open ? "open" : ""}`}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
