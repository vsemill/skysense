import React, { useState } from 'react';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import './App.css';
import SpaceAppsLogo from './spaceapps_logo.png'; 


function MapClickHandler({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation(e.latlng);
    },
  });
  return null;
}

function App() {
  const [location, setLocation] = useState({ lat: 9.82, lng: 77.18 });
  const [date, setDate] = useState('2025-10-11');
  const [activity, setActivity] = useState('Indoor games');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
        },
        () => {
          setError("Unable to retrieve location. Please enable location services in your browser.");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };
  
  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setResults(null);

    const backendApiUrl = `http://127.0.0.1:5000/api/analyze?lat=${location.lat}&lon=${location.lng}&date=${date}&activity=${activity}`;

    try {
      const response = await fetch(backendApiUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError('Failed to fetch data. Is your Python server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="logo-container">
        <img src={SpaceAppsLogo} alt="NASA Space Apps Challenge Logo" className="spaceapps-logo" />
        <h1>SkySense</h1>
      </div>
      <p>Select a location on the map, or use your current location, to analyze weather for your event.</p>
      
      <div className="map-wrapper">
        <MapContainer center={[location.lat, location.lng]} zoom={10} scrollWheelZoom={false} className="map-container" whenCreated={ mapInstance => { mapInstance.setView([location.lat, location.lng]) } }>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[location.lat, location.lng]} />
          <MapClickHandler setLocation={setLocation} />
        </MapContainer>
      </div>

      <div className="input-group">
        <input
          type="date"
          onChange={(e) => setDate(e.target.value)}
          value={date}
        />
        <input
          type="text"
          placeholder="Describe your activity"
          onChange={(e) => setActivity(e.target.value)}
          value={activity}
        />
        {}
        <button className="location-btn" onClick={handleGetCurrentLocation} title="Use my current location">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"></path></svg>
        </button>
        <button className="analyze-btn" onClick={handleAnalyze} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      
      {results && (
        <div className="results-card">
          {results.error ? (
            <p className="error">{results.error}</p>
          ) : (
            <>
              <h3>Analysis from: <strong>{results.source}</strong></h3>
              <p className="advice">{results.advice}</p>
              <div className="details">
                <span>🌡️ Temp: {results.details.temp}°C</span>
                <span>💧 Rain: {results.details.rain_mm} mm</span>
                <span>💨 Wind: {results.details.wind_kph} km/h</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;