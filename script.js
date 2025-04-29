const api_key = "27fa8b35c9e0f5f6746008226d72e0ca";
const inputField = document.getElementById('search-input');
const searchBtn = document.getElementById('searchBtn');
const weatherInfoDiv = document.getElementById('weather-info');
const forecastContainer = document.getElementById('forecast-container');
const detailedForecastDiv = document.getElementById('detailed-forecast');
const backToCurrentBtn = document.createElement('button');
const body = document.body;

const fullText = "Enter city, state, country, etc.";
let index = 0;
let isDeleting = false;
let typingActive = true;
let allForecastData = [];
let currentCityName = "";
let currentWeatherData = null;
let activeForecastCard = null;
let currentDayDetailedForecast = [];

const rainyWeatherKeywords = ["rain", "mist", "thunderstorm", "drizzle", "snow", "sleet", "fog", "smoke", "haze"];

const weatherBackgrounds = {
    "clear sky": "images/clear_sky.avif",
    "few clouds": "images/scattered_clouds.avif",
    "scattered clouds": "images/scattered_clouds.avif",
    "broken clouds": "images/scattered_clouds.avif",
    "shower rain": "images/rain.jpg",
    "rain": "images/rain.jpg",
    "thunderstorm": "images/thunderstorm.avif",
    "snow": "images/snow.avif",
    "mist": "images/mist.avif",
    "smoke": "images/mist.avif",
    "haze": "images/mist.avif",
    "dust": "images/mist.avif",
    "fog": "images/mist.avif",
    "sand": "images/mist.avif",
    "tornado": "images/thunderstorm.avif",
    "squall": "images/thunderstorm.avif",
    "light rain": "images/light_rain.avif",
    "overcast clouds": "images/overcast_clouds.avif",
    "light snow":"images/snow.avif",
    "heavy intensity rain":"images/rain.jpg",
    "moderate rain":"images/rain.jpg"
};

for (let key in weatherBackgrounds){
    console.log(key+" : "+weatherBackgrounds[key]);
}

backToCurrentBtn.textContent = "Back to Current Weather";
backToCurrentBtn.classList.add('back-to-current-btn');
backToCurrentBtn.style.display = 'none';

const weatherCard = document.querySelector('.weather-card');
if (weatherCard) weatherCard.appendChild(backToCurrentBtn);

backToCurrentBtn.addEventListener('click', () => {
    if (currentWeatherData) {
        displayCurrentWeather(currentWeatherData);
        backToCurrentBtn.style.display = 'none';
        detailedForecastDiv.style.display = 'block';
        detailedForecastDiv.innerHTML = '';
        displayDetailedForecast(currentDayDetailedForecast, "Today's Detailed Forecast");
        if (activeForecastCard) {
            activeForecastCard.classList.remove('active');
            activeForecastCard = null;
        }
    }
});

function setBodyBackground(description) {
    const lower = description.toLowerCase();
    body.style.backgroundImage = `url('${weatherBackgrounds[lower] || "images/default.jpg"}')`;
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundRepeat = 'no-repeat';
}


function typePlaceholder() {
    if (!typingActive) return;
    if (isDeleting) {
        index--;
        inputField.placeholder = fullText.slice(0, index);
        if (index === 0) {
            isDeleting = false;
            setTimeout(typePlaceholder, 500);
        } else {
            setTimeout(typePlaceholder, 50);
        }
    } else {
        inputField.placeholder = fullText.slice(0, index++);
        if (index > fullText.length) {
            isDeleting = true;
            setTimeout(typePlaceholder, 1000);
        } else {
            setTimeout(typePlaceholder, 100);
        }
    }
}
typePlaceholder();

inputField.addEventListener('focus', () => {
    typingActive = false;
    inputField.placeholder = "";
});
inputField.addEventListener('blur', () => {
    if (inputField.value === "") {
        typingActive = true;
        index = 0;
        isDeleting = false;
        typePlaceholder();
    }
});
inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchBtn.click();
    }
});

