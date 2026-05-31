// Thin fetch wrapper around the backend API.
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(
  /\/$/,
  ""
);

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = extractError(data) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

// FastAPI returns {detail: "..."} or {detail: [{loc, msg}, ...]} for 422.
function extractError(data) {
  if (!data) return null;
  const { detail } = data;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => {
        const field = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : "";
        return field ? `${field}: ${e.msg}` : e.msg;
      })
      .join(", ");
  }
  return null;
}

export const api = {
  // Products
  listProducts: () => request("/products"),
  createProduct: (p) => request("/products", { method: "POST", body: p }),
  updateProduct: (id, p) => request(`/products/${id}`, { method: "PUT", body: p }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  // Customers
  listCustomers: () => request("/customers"),
  createCustomer: (c) => request("/customers", { method: "POST", body: c }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: "DELETE" }),

  // Orders
  listOrders: () => request("/orders"),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (o) => request("/orders", { method: "POST", body: o }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: "DELETE" }),

  // Dashboard
  getDashboard: () => request("/dashboard"),
};
