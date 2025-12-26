// Import API key
import { API_KEY } from "./config.js";

// DOM elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const result = document.getElementById("result");
const errorMsg = document.getElementById("error");
const loading = document.getElementById("loading");
const forecastContainer = document.getElementById("forecastContainer");
const forecastSection = document.getElementById("forecastSection");
const themeButtons = document.querySelectorAll(".theme-btn");

// State
let currentCity = "";
let currentLat = 0;
let currentLon = 0;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupEventListeners();
  loadDefaultWeather();
});

/**
 * Load weather for user's current location
 */
function loadDefaultWeather() {
  loading.classList.remove("hidden");

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherByCoords(lat, lon);
      },
      (error) => {
        console.log("Geolocation error:", error);
        // Fallback to default city if geolocation fails
        fetchWeather("Manila");
      }
    );
  } else {
    // Fallback if geolocation not available
    fetchWeather("Manila");
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  searchBtn.addEventListener("click", handleSearch);
  cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
  });
  themeButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => changeTheme(e.target.dataset.theme));
  });
}

/**
 * Initialize theme from localStorage
 */
function initTheme() {
  const savedTheme = localStorage.getItem("weatherTheme") || "day";
  changeTheme(savedTheme);
}

/**
 * Change theme
 */
function changeTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("weatherTheme", theme);

  themeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
}

/**
 * Handle search action
 */
function handleSearch() {
  resetUI();

  let city = cityInput.value.trim();

  // Input validation
  if (!city) {
    showError("Please enter a city name.");
    return;
  }

  if (city.length < 2) {
    showError("City name must be at least 2 characters.");
    return;
  }

  if (!/^[a-zA-Z\s,-]*$/.test(city)) {
    showError("Invalid characters detected. Use letters, spaces, commas, or hyphens.");
    return;
  }

  fetchWeather(city);
}

/**
 * Show error message
 */
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}

/**
 * Clear UI
 */
function resetUI() {
  errorMsg.classList.add("hidden");
  result.classList.add("hidden");
  forecastSection.classList.add("hidden");
}

/**
 * Fetch current weather data by coordinates
 */
async function fetchWeatherByCoords(lat, lon) {
  searchBtn.disabled = true;

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Could not fetch weather for your location.");
    }

    const data = await response.json();
    currentCity = data.name;
    currentLat = data.coord.lat;
    currentLon = data.coord.lon;
    cityInput.value = data.name;

    displayWeather(data);
    fetchForecast(currentLat, currentLon);

  } catch (error) {
    showError(error.message);
  } finally {
    loading.classList.add("hidden");
    searchBtn.disabled = false;
  }
}

/**
 * Fetch current weather data
 */
async function fetchWeather(city) {
  searchBtn.disabled = true;
  loading.classList.remove("hidden");

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("City not found. Please try again.");
    }

    const data = await response.json();
    currentCity = data.name;
    currentLat = data.coord.lat;
    currentLon = data.coord.lon;

    displayWeather(data);
    fetchForecast(currentLat, currentLon);

  } catch (error) {
    showError(error.message);
  } finally {
    loading.classList.add("hidden");
    searchBtn.disabled = false;
  }
}

/**
 * Display current weather
 */
function displayWeather(data) {
  const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
  
  document.getElementById("cityName").textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById("weatherDesc").textContent = data.weather[0].description;
  document.getElementById("temperature").textContent = `${Math.round(data.main.temp)}°C`;
  document.getElementById("feelsLike").textContent = `Feels like ${Math.round(data.main.feels_like)}°C`;
  document.getElementById("weatherIcon").src = iconUrl;
  document.getElementById("humidity").textContent = `${data.main.humidity}%`;
  document.getElementById("windSpeed").textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
  document.getElementById("pressure").textContent = `${data.main.pressure} hPa`;
  document.getElementById("visibility").textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  
  // Precipitation (rain in last hour, if available)
 
  
  // Cloudiness
  document.getElementById("cloudiness").textContent = `${data.clouds.all}%`;

  result.classList.remove("hidden");
}

/**
 * Fetch 5-day forecast
 */
async function fetchForecast(lat, lon) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Could not fetch forecast");
    }

    const data = await response.json();
    displayForecast(data.list);

  } catch (error) {
    console.error("Forecast error:", error);
  }
}

/**
 * Display 5-day forecast
 */
function displayForecast(forecastList) {
  // Get one forecast per day (every 8 items = 24 hours)
  const dailyForecasts = {};

  forecastList.forEach((item) => {
    const date = new Date(item.dt * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    // Keep only one forecast per day (the first one)
    if (!dailyForecasts[date]) {
      dailyForecasts[date] = item;
    }
  });

  // Get first 5 days
  const forecasts = Object.values(dailyForecasts).slice(0, 5);

  forecastContainer.innerHTML = forecasts
    .map((forecast) => createForecastCard(forecast))
    .join("");

  forecastSection.classList.remove("hidden");
}

/**
 * Create forecast card HTML
 */
function createForecastCard(forecast) {
  const date = new Date(forecast.dt * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const icon = `https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`;
  const high = Math.round(forecast.main.temp_max);
  const low = Math.round(forecast.main.temp_min);
  const desc = forecast.weather[0].description;

  return `
    <div class="forecast-card">
      <div class="forecast-date">${date}</div>
      <img src="${icon}" alt="${desc}" class="forecast-icon">
      <div class="forecast-temp">
        <span class="forecast-high">${high}°</span>
        <span class="forecast-low">${low}°</span>
      </div>
      <div class="forecast-desc">${desc}</div>
    </div>
  `;
}
