import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../AdminPanel.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/auth/secure-soft",
        {
          email: email.trim(),
          password,
        }
      );

      const { token, user } = res.data;

      // Require a complete authentication response.
      if (
        !token ||
        !user ||
        !user.id ||
        !user.email ||
        !["admin", "superadmin"].includes(user.role)
      ) {
        alert("Login failed: Invalid authentication response");
        return;
      }

      // Clear any previous session before saving the new login.
      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminUser");

      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");

      // Keep authentication limited to this browser tab session.
      sessionStorage.setItem("adminToken", token);
      sessionStorage.setItem("adminUser", JSON.stringify(user));

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-left">
          <h1>SOFT Admin</h1>
          <p>
            Manage Academics, Admissions, Examinations and more.
          </p>
        </div>

        <div className="login-right">
          <h2>Admin Login</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!loading) handleLogin();
            }}
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              disabled={loading}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />

            <div>
              <button type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