searchBtn.addEventListener('click', () => {
    const query = inputField.value.trim();
    if (query) {
        fetchWeatherData(query);
        fetchForecastData(query);
    } else {
        alert("Please enter a location.");
    }
});

async function fetchWeatherData(location) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${api_key}&units=metric`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (response.ok) {
            displayCurrentWeather(data);
            currentCityName = data.name;
            currentWeatherData = data;
            backToCurrentBtn.style.display = 'none';

            setTimeout(() => {
                const today = new Date().toISOString().split('T')[0];
                currentDayDetailedForecast = allForecastData.filter(item => {
                    const itemDate = new Date(item.dt * 1000).toISOString().split('T')[0];
                    return itemDate === today;
                });
                displayDetailedForecast(currentDayDetailedForecast, "Today's Detailed Forecast");
            }, 300);
        } else {
            showError(data.message);
        }
    } catch (error) {
        console.error("Error fetching weather data:", error);
        showError("Failed to fetch weather data.");
    }
}

async function fetchForecastData(location) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${api_key}&units=metric`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (response.ok && data.list) {
            allForecastData = data.list;
            displayForecast(data.list);
        } else {
            console.error("Forecast error:", data.message || "Unknown error");
            forecastContainer.innerHTML = '<p class="error">Failed to fetch 5-day forecast.</p>';
        }
    } catch (error) {
        console.error("Forecast fetch error:", error);
        forecastContainer.innerHTML = '<p class="error">Failed to fetch 5-day forecast.</p>';
    }
}

function showError(msg) {
    weatherInfoDiv.innerHTML = `<p class="error">Error: ${msg}</p>`;
    forecastContainer.innerHTML = '';
    detailedForecastDiv.style.display = 'none';
    detailedForecastDiv.innerHTML = '';
    backToCurrentBtn.style.display = 'none';
    setBodyBackground("default");
}

function displayCurrentWeather(data) {
    const { name, main, weather, wind, rain, snow, pop, sys } = data;
    const temperature = Math.round(main.temp);
    const tempMin = Math.round(main.temp_min);
    const tempMax = Math.round(main.temp_max);
    const description = weather[0].description;
    const humidity = main.humidity;
    const windSpeed = wind.speed;
    const precipitationChance = pop !== undefined ? `${Math.round(pop * 100)}%` : 'N/A';
    const dateTime = new Date().toLocaleString();
    const countryCode = sys.country;

    const locationDisplay = countryCode ? `${name}, ${countryCode}` : name;

    weatherInfoDiv.innerHTML = `
        <h2>Current Weather in ${locationDisplay}</h2>
        <p class="date-time">${dateTime}</p>
        <div class="temperature-info">
            <span class="current-temp">${temperature}°C</span>
            <span class="temp-range">(${tempMin}°C / ${tempMax}°C)</span>
        </div>
        <p class="sky-condition">${description}</p>
        <div class="details">
            <p>Humidity: ${humidity}%</p>
            <p>Chance of Rain: ${precipitationChance}</p>
            <p>Wind Speed: ${windSpeed} m/s</p>
        </div>
    `;
    setBodyBackground(description);
}

