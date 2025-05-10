
// API Configuration
const API_KEY = "736348fa40dba1d5ef82f86a39a15ceb";
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEO_URL = "https://api.openweathermap.org/geo/1.0";

// DOM Elements
const citySearchInput = document.getElementById("city-search");
const searchResults = document.getElementById("search-results");
const weatherDisplay = document.getElementById("weather-display");
const favoritesList = document.getElementById("favorites-list");
const noFavorites = document.getElementById("no-favorites");
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");
const city1SearchInput = document.getElementById("city1-search");
const city1SearchResults = document.getElementById("city1-search-results");
const city1WeatherContainer = document.getElementById("city1-weather");
const city2SearchInput = document.getElementById("city2-search");
const city2SearchResults = document.getElementById("city2-search-results");
const city2WeatherContainer = document.getElementById("city2-weather");
const resetComparisonButton = document.getElementById("reset-comparison");

// State Management
let selectedCity = null;
let city1 = null;
let city2 = null;
let searchDebounceTimer;

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab");
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      
      // Update active tab content
      tabContents.forEach(content => content.classList.remove("active"));
      document.getElementById(`${tabName}-tab`).classList.add("active");
    });
  });
  
  // Search event listeners
  citySearchInput.addEventListener("input", handleSearchInput);
  city1SearchInput.addEventListener("input", event => handleCompareSearchInput(event, city1SearchResults));
  city2SearchInput.addEventListener("input", event => handleCompareSearchInput(event, city2SearchResults));
  
  // Reset comparison
  resetComparisonButton.addEventListener("click", resetComparison);
  
  // Load favorites
  displayFavorites();
});

// Search Functions
function handleSearchInput(event) {
  const query = event.target.value.trim();
  
  clearTimeout(searchDebounceTimer);
  
  if (query.length < 2) {
    searchResults.style.display = "none";
    return;
  }
  
  searchDebounceTimer = setTimeout(() => {
    searchCities(query)
      .then(cities => {
        displaySearchResults(cities, searchResults, selectCity);
      })
      .catch(error => {
        console.error("Error searching cities:", error);
      });
  }, 300);
}

function handleCompareSearchInput(event, resultsContainer) {
  const query = event.target.value.trim();
  
  clearTimeout(searchDebounceTimer);
  
  if (query.length < 2) {
    resultsContainer.style.display = "none";
    return;
  }
  
  searchDebounceTimer = setTimeout(() => {
    searchCities(query)
      .then(cities => {
        if (resultsContainer === city1SearchResults) {
          displaySearchResults(cities, resultsContainer, selectCity1);
        } else {
          displaySearchResults(cities, resultsContainer, selectCity2);
        }
      })
      .catch(error => {
        console.error("Error searching cities:", error);
      });
  }, 300);
}

function displaySearchResults(cities, container, selectCallback) {
  container.innerHTML = "";
  
  if (cities.length === 0) {
    container.innerHTML = '<div class="search-result-item">No cities found</div>';
    container.style.display = "block";
    return;
  }
  
  cities.forEach(city => {
    const item = document.createElement("div");
    item.className = "search-result-item";
    item.textContent = `${city.name}${city.country ? `, ${city.country}` : ""}`;
    item.addEventListener("click", () => {
      selectCallback(city);
      container.style.display = "none";
    });
    container.appendChild(item);
  });
  
  container.style.display = "block";
}

