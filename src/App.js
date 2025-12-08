import React, { useState, useEffect, useContext } from "react";
import "./App.css";
import { AuthContext } from "./AuthContext";
import Login from "./Login";
import cities from "./cities.json";

const API_URL = "https://api.openweathermap.org/data/2.5/weather";

function WeatherCard({ weather, favorites, setFavorites }) {
  const { user } = useContext(AuthContext);

  const addFavorite = async () => {
    if (!user) return alert("Log in to save favorites");
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-auth-token": token },
      body: JSON.stringify({
        city: weather.name,
        country: weather.sys.country,
        weatherData: weather,
      }),
    });
    const data = await res.json();
    setFavorites(Array.isArray(data) ? data : []);
  };

  const removeFavorite = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(
    `http://localhost:5000/api/favorites/${weather.name}?country=${weather.sys.country}`,
    {
      method: "DELETE",
      headers: { "x-auth-token": token },
    }
  );
  const data = await res.json();
  setFavorites(Array.isArray(data) ? data : []);
};


  const isFavorite = favorites.some((f) => f.city === weather.name);

  return (
    <div className="card fade-in">
      <h2 className="city-title">{weather.name}</h2>
      <img
        className="weather-icon"
        src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
        alt="weather icon"
      />
      <h3 className="desc">{weather.weather[0].description}</h3>
      <div className="weather-details">
        <p>🌡 <strong>{weather.main.temp}°C</strong></p>
        <p>💧 Humidity: {weather.main.humidity}%</p>
        <p>🌬 Wind: {weather.wind.speed} m/s</p>
      </div>
      {user && (
        <button
          className={`favorite-btn ${isFavorite ? "remove" : "add"}`}
          onClick={isFavorite ? removeFavorite : addFavorite}
        >
          {isFavorite ? "★ Remove Favorite" : "☆ Add Favorite"}
        </button>

      )}
    </div>
  );
}

function FavoritesList({ favorites }) {
  if (!favorites || favorites.length === 0) return null;

  return (
    <div className="favorites fade-in">
      <h3>⭐ Your Favorites</h3>
      <ul className="favorites-list">
        {favorites.map((fav) => (
          <li key={fav.city} className="favorite-item">
            {fav.city}, {fav.country}
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const { user, logout } = useContext(AuthContext);
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [favorites, setFavorites] = useState([]);

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

  const fetchWeather = async ({ lat, lon }) => {
    try {
      setLoading(true);
      setError("");
      setWeather(null);

      const url = `${API_URL}?lat=${lat}&lon=${lon}&appid=${process.env.REACT_APP_WEATHER_KEY}&units=metric`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("City not found or API issue");

      const data = await response.json();
      setWeather(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    const matches = cities
      .filter((city) =>
        city.name.toLowerCase().startsWith(query.toLowerCase())
      )
      .slice(0, 10);
    setSuggestions(matches);
  }, [query]);

  const handleSelectCity = (city) => {
    setQuery(`${city.name}, ${city.state}`);
    setSuggestions([]);
    fetchWeather({ lat: city.coord.lat, lon: city.coord.lon });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      handleSelectCity(suggestions[0]);
    }
  };

  const getLocationWeather = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setError("Location permission denied")
    );
  };

  if (!user) return <Login />;

  return (
    <>
      <nav className="navbar">
        <h1 className="nav-title">Weather App</h1>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </nav>

      <div className="container fade-in">
        {user && <h2 className="welcome">Welcome, {user.username}!</h2>}

        <div className="search-box">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for a city..."
            className="search-input"
          />
          <button
            className="btn primary"
            onClick={() => {
              if (query.trim() === "") return;
              const match = cities.find(
                (c) =>
                  `${c.name}, ${c.state}`.toLowerCase() === query.toLowerCase() ||
                  c.name.toLowerCase() === query.toLowerCase()
              );
              if (match) fetchWeather({ lat: match.coord.lat, lon: match.coord.lon });
              else setError("City not found in database");
            }}
          >
            Search
          </button>
          <button className="btn secondary" onClick={getLocationWeather}>
            Use My Location
          </button>

          {suggestions.length > 0 && (
            <div className="autocomplete-dropdown">
              {suggestions.map((city) => (
                <div
                  key={city.id}
                  className="autocomplete-item"
                  onClick={() => handleSelectCity(city)}
                >
                  {city.name}, {city.state}, {city.country}
                </div>
              ))}
            </div>
          )}
        </div>

        {loading && <p className="loading">Loading...</p>}
        {error && <p className="error">{error}</p>}

        {weather && (
          <WeatherCard
            weather={weather}
            favorites={favorites}
            setFavorites={setFavorites}
          />
        )}
        <FavoritesList favorites={favorites} />
      </div>
    </>
  );
}

export default App;