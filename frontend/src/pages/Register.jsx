import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { authService } from "../services/api";

const ROLES = [
  { value: "farmer", label: "Farmer" },
  { value: "officer", label: "Agronomist / Outreach Officer" },
  { value: "researcher", label: "Researcher" },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "", name: "", password: "", password2: "",
    role: "farmer", contact: "", location: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await authService.register(form);
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (err) {
      const errors = err.response?.data;
      const msg = errors
        ? Object.values(errors).flat().join(" ")
        : "Registration failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = "text", required = true) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        className="input-field"
        value={form[name]}
        onChange={set(name)}
        required={required}
      />
    </div>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">
          Already registered?{" "}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field("name", "Full name")}
          {field("email", "Email address", "email")}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="input-field" value={form.role} onChange={set("role")}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {field("contact", "Phone / Contact", "tel", false)}
          {field("location", "Village / District", "text", false)}
          {field("password", "Password", "password")}
          {field("password2", "Confirm password", "password")}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
