// import logo from "./logo.svg";
import "./App.css";
import { useEffect, useState } from "react";
import { useGeoLocation } from "./useGeoLocation";

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

  useEffect(() => {
    // console.log(nav);
  }, []);

  //retrieve location in database
  useEffect(() => {
    setLocation(localStorage.getItem("location") || "");
  }, []);

  //fetch weather data upon mount and location change
  useEffect(() => {
    //clean up data fetching requests
    const geoController = new AbortController();
    const weatherController = new AbortController();
    async function getWeather() {
      try {
        // 1) Getting location (geocoding)
        setIsLoading(true);
        setError("");
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${location}`,
          { signal: geoController.signal }
        );
        const geoData = await geoRes.json();

        if (!geoData.results) throw new Error("Location not found");

        const { latitude, longitude, timezone, name, country_code } =
          geoData.results.at(0);
        setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

        // 2) Getting actual weather
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`,
          { signal: weatherController.signal }
        );

        if (!weatherRes.ok) throw new Error("Could not fetch weather data");
        const weatherData = await weatherRes.json();
        setWeather(weatherData.daily);
        console.log(weatherData.daily.weathercode);
      } catch (err) {
        console.log(err);
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    }
    setError("");
    localStorage.setItem("location", location);
    if (location.length < 2) {
      setError("");
      setWeather({});
      return;
    }
    getWeather();

    return function () {
      geoController.abort();
      weatherController.abort();
    };
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
      {isLoading && !error && <Loader />}
      {location && error && <ErrorMessage error={error} />}
      {weather.weathercode && !error && !isLoading && (
        <Weather weather={weather} location={displayLocation} />
      )}
    </div>
  );
}

export default App;

const Loader = () => {
  return <h3 className="loader">Loading ....</h3>;
};

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
const ErrorMessage = ({ error }) => {
  return <h3>{error}</h3>;
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

const LocalWeather = ({ setWeather, setLocation, setError }) => {
  const {
    isLoading: isLoadingGeo,
    position,
    error,
    getPosition,
  } = useGeoLocation();

  useEffect(() => {}, []);

  const { lat, long } = position;
  return (
    <div>
      {isLoadingGeo && <Loader />}
      {!error && <Weather weather={""} />}
      Local Weather
    </div>
  );
};