async function searchCities(query) {
  try {
    const response = await fetch(
      `${GEO_URL}/direct?q=${query}&limit=5&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`City search API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.map(city => ({
      name: city.name,
      country: city.country,
      lat: city.lat,
      lon: city.lon,
    }));
  } catch (error) {
    console.error("Error searching cities:", error);
    return [];
  }
}

// Weather Data Functions
async function getWeatherByCoordinates(lat, lon) {
  try {
    const response = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
}

function selectCity(city) {
  selectedCity = city;
  citySearchInput.value = `${city.name}${city.country ? `, ${city.country}` : ""}`;
  
  // Get and display weather
  getWeatherByCoordinates(city.lat, city.lon)
    .then(data => {
      displayWeather(data, weatherDisplay, true);
    })
    .catch(error => {
      console.error("Error getting weather:", error);
      weatherDisplay.innerHTML = '<div class="placeholder">Error fetching weather data</div>';
    });
}

function selectCity1(city) {
  city1 = city;
  city1SearchInput.value = `${city.name}${city.country ? `, ${city.country}` : ""}`;
  
  // Reset the city selection and show the weather
  const citySelection = city1WeatherContainer.closest(".city-comparison").querySelector(".city-selection");
  citySelection.style.display = "none";
  
  // Get and display weather
  getWeatherByCoordinates(city.lat, city.lon)
    .then(data => {
      displayWeather(data, city1WeatherContainer, false);
      
      // Show the reset button if both cities are selected
      if (city1 && city2) {
        resetComparisonButton.classList.remove("hidden");
      }
    })
    .catch(error => {
      console.error("Error getting weather:", error);
      city1WeatherContainer.innerHTML = '<div class="placeholder">Error fetching weather data</div>';
    });
}

function selectCity2(city) {
  city2 = city;
  city2SearchInput.value = `${city.name}${city.country ? `, ${city.country}` : ""}`;
  
  // Reset the city selection and show the weather
  const citySelection = city2WeatherContainer.closest(".city-comparison").querySelector(".city-selection");
  citySelection.style.display = "none";
  
  // Get and display weather
  getWeatherByCoordinates(city.lat, city.lon)
    .then(data => {
      displayWeather(data, city2WeatherContainer, false);
      
      // Show the reset button if both cities are selected
      if (city1 && city2) {
        resetComparisonButton.classList.remove("hidden");
      }
    })
    .catch(error => {
      console.error("Error getting weather:", error);
      city2WeatherContainer.innerHTML = '<div class="placeholder">Error fetching weather data</div>';
    });
}

function resetComparison() {
  // Reset city1
  city1 = null;
  city1SearchInput.value = "";
  city1WeatherContainer.innerHTML = "";
  city1WeatherContainer.closest(".city-comparison").querySelector(".city-selection").style.display = "block";
  
  // Reset city2
  city2 = null;
  city2SearchInput.value = "";
  city2WeatherContainer.innerHTML = "";
  city2WeatherContainer.closest(".city-comparison").querySelector(".city-selection").style.display = "block";
  
  // Hide reset button
  resetComparisonButton.classList.add("hidden");
}

function displayWeather(data, container, showFavorite = false) {
  // Determine weather gradient class based on weather condition
  let weatherClass = "weather-card";
  const weatherCondition = data.weather[0].main.toLowerCase();
  
  if (weatherCondition.includes("clear") || weatherCondition.includes("sun")) {
    weatherClass += " weather-gradient-sunny";
  } else if (weatherCondition.includes("cloud")) {
    weatherClass += " weather-gradient-cloudy";
  } else if (weatherCondition.includes("rain") || weatherCondition.includes("drizzle") || weatherCondition.includes("thunder")) {
    weatherClass += " weather-gradient-rainy";
  } else if (weatherCondition.includes("snow")) {
    weatherClass += " weather-gradient-snow";
  }
  
  // Create city object for favorites
  const city = {
    name: data.name,
    country: data.sys.country,
    lat: data.coord.lat,
    lon: data.coord.lon
  };
  
  // Check if city is in favorites
  const isFavorite = isFavoriteCity(city);
  
  // HTML for the weather card
  const weatherHTML = `
    <div class="${weatherClass}">
      <div class="weather-header">
        <div class="weather-location">
          <h3>${data.name}</h3>
          <p>${data.sys.country}</p>
        </div>
        ${showFavorite ? `
        <div class="weather-favorite ${isFavorite ? 'active' : ''}" id="favorite-toggle">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${isFavorite ? 'gold' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        ` : ''}
      </div>
      
      <div class="weather-main">
        <div class="weather-temp">${Math.round(data.main.temp)}°C</div>
        <img class="weather-icon" src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}">
      </div>
      
      <div class="weather-description">${data.weather[0].description}</div>
      
      <div class="weather-details">
        <div class="weather-detail">
          <span>Feels like</span>
          <span>${Math.round(data.main.feels_like)}°C</span>
        </div>
        <div class="weather-detail">
          <span>Humidity</span>
          <span>${data.main.humidity}%</span>
        </div>
        <div class="weather-detail">
          <span>Wind</span>
          <span>${data.wind.speed} m/s</span>
        </div>
        <div class="weather-detail">
          <span>Pressure</span>
          <span>${data.main.pressure} hPa</span>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = weatherHTML;
  
  // Add event listener to favorite toggle button
  if (showFavorite) {
    const favoriteToggle = document.getElementById("favorite-toggle");
    favoriteToggle.addEventListener("click", () => {
      toggleFavorite(city);
      favoriteToggle.classList.toggle("active");
      
      // Update the star icon
      const starIcon = favoriteToggle.querySelector("svg");
      if (favoriteToggle.classList.contains("active")) {
        starIcon.setAttribute("fill", "gold");
      } else {
        starIcon.setAttribute("fill", "none");
      }
      
      // Refresh favorites list
      displayFavorites();
    });
  }
}

// Favorites Functions
function getFavoriteCities() {
  const saved = localStorage.getItem("favoriteCities");
  return saved ? JSON.parse(saved) : [];
}

function saveFavoriteCity(city) {
  const favorites = getFavoriteCities();
  
  // Check if city already exists in favorites
  const exists = favorites.some(
    (fav) => fav.lat === city.lat && fav.lon === city.lon
  );
  
  if (!exists) {
    favorites.push(city);
    localStorage.setItem("favoriteCities", JSON.stringify(favorites));
  }
}

function removeFavoriteCity(city) {
  const favorites = getFavoriteCities();
  const filteredFavorites = favorites.filter(
    (fav) => !(fav.lat === city.lat && fav.lon === city.lon)
  );
  localStorage.setItem("favoriteCities", JSON.stringify(filteredFavorites));
}

function isFavoriteCity(city) {
  const favorites = getFavoriteCities();
  return favorites.some(
    (fav) => fav.lat === city.lat && fav.lon === city.lon
  );
}

function toggleFavorite(city) {
  if (isFavoriteCity(city)) {
    removeFavoriteCity(city);
  } else {
    saveFavoriteCity(city);
  }
}

function displayFavorites() {
  const favorites = getFavoriteCities();
  
  if (favorites.length === 0) {
    noFavorites.style.display = "block";
    favoritesList.innerHTML = "";
    return;
  }
  
  noFavorites.style.display = "none";
  favoritesList.innerHTML = "";
  
  favorites.forEach(city => {
    const favoriteItem = document.createElement("div");
    favoriteItem.className = "favorite-item";
    favoriteItem.innerHTML = `
      <span>${city.name}${city.country ? `, ${city.country}` : ""}</span>
      <button class="remove-favorite">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>
        </svg>
      </button>
    `;
    
    // Add event listener to load weather when clicked
    favoriteItem.addEventListener("click", event => {
      if (!event.target.closest(".remove-favorite")) {
        selectCity(city);
        
        // Switch to current weather tab
        tabButtons.forEach(btn => btn.classList.remove("active"));
        tabContents.forEach(content => content.classList.remove("active"));
        
        document.querySelector('[data-tab="current"]').classList.add("active");
        document.getElementById("current-tab").classList.add("active");
      }
    });
    
    // Add event listener to remove button
    const removeButton = favoriteItem.querySelector(".remove-favorite");
    removeButton.addEventListener("click", event => {
      event.stopPropagation();
      removeFavoriteCity(city);
      displayFavorites();
      
      // If this city is currently displayed, update the favorite button
      if (selectedCity && selectedCity.lat === city.lat && selectedCity.lon === city.lon) {
        const favoriteToggle = document.getElementById("favorite-toggle");
        if (favoriteToggle) {
          favoriteToggle.classList.remove("active");
          favoriteToggle.querySelector("svg").setAttribute("fill", "none");
        }
      }
    });
    
    favoritesList.appendChild(favoriteItem);
  });
}
