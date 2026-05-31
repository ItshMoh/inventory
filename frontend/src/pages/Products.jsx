import { useEffect, useState } from "react";
import { api } from "../api.js";
import Modal from "../components/Modal.jsx";
import { useToast } from "../components/Toast.jsx";

const EMPTY = { name: "", sku: "", price: "", quantity: "" };

export default function Products() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .listProducts()
      .then(setProducts)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, sku: p.sku, price: p.price, quantity: p.quantity });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.sku.trim()) e.sku = "SKU is required";
    if (form.price === "" || Number(form.price) < 0) e.price = "Price must be ≥ 0";
    if (form.quantity === "" || !Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0)
      e.quantity = "Quantity must be a whole number ≥ 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
    };
    setSaving(true);
    try {
      if (editing) {
        await api.updateProduct(editing.id, payload);
        toast.success("Product updated");
      } else {
        await api.createProduct(payload);
        toast.success("Product created");
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete product "${p.name}"?`)) return;
    try {
      await api.deleteProduct(p.id);
      toast.success("Product deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Product
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading…</p>
        ) : products.length === 0 ? (
          <p className="muted">No products yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th className="num">Price</th>
                <th className="num">Qty</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.sku}</td>
                  <td className="num">${Number(p.price).toFixed(2)}</td>
                  <td className="num">{p.quantity}</td>
                  <td className="actions-col">
                    <button className="btn btn-sm" onClick={() => openEdit(p)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(p)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal
          title={editing ? "Edit Product" : "Add Product"}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={submit} noValidate>
            <Field label="Name" error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="SKU" error={errors.sku}>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </Field>
            <Field label="Price" error={errors.price}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Field>
            <Field label="Quantity in stock" error={errors.quantity}>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Field>
            <div className="form-actions">
              <button
                type="button"
                className="btn"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
