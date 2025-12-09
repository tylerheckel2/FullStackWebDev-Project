import React, { useState, useEffect, useContext } from "react";
import "./App.css";
import { AuthContext } from "./AuthContext";
import Login from "./Login";
import cities from "./cities.json";
import WeatherImage from "./images/WeatherImage.png";

const formatLocation = (name, state, country) => {
  const parts = [name, state?.trim(), country?.trim()].filter(Boolean);
  return parts.join(", ");
};

const isExactLocationInput = (q) => {
  const lower = q.trim().toLowerCase();
  if (!lower) return false;

  if (
    cities.some(
      (c) =>
        formatLocation(c.name, c.state, c.country).toLowerCase() === lower
    )
  )
    return true;

  if (
    cities.some((c) => `${c.name}, ${c.country}`.toLowerCase() === lower)
  )
    return true;

  return false;
};

const API_URL = "https://api.openweathermap.org/data/2.5/weather";

// -------------------- TOMORROW FORECAST CARD --------------------
function TomorrowCard({ tomorrow }) {
  return (
    <div className="card fade-in">
      <h2>Tomorrow's Forecast</h2>
      <img
        className="weather-icon"
        src={`https://openweathermap.org/img/wn/${tomorrow.icon}@2x.png`}
        alt="weather icon"
      />
      <h3 className="desc">{tomorrow.desc}</h3>
      <div className="weather-details">
        <p>
          🌡 <strong>{tomorrow.temp}°F</strong>
        </p>
        <p>💧 Humidity: {tomorrow.humidity}%</p>
        <p>🌬 Wind: {tomorrow.wind} mph</p>
      </div>
    </div>
  );
}

// -------------------- WEATHER CARD --------------------
function WeatherCard({
  weather,
  favorites,
  setFavorites,
  onFetchTomorrow,
}) {
  const { user } = useContext(AuthContext);

  const matchCity = cities.find((c) => c.id === weather.id);
  const state = matchCity?.state || "";

  const addFavorite = async () => {
    if (!user) return alert("Log in to save favorites");
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-auth-token": token },
      body: JSON.stringify({
        cityId: weather.id,
        city: weather.name,
        state,
        country: weather.sys.country,
        coord: { lat: weather.coord.lat, lon: weather.coord.lon },
        weatherData: weather,
      }),
    });
    const data = await res.json();
    setFavorites(Array.isArray(data) ? data : []);
  };

  const removeFavorite = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `http://localhost:5000/api/favorites/${weather.id}`,
      { method: "DELETE", headers: { "x-auth-token": token } }
    );
    const data = await res.json();
    setFavorites(Array.isArray(data) ? data : []);
  };

  const isFavorite = favorites.some((f) => f.cityId === weather.id);

  return (
    <div className="card fade-in">
      <h2 className="city-title">
        {formatLocation(weather.name, state, weather.sys.country)}
      </h2>

      <img
        className="weather-icon"
        src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
        alt="weather icon"
      />

      <h3 className="desc">{weather.weather[0].description}</h3>

      <div className="weather-details">
        <p>
          🌡 <strong>{weather.main.temp}°F</strong>
        </p>
        <p>💧 Humidity: {weather.main.humidity}%</p>
        <p>🌬 Wind: {weather.wind.speed} mph</p>
      </div>

      {user && (
        <>
          <button
            className={`favorite-btn ${isFavorite ? "remove" : "add"}`}
            onClick={isFavorite ? removeFavorite : addFavorite}
          >
            {isFavorite ? "★ Remove Favorite" : "☆ Add Favorite"}
          </button>

          <button
            className="btn secondary"
            onClick={() => {
              const lat = weather.coord?.lat;
              const lon = weather.coord?.lon;
              onFetchTomorrow(lat, lon);
            }}
          >
            View Tomorrow’s Forecast →
          </button>
        </>
      )}
    </div>
  );
}

