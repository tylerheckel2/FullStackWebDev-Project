import { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import WeatherImage from "./images/WeatherImage.png";

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
    // main landmark for page region
    <main className="auth-page" role="main">
      <div className="auth-card">
        <img src={WeatherImage} alt="Weather App Logo" width="140" />

        {/* first-level heading */}
        <h1 id="auth-title" className="auth-title">
          {mode === "login" ? "Weather App" : "Create an Account"}
        </h1>

        <p className="auth-description">
          Search for weather anywhere and save your favorite cities!
        </p>

        {error && <p className="auth-error">{error}</p>}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          aria-labelledby="auth-title"
        >
          {mode === "register" && (
            <div className="form-group">
              <label htmlFor="username-input">Username</label>
              <input
                id="username-input"
                className="auth-input"
                placeholder="Username"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email-input">Email</label>
            <input
              id="email-input"
              className="auth-input"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              className="auth-input"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

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
    </main>
  );
}
