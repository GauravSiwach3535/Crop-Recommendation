import { Link, useNavigate, useLocation } from "react-router-dom";
import { authService } from "../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isLoggedIn = !!localStorage.getItem("access_token");

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium transition ${
        pathname === to
          ? "text-primary-600 border-b-2 border-primary-600 pb-0.5"
          : "text-gray-600 hover:text-primary-600"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-primary-700 text-lg">
          <span className="text-2xl">🌾</span> CropAI
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6">
          {navLink("/about", "About")}
          {isLoggedIn ? (
            <>
              {navLink("/", "Recommend")}
              {navLink("/history", "History")}
              {navLink("/profile", "Profile")}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-500 hover:text-red-600 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {navLink("/login", "Login")}
              {navLink("/register", "Register")}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
