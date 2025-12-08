import { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import WeatherImage from "./images/WeatherImage.png"

export default function Login() {
  const { login, register } = useContext(AuthContext);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src={WeatherImage} alt="Weather App Logo" width="140"/>
        <h2 className="auth-title">
          {mode === "login" ? "Weather App" : "Create an Account"}
        </h2>

        <p className="auth-description">
        Search for weather anywhere and save your favorite cities!
        </p>

        {error && <p className="auth-error">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <input
              className="auth-input"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          )}

          <input
            className="auth-input"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button type="submit" className="auth-btn primary">
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        <button
          className="auth-btn switch"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "Create an account"
            : "Already have an account?"}
        </button>
      </div>
    </div>
  );
}

