import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  BoxIcon,
  CartIcon,
  DashboardIcon,
  UsersIcon,
} from "./Icons.jsx";

const links = [
  { to: "/", label: "Dashboard", end: true, Icon: DashboardIcon },
  { to: "/products", label: "Products", Icon: BoxIcon },
  { to: "/customers", label: "Customers", Icon: UsersIcon },
  { to: "/orders", label: "Orders", Icon: CartIcon },
];

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">
            <BoxIcon />
          </span>
          <span className="brand-text">InventoryPro</span>
        </div>

        <nav className="sidebar-nav">
          {links.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <Icon width={18} height={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="avatar avatar-sm">AD</span>
          <div className="user-meta">
            <div className="user-name">Admin User</div>
            <div className="user-email">admin@inventorypro</div>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="mobile-topbar">
          <button
            className="hamburger"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <span className="brand-text">InventoryPro</span>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
