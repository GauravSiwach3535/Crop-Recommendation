/**
 * Home page — shows InputForm or ResultsDashboard depending on state.
 * Redirects to /login if not authenticated.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InputForm from "../components/InputForm";
import ResultsDashboard from "../components/ResultsDashboard";

export default function Home() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  // Guard: redirect unauthenticated users
  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          AI Crop Recommendation
        </h1>
        <p className="text-gray-500 mt-2">
          Enter your soil and weather data to get an instant, AI-powered
          crop suggestion tailored to your farm.
        </p>
      </div>

      {result ? (
        <ResultsDashboard result={result} onReset={() => setResult(null)} />
      ) : (
        <InputForm onResult={setResult} />
      )}
    </div>
  );
}
