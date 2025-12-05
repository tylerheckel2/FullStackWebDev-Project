import React, { useState } from "react";
import "./App.css";

const API_URL = "https://api.openweathermap.org/data/2.5/weather";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWeather = async (query) => {
    try {
      setLoading(true);
      setError("");
      setWeather(null);

      const url =
        typeof query === "string"
          ? `${API_URL}?q=${query}&appid=${process.env.REACT_APP_WEATHER_KEY}&units=metric`
          : `${API_URL}?lat=${query.lat}&lon=${query.lon}&appid=${process.env.REACT_APP_WEATHER_KEY}&units=metric`;

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

  const getLocationWeather = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => setError("Location permission denied")
    );
  };

  return (
    <div className="container">
      <h1 className="title">Weather App</h1>

      <div className="search-box">
        <input
          className="search-input"
          type="text"
          placeholder="Search for a city..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <button className="btn primary" onClick={() => fetchWeather(city)}>
          Search
        </button>

        <button className="btn secondary" onClick={getLocationWeather}>
          Use My Location
        </button>
      </div>

      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error">{error}</p>}

      {weather && (
        <div className="card">
          <h2>{weather.name}</h2>
          <img
            className="weather-icon"
            src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
            alt="weather icon"
          />
          <h3 className="desc">{weather.weather[0].description}</h3>
          <p>🌡 <strong>{weather.main.temp}°C</strong></p>
          <p>💧 Humidity: {weather.main.humidity}%</p>
          <p>🌬 Wind: {weather.wind.speed} m/s</p>
        </div>
      )}
    </div>
  );
}

export default App;
