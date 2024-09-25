import { useState } from "react";

export function useGeoLocation() {
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({});
  const [error, setError] = useState("");

  function getPosition() {
    if (!navigator.geolocation)
      throw new Error("no browser support for geo location ");
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          long: pos.coords.longitude,
        });

        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );
  }

  return { isLoading, position, error, getPosition };
}
