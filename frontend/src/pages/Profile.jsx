import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { authService } from "../services/api";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!localStorage.getItem("access_token")) { navigate("/login"); return; }
    authService.getProfile().then(({ data }) => {
      setProfile(data);
      setForm({ name: data.name, contact: data.contact, location: data.location });
    });
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const { data } = await authService.updateProfile(form);
      setProfile(data);
      setEditing(false);
      toast.success("Profile updated.");
    } catch {
      toast.error("Update failed.");
    }
  };

  if (!profile) return <div className="text-center py-20 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium capitalize">
            {profile.role}
          </span>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            {[["name","Full name"],["contact","Contact"],["location","Location"]].map(([f,l]) => (
              <div key={f}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                <input
                  className="input-field"
                  value={form[f]}
                  onChange={(e) => setForm({...form,[f]:e.target.value})}
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="text-sm text-gray-500">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-sm">
            {[
              ["Name", profile.name],
              ["Email", profile.email],
              ["Contact", profile.contact || "—"],
              ["Location", profile.location || "—"],
              ["Member since", new Date(profile.date_joined).toLocaleDateString()],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
            <button onClick={() => setEditing(true)} className="btn-primary mt-4 w-full">
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