function displayForecast(forecastList) {
    forecastContainer.innerHTML = '<h3>Next 5 Days</h3>';
    const dailyForecast = {};
    const uniqueDates = new Set();
    const today = new Date().toISOString().split('T')[0];

    forecastList.forEach(item => {
        const forecastDate = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (forecastDate === today) return;

        if (!dailyForecast[forecastDate] && uniqueDates.size < 5) {
            dailyForecast[forecastDate] = {
                minTemp: Infinity,
                maxTemp: -Infinity,
                icon: null,
                description: '',
                timestamp: item.dt * 1000,
                data: []
            };
            uniqueDates.add(forecastDate);
        }

        if (dailyForecast[forecastDate]) {
            const day = dailyForecast[forecastDate];
            day.data.push(item);
            day.minTemp = Math.min(day.minTemp, item.main.temp_min);
            day.maxTemp = Math.max(day.maxTemp, item.main.temp_max);
            if (!day.icon) {
                day.icon = item.weather[0].icon;
                day.description = item.weather[0].description;
            }
        }
    });

    const forecastCards = document.createElement('div');
    forecastCards.classList.add('forecast-cards');

    for (const date in dailyForecast) {
        const forecast = dailyForecast[date];
        const dayName = new Date(date).toLocaleDateString('en-IN', { weekday: 'short' });
        const iconUrl = `https://openweathermap.org/img/wn/${forecast.icon}.png`;

        const card = document.createElement('div');
        card.classList.add('forecast-card');
        card.addEventListener('click', () => {
            if (activeForecastCard) {
                activeForecastCard.classList.remove('active');
            }
            card.classList.add('active');
            activeForecastCard = card;
            updateMainWeather(forecast.data);
            showDetailedForecast(forecast.timestamp);
            backToCurrentBtn.style.display = 'block';
        });
        card.innerHTML = `
            <p class="forecast-day">${dayName}</p>
            <img src="${iconUrl}" alt="${forecast.description}">
            <p class="forecast-temp">${Math.round(forecast.minTemp)}°C / ${Math.round(forecast.maxTemp)}°C</p>
            <p class="forecast-desc">${forecast.description}</p>
        `;
        forecastCards.appendChild(card);
    }

    forecastContainer.appendChild(forecastCards);
}

function updateMainWeather(dailyData) {
    const city = currentCityName;
    const entry = dailyData[0];
    const date = new Date(entry.dt * 1000);
    const dateTimeString = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    const temp = Math.round(entry.main.temp);
    const tempMin = Math.round(entry.main.temp_min);
    const tempMax = Math.round(entry.main.temp_max);
    const desc = entry.weather[0].description;
    const humidity = entry.main.humidity;
    const windSpeed = entry.wind.speed;
    const pop = Math.max(...dailyData.map(d => d.pop || 0));

    weatherInfoDiv.innerHTML = `
        <h2>Weather for ${city} on ${date.toLocaleDateString()}</h2>
        <p class="date-time">${dateTimeString}</p>
        <div class="temperature-info">
            <span class="current-temp">${temp}°C</span>
            <span class="temp-range">(${tempMin}°C / ${tempMax}°C)</span>
        </div>
        <p class="sky-condition">${desc}</p>
        <div class="details">
            <p>Humidity: ${humidity}%</p>
            <p>Chance of Rain: ${Math.round(pop * 100)}%</p>
            <p>Wind Speed: ${windSpeed} m/s</p>
        </div>
    `;
    setBodyBackground(desc);
}

function displayDetailedForecast(forecastList, title) {
    detailedForecastDiv.innerHTML = `<h3>${title}</h3>`;
    if (forecastList.length > 0) {
        forecastList.forEach(item => {
            const time = new Date(item.dt * 1000).toLocaleTimeString();
            const temp = Math.round(item.main.temp);
            const desc = item.weather[0].description;
            const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
            const wind = item.wind.speed;
            const humidity = item.main.humidity;
            const pop = item.pop ? Math.round(item.pop * 100) : 0;

            detailedForecastDiv.innerHTML += `
                <div class="detailed-item">
                    <p>Time: ${time}</p>
                    <img src="${iconUrl}" alt="${desc}">
                    <p>Temperature: ${temp}°C</p>
                    <p>Description: ${desc}</p>
                    <p>Wind Speed: ${wind} m/s</p>
                    <p>Humidity: ${humidity}%</p>
                    <p>Chance of Rain: ${pop}%</p>
                </div>
            `;
        });
        detailedForecastDiv.style.display = 'block';
    } else {
        detailedForecastDiv.innerHTML += '<p>No detailed forecast available for this day.</p>';
        detailedForecastDiv.style.display = 'block';
    }
}

function showDetailedForecast(timestamp) {
    const clickedDate = new Date(timestamp).toISOString().split('T')[0];
    const data = allForecastData.filter(item => {
        const itemDate = new Date(item.dt * 1000).toISOString().split('T')[0];
        return itemDate === clickedDate;
    });
    displayDetailedForecast(data, new Date(timestamp).toLocaleDateString() + " Detailed Forecast");
}