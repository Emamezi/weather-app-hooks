import logo from "./logo.svg";
import "./App.css";
import { useEffect, useState } from "react";

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}
function App() {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState("");
  const [error, setError] = useState("");
  const [weather, setWeather] = useState({});

  // useEffect(() => {
  //   const nav = navigator.geolocation.getCurrentPosition(
  //     () => {},
  //     () => {}
  //   );
  //   console.log(nav);
  // });

  //retrieve location in database
  useEffect(() => {
    setLocation(localStorage.getItem("location") || "");
  }, []);
  //fetch weather data upon mount and location change
  useEffect(() => {
    async function getWeather() {
      try {
        if (location.length < 2) return;
        // 1) Getting location (geocoding)
        setIsLoading(true);
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
        );
        const geoData = await geoRes.json();
        console.log(geoData);

        if (!geoData.results) throw new Error("Location not found");

        const { latitude, longitude, timezone, name, country_code } =
          geoData.results.at(0);
        setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

        // 2) Getting actual weather
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
        );
        const weatherData = await weatherRes.json();
        setWeather(weatherData.daily);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    getWeather();
    localStorage.setItem("location", location);
  }, [location]);

  function onLocationChange(e) {
    if (e.target.value === "") {
      setWeather({});
    }
    setLocation(e.target.value);
  }

  return (
    <div className="app">
      <h1>Weather App</h1>
      <Input location={location} onChangeLocation={onLocationChange} />
      {isLoading && <h3>Loading.....</h3>}
      {weather.weathercode && (
        <Weather weather={weather} location={displayLocation} />
      )}
    </div>
  );
}

export default App;

const Input = ({ location, onChangeLocation }) => {
  return (
    <input
      type="text"
      placeholder="Search a location"
      value={location}
      onChange={onChangeLocation}
    />
  );
};

const Weather = ({ weather, location }) => {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: code,
  } = weather;
  return (
    <div>
      <h2>{location}</h2>
      <ul className="weather">
        {dates.map((date, i) => (
          <Day
            date={date}
            max={max.at(i)}
            min={min.at(i)}
            code={code.at(i)}
            today={i}
            key={date}
          />
        ))}
      </ul>
    </div>
  );
};

const Day = ({ max, min, date, code, today }) => {
  return (
    <li className="day">
      <h3>{getWeatherIcon(code)}</h3>
      <p>
        {Math.floor(min)}&deg; &mdash; {Math.ceil(max)}&deg;
      </p>
      <p>{today === 0 ? "today" : formatDay(date)}</p>
    </li>
  );
};