// -------------------- FAVORITES LIST --------------------
function FavoritesList({ favorites, onSelectFavorite }) {
  if (!favorites || favorites.length === 0) return null;

  return (
    <div className="favorites fade-in">
      <h3>⭐ Your Favorites</h3>
      <ul className="favorites-list">
        {favorites.map((fav) => (
          <li
            key={fav.cityId}
            className="favorite-item"
            onClick={() => onSelectFavorite(fav)}
          >
            {formatLocation(fav.city, fav.state, fav.country)}
          </li>
        ))}
      </ul>
    </div>
  );
}

// -------------------- MAIN APP --------------------
function App() {
  const { user, logout } = useContext(AuthContext);
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState(null);
  const [tomorrowWeather, setTomorrowWeather] = useState(null);
  const [showTomorrow, setShowTomorrow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Load favorites on login
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/favorites", {
        headers: { "x-auth-token": token },
      });
      const data = await res.json();
      setFavorites(Array.isArray(data) ? data : []);
    };
    fetchFavorites();
  }, [user]);

  // TODAY weather fetch
  const fetchWeather = async ({ lat, lon }) => {
    try {
      setLoading(true);
      setError("");
      setWeather(null);
      setShowTomorrow(false);
      setTomorrowWeather(null);

      const url = `${API_URL}?lat=${lat}&lon=${lon}&appid=${process.env.REACT_APP_WEATHER_KEY}&units=imperial`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("City not found");

      const data = await response.json();
      setWeather(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // TOMORROW weather fetch
  const fetchTomorrow = async ({ lat, lon }) => {
  try {
    if (!lat || !lon) {
      setError("Missing coordinates for forecast");
      return;
    }

    setLoading(true);
    setError("");
    setTomorrowWeather(null);

    // 5-day / 3-hour forecast (free tier)
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.REACT_APP_WEATHER_KEY}&units=imperial`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Forecast unavailable");

    const data = await res.json();

    // Figure out "tomorrow" in local time
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    const tYear = tomorrow.getFullYear();
    const tMonth = tomorrow.getMonth();
    const tDate = tomorrow.getDate();

    // All forecast entries for tomorrow
    const tomorrowEntries = data.list.filter((item) => {
      const d = new Date(item.dt * 1000);
      return (
        d.getFullYear() === tYear &&
        d.getMonth() === tMonth &&
        d.getDate() === tDate
      );
    });

    if (!tomorrowEntries.length) {
      throw new Error("No forecast data for tomorrow");
    }

    // Pick the entry closest to 12:00 (noon) for a "representative" tomorrow forecast
    const targetHour = 12;
    let best = tomorrowEntries[0];
    let bestDiff = Math.abs(new Date(best.dt * 1000).getHours() - targetHour);

    tomorrowEntries.forEach((item) => {
      const h = new Date(item.dt * 1000).getHours();
      const diff = Math.abs(h - targetHour);
      if (diff < bestDiff) {
        best = item;
        bestDiff = diff;
      }
    });

    setTomorrowWeather({
      temp: best.main.temp,
      humidity: best.main.humidity,
      wind: best.wind.speed,
      desc: best.weather[0].description,
      icon: best.weather[0].icon,
    });

    setShowTomorrow(true);
  } catch (err) {
    console.error("Tomorrow forecast error:", err);
    setError(err.message || "Could not load tomorrow's forecast");
    setShowTomorrow(false);
  } finally {
    setLoading(false);
  }
};
  // Autocomplete Suggestions
  useEffect(() => {
    const q = (query || "")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/,\s*,+/g, ", ")
      .toLowerCase();

    if (q === "") {
      setSuggestions([]);
      return;
    }

    if (isExactLocationInput(query)) {
      setSuggestions([]);
      return;
    }

    const parts = q.split(",").map((p) => p.trim());
    const cityPart = parts[0] || "";

    let matches = cities.filter((c) =>
      c.name.toLowerCase().startsWith(cityPart)
    );

    matches = matches.slice(0, 10);
    setSuggestions(matches);
  }, [query]);

  // Select city from dropdown
  const handleSelectCity = (city) => {
    setQuery(formatLocation(city.name, city.state, city.country));
    setSuggestions([]);
    fetchWeather({ lat: city.coord.lat, lon: city.coord.lon });
    // we DON'T auto-show tomorrow here, user decides with button
  };

  // Enter key search
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (suggestions.length > 0) handleSelectCity(suggestions[0]);
      else onSearchClick();
    }
  };

  // Geolocation
  const getLocationWeather = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchWeather({ lat: latitude, lon: longitude });
      },
      () => setError("Location permission denied")
    );
  };

  // Manual Search
  const onSearchClick = () => {
    if (query.trim() === "") return;

    const q = query.toLowerCase();
    let match =
      cities.find(
        (c) => formatLocation(c.name, c.state, c.country).toLowerCase() === q
      ) ||
      cities.find((c) => `${c.name}, ${c.country}`.toLowerCase() === q) ||
      cities.find((c) => c.name.toLowerCase() === q);

    if (match) {
      fetchWeather({ lat: match.coord.lat, lon: match.coord.lon });
    } else setError("City not found");
  };

  // Favorites selection
  const handleSelectFavorite = (fav) => {
    setQuery(formatLocation(fav.city, fav.state, fav.country));

    const lat = fav.coord?.lat;
    const lon = fav.coord?.lon;

    if (lat && lon) {
      fetchWeather({ lat, lon });
    } else {
      setError("Favorite is missing coordinates");
    }
  };

  const handleFetchTomorrowFromToday = (lat, lon) => {
    fetchTomorrow({ lat, lon });
  };

  if (!user) return <Login />;

  return (
    <>
      <nav className="navbar">
        <h1 className="nav-title">
          Weather App{" "}
          <img
            src={WeatherImage}
            alt="Weather App Logo"
            style={{ width: "60px", height: "60px", verticalAlign: "middle" }}
          />
        </h1>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </nav>

      <div className="container fade-in">
        <h2 className="welcome">Welcome, {user.username}!</h2>

                <div className="search-box">
          {/* Accessible label for search input */}
          <label
            htmlFor="city-search"
            className="visually-hidden"
          >
            Search for a city
          </label>

          <input
            id="city-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for a city..."
            className="search-input"
          />

          <button className="btn primary" onClick={onSearchClick}>
            Search
          </button>

          <button className="btn secondary" onClick={getLocationWeather}>
            Use My Location
          </button>

          {/* AUTOCOMPLETE */}
          {suggestions.length > 0 && (
            <div className="autocomplete-dropdown">
              {suggestions.map((city) => (
                <div
                  key={city.id}
                  className="autocomplete-item"
                  onClick={() => handleSelectCity(city)}
                >
                  {formatLocation(city.name, city.state, city.country)}
                </div>
              ))}
            </div>
          )}
        </div>


        {loading && <p className="loading">Loading...</p>}
        {error && <p className="error">{error}</p>}

        {/* TODAY WEATHER - always shows when we have weather */}
        {weather && (
          <WeatherCard
            weather={weather}
            favorites={favorites}
            setFavorites={setFavorites}
            onFetchTomorrow={handleFetchTomorrowFromToday}
          />
        )}

        {/* TOMORROW WEATHER - appears below today */}
        {showTomorrow && tomorrowWeather && (
          <>
            <TomorrowCard tomorrow={tomorrowWeather} />
            <button
              className="btn secondary"
              onClick={() => setShowTomorrow(false)}
              style={{ marginTop: "10px" }}
            >
              ← Hide Tomorrow
            </button>
          </>
        )}

        <FavoritesList
          favorites={favorites}
          onSelectFavorite={handleSelectFavorite}
        />
      </div>
    </>
  );
}

export default App;
