import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HistoryTable from "../components/HistoryTable";

export default function History() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("access_token")) navigate("/login");
  }, [navigate]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Recommendation History
      </h1>
      <HistoryTable />
    </div>
  );
}
