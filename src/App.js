import React, { useState, useEffect, useContext } from "react";
import "./App.css";
import { AuthContext } from "./AuthContext";
import Login from "./Login";
import cities from "./cities.json";

const formatLocation = (name, state, country) => {
  const parts = [name, state?.trim(), country?.trim()].filter(Boolean);
  return parts.join(", ");
};

const isExactLocationInput = (q) => {
  const lower = q.trim().toLowerCase();
  if (!lower) return false;

  if (cities.some(c =>
    formatLocation(c.name, c.state, c.country).toLowerCase() === lower
  )) return true;

  if (cities.some(c =>
    `${c.name}, ${c.country}`.toLowerCase() === lower
  )) return true;

  return false;
};

const API_URL = "https://api.openweathermap.org/data/2.5/weather";

function WeatherCard({ weather, favorites, setFavorites }) {
  const { user } = useContext(AuthContext);

  const matchCity = cities.find(c => c.id === weather.id);
  const state = matchCity?.state || "";
  // const coord = matchCity?.coord || { lat: weather.coord?.lat, lon: weather.coord?.lon };

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
        weatherData: weather
      }),
    });
    const data = await res.json();
    setFavorites(Array.isArray(data) ? data : []);
  };

  const removeFavorite = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(
    `http://localhost:5000/api/favorites/${weather.id}`,
    {
      method: "DELETE",
      headers: { "x-auth-token": token },
    }
  );
  const data = await res.json();
  setFavorites(Array.isArray(data) ? data : []);
};


  const isFavorite = favorites.some(f => f.cityId === weather.id);

  return (
    <div className="card fade-in">
      <h2 className="city-title">{formatLocation(weather.name, state, weather.sys.country)}</h2>
      <img
        className="weather-icon"
        src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
        alt="weather icon"
      />
      <h3 className="desc">{weather.weather[0].description}</h3>
      <div className="weather-details">
        <p>🌡 <strong>{weather.main.temp}°F</strong></p>
        <p>💧 Humidity: {weather.main.humidity}%</p>
        <p>🌬 Wind: {weather.wind.speed} mph</p>
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
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelectFavorite(fav);
            }}
            aria-label={`Open weather for ${formatLocation(fav.city, fav.state, fav.country)}`}
          >
            {formatLocation(fav.city, fav.state, fav.country)}
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

    const parts = q.split(",").map(p => p.trim());
    const cityPart    = parts[0] || "";
    const statePart   = parts[1] || "";
    const countryPart = parts[2] || "";

    const startsWith = (value, prefix) =>
      !prefix || (value && value.toLowerCase().startsWith(prefix));

    let matches = cities.filter(c => {
      if (!startsWith(c.name, cityPart)) return false;

      if (statePart && !startsWith(c.state || "", statePart)) return false;

      if (countryPart && !startsWith(c.country || "", countryPart)) return false;

      return true;
    });

    matches = matches
      .sort((a, b) => {
        const aCityExact = a.name.toLowerCase().startsWith(cityPart) ? 0 : 1;
        const bCityExact = b.name.toLowerCase().startsWith(cityPart) ? 0 : 1;
        if (aCityExact !== bCityExact) return aCityExact - bCityExact;

        const aStateExact = statePart && (a.state || "").toLowerCase().startsWith(statePart) ? 0 : 1;
        const bStateExact = statePart && (b.state || "").toLowerCase().startsWith(statePart) ? 0 : 1;
        if (aStateExact !== bStateExact) return aStateExact - bStateExact;

        const aCountryExact = countryPart && (a.country || "").toLowerCase().startsWith(countryPart) ? 0 : 1;
        const bCountryExact = countryPart && (b.country || "").toLowerCase().startsWith(countryPart) ? 0 : 1;
        if (aCountryExact !== bCountryExact) return aCountryExact - bCountryExact;

        const aLabel = formatLocation(a.name, a.state, a.country);
        const bLabel = formatLocation(b.name, b.state, b.country);
        return aLabel.localeCompare(bLabel);
      })
      .slice(0, 10);

    setSuggestions(matches);
  }, [query]);

  const handleSelectCity = (city) => {
    setQuery(formatLocation(city.name, city.state, city.country));
    setSuggestions([]);
    fetchWeather({ lat: city.coord.lat, lon: city.coord.lon });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (suggestions.length > 0) {
       handleSelectCity(suggestions[0]);
      } else {
        onSearchClick();
      }
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
  
  const onSearchClick = () => {
  if (query.trim() === "") return;

  const q = query.toLowerCase();

  let match = cities.find(
    (c) => formatLocation(c.name, c.state, c.country).toLowerCase() === q
  );

  if (!match) {
    match = cities.find(
      (c) => `${c.name}, ${c.country}`.toLowerCase() === q
    );
  }

  if (!match) {
    match = cities.find((c) => c.name.toLowerCase() === q);
  }

  if (match) {
    fetchWeather({ lat: match.coord.lat, lon: match.coord.lon });
    setSuggestions([]);
  } else {
    setError("City not found");
  }
  };

  const handleSelectFavorite = (fav) => {
    setQuery(formatLocation(fav.city, fav.state, fav.country));
    setSuggestions([]);

    let lat, lon;

    if (fav.coord && typeof fav.coord.lat === "number" && typeof fav.coord.lon === "number") {
      lat = fav.coord.lat;
      lon = fav.coord.lon;
    } else {
      const match =
        cities.find(c => c.id === fav.cityId) ||
        cities.find(c =>
          c.name === fav.city &&
          (fav.state ? c.state === fav.state : true) &&
          c.country === fav.country
        );

      if (match) {
        lat = match.coord.lat;
        lon = match.coord.lon;
      }
    }

    if (lat != null && lon != null) {
      fetchWeather({ lat, lon });
    } else {
      setError("Coordinates not found for this favorite");
    }
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
          <button className="btn primary" onClick={onSearchClick}>Search</button>
          <button className="btn secondary" onClick={getLocationWeather}>
            Use My Location
          </button>

          {suggestions.length > 0 && (
            <div className="autocomplete-dropdown">
              {suggestions.map((city) => (
                <div
                  key={`${city.id}-${city.state || ""}-${city.country}`}
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

        {weather && (
          <WeatherCard
            weather={weather}
            favorites={favorites}
            setFavorites={setFavorites}
          />
        )}
        <FavoritesList favorites={favorites} onSelectFavorite={handleSelectFavorite} />
      </div>
    </>
  );
}

export default App;