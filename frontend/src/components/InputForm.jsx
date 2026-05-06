/**
 * InputForm — farmer data entry
 * ──────────────────────────────
 * Collects the 7+1 key metrics and submits them to the ML API.
 */
import { useState } from "react";
import { toast } from "react-toastify";
import { recommendationService } from "../services/api";

const FIELDS = [
  {
    group: "Soil Nutrients",
    icon: "🪨",
    fields: [
      { name: "nitrogen",   label: "Nitrogen (N)",   unit: "kg/ha", min: 0,  max: 200, step: 1,   hint: "Available nitrogen in soil" },
      { name: "phosphorus", label: "Phosphorus (P)", unit: "kg/ha", min: 0,  max: 200, step: 1,   hint: "Available phosphorus in soil" },
      { name: "potassium",  label: "Potassium (K)",  unit: "kg/ha", min: 0,  max: 300, step: 1,   hint: "Available potassium in soil" },
    ],
  },
  {
    group: "Soil Properties",
    icon: "🌱",
    fields: [
      { name: "ph",       label: "Soil pH",     unit: "pH",  min: 0,  max: 14,  step: 0.1, hint: "Acidity / alkalinity (0–14)" },
      { name: "moisture", label: "Moisture",    unit: "%",   min: 0,  max: 100, step: 0.5, hint: "Soil water content (%)" },
    ],
  },
  {
    group: "Weather Conditions",
    icon: "🌤️",
    fields: [
      { name: "temperature", label: "Temperature", unit: "°C", min: -20, max: 60,  step: 0.5, hint: "Average ambient temperature" },
      { name: "humidity",    label: "Humidity",    unit: "%",  min: 0,   max: 100, step: 0.5, hint: "Relative humidity (%)" },
      { name: "rainfall",    label: "Rainfall",    unit: "mm", min: 0,   max: 500, step: 1,   hint: "Annual or seasonal rainfall" },
    ],
  },
];

const DEFAULTS = {
  nitrogen: "", phosphorus: "", potassium: "",
  ph: "", moisture: "",
  temperature: "", humidity: "", rainfall: "",
  soil_type: "",
};

export default function InputForm({ onResult }) {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [locationInfo, setLocationInfo] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const fetchWeatherFromLocation = async () => {
    setWeatherLoading(true);
    setLocationInfo(null);
    
    try {
      // Step 1: Get GPS location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      // Step 2: Call OpenWeatherMap API
      const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
      if (!apiKey || apiKey === 'your_openweathermap_api_key_here') {
        toast.error("Weather API key not configured. Please add your OpenWeatherMap API key to frontend/.env");
        setWeatherLoading(false);
        return;
      }

      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
      );

      if (!weatherResponse.ok) {
        throw new Error("Weather API failed");
      }

      const weatherData = await weatherResponse.json();

      // Step 3: Extract temperature and humidity
      const temp = weatherData.main.temp;
      const humidity = weatherData.main.humidity;
      const cityName = weatherData.name;
      const countryCode = weatherData.sys.country;

      // Step 4: Auto-fill temperature and humidity fields
      setForm((prev) => ({
        ...prev,
        temperature: temp.toString(),
        humidity: humidity.toString(),
      }));

      // Step 5: Show success toast
      toast.success(`✅ Temperature & Humidity fetched for ${cityName}`);

      // Step 6: Show location info
      setLocationInfo(`📍 Location: ${cityName}, ${countryCode}`);
    } catch (err) {
      if (err.code === 1) {
        // User denied location permission
        toast.error("Location access denied. Enter manually.");
      } else {
        toast.error("Could not fetch weather. Enter manually.");
      }
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert numeric string values to floats, keep soil type as text
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) =>
          k === "soil_type" ? [k, v] : [k, parseFloat(v)]
        )
      );
      const { data } = await recommendationService.submit(payload);
      onResult(data);
      toast.success("Recommendation ready!");
    } catch (err) {
      const msg = err.response?.data?.detail || "Submission failed. Please check your values.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isComplete = Object.values(form).every((v) => v !== "");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {FIELDS.map(({ group, icon, fields }) => (
        <div key={group} className="card">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span>{icon}</span> {group}
          </h3>

          {/* Weather location button - only show in Weather Conditions section */}
          {group === "Weather Conditions" && (
            <>
              <button
                type="button"
                onClick={fetchWeatherFromLocation}
                disabled={weatherLoading}
                className="w-full sm:w-auto mb-4 px-4 py-2 text-sm font-medium border border-green-600 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {weatherLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Fetching…
                  </span>
                ) : (
                  "📍 Get Temperature & Humidity from My Location"
                )}
              </button>
              {locationInfo && (
                <p className="text-xs text-gray-500 mb-4">{locationInfo}</p>
              )}
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map(({ name, label, unit, min, max, step, hint }) => (
              <div key={name}>
                <label
                  htmlFor={name}
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  {label}{" "}
                  <span className="text-gray-400 font-normal">({unit})</span>
                </label>
                <input
                  id={name}
                  name={name}
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={`e.g. ${(min + max) / 2}`}
                  title={hint}
                  required
                  className="input-field"
                />
                <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span>🌾</span> Soil Type
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label
              htmlFor="soil_type"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Soil Type
            </label>
            <select
              id="soil_type"
              name="soil_type"
              value={form.soil_type}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="">Select soil type…</option>
              <option value="Alluvial">Alluvial</option>
              <option value="Black">Black</option>
              <option value="Sandy">Sandy</option>
              <option value="Laterite">Laterite</option>
              <option value="Mountain">Mountain</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !isComplete}
        className="btn-primary w-full text-base"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Analysing…
          </span>
        ) : (
          "Get Crop Recommendation"
        )}
      </button>
    </form>
  );
}
