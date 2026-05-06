/**
 * ResultsDashboard — displays ML recommendation output
 * ──────────────────────────────────────────────────────
 * Shows: top crop, confidence gauge, SHAP explanation, alternatives bar chart.
 */
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { toast } from "react-toastify";

const CONFIDENCE_COLOR = (score) => {
  if (score >= 0.8) return "text-green-600";
  if (score >= 0.6) return "text-yellow-600";
  return "text-red-500";
};

const GAUGE_COLOR = (score) => {
  if (score >= 0.8) return "#16a34a";
  if (score >= 0.6) return "#ca8a04";
  return "#dc2626";
};

const getCropEmoji = (name) => {
  const map = {
    rice: "🌾", maize: "🌽", chickpea: "🫘", kidneybeans: "🫘",
    pigeonpeas: "🌿", mothbeans: "🌱", mungbean: "🌱", blackgram: "🌱",
    lentil: "🌿", pomegranate: "🍎", banana: "🍌", mango: "🥭",
    grapes: "🍇", watermelon: "🍉", muskmelon: "🍈", apple: "🍎",
    orange: "🍊", papaya: "🍈", coconut: "🥥", cotton: "☁️",
    jute: "🌿", coffee: "☕",
  };
  return map[name?.toLowerCase()] ?? "🌾";
}

export default function ResultsDashboard({ result, onReset }) {
  if (!result) return null;

  const cropName = result.crop_name ?? result.crop?.name ?? "Unknown";
  const confidenceScore = result.confidence_score ?? result.confidence ?? 0;
  const confidencePct = Math.round(confidenceScore * 100);
  const explanationText = result.explanation ?? result.explanation_text ?? "No explanation provided";
  const alternatives = result.alternatives ?? [];
  const alt1 = alternatives[0] ?? {};
  const alt2 = alternatives[1] ?? {};
  const alt1Name = alt1.crop ?? "—";
  const alt1Confidence = Math.round((alt1.confidence ?? 0) * 100);
  const alt2Name = alt2.crop ?? "—";
  const alt2Confidence = Math.round((alt2.confidence ?? 0) * 100);

  const soilData = result.soil_data ?? {};
  const weatherData = result.weather_data ?? {};
  const nitrogen = soilData.nitrogen ?? "";
  const phosphorus = soilData.phosphorus ?? "";
  const potassium = soilData.potassium ?? "";
  const ph = soilData.ph ?? "";
  const temperature = weatherData.temperature ?? "";
  const humidity = weatherData.humidity ?? "";
  const rainfall = weatherData.rainfall ?? "";
  const moisture = soilData.moisture ?? "";

  const chartData = [
    { name: cropName, score: confidenceScore },
    ...alternatives.map((a) => ({ name: a.crop, score: a.confidence })),
  ];

  const escapeHTML = (text) =>
    String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const handleDownloadReport = () => {
    const cropEmoji = getCropEmoji(cropName);
    const alt1Emoji = getCropEmoji(alt1Name);
    const alt2Emoji = getCropEmoji(alt2Name);
    const safeCropName = escapeHTML(cropName);
    const safeAlt1Name = escapeHTML(alt1Name);
    const safeAlt2Name = escapeHTML(alt2Name);
    const safeExplanation = escapeHTML(explanationText);

    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>CropAI Recommendation Report</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 40px auto; 
            color: #1a1a1a;
            line-height: 1.6;
          }
          .header { 
            background: #16a34a; 
            color: white; 
            padding: 30px; 
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 { margin: 0; font-size: 28px; }
          .header p  { margin: 5px 0 0; opacity: 0.85; }
          .section { 
            background: #f9fafb; 
            border: 1px solid #e5e7eb;
            border-radius: 10px; 
            padding: 20px; 
            margin-bottom: 20px; 
          }
          .section h2 { 
            color: #16a34a; 
            margin-top: 0; 
            font-size: 18px;
            border-bottom: 2px solid #dcfce7;
            padding-bottom: 8px;
          }
          .crop-name { 
            font-size: 36px; 
            font-weight: bold; 
            color: #15803d;
          }
          .confidence-bar {
            background: #dcfce7;
            border-radius: 999px;
            height: 16px;
            margin: 10px 0;
          }
          .confidence-fill {
            background: #16a34a;
            height: 16px;
            border-radius: 999px;
            width: ${confidencePct}%;
          }
          .grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 12px; 
            margin-top: 10px;
          }
          .stat-box { 
            background: white; 
            border: 1px solid #d1fae5;
            border-radius: 8px; 
            padding: 12px; 
            text-align: center;
          }
          .stat-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
          .stat-value { font-size: 18px; font-weight: bold; color: #15803d; }
          .stat-unit  { font-size: 11px; color: #6b7280; }
          .alternatives { display: flex; gap: 12px; margin-top: 10px; }
          .alt-box { 
            flex: 1; background: white; 
            border: 1px solid #e5e7eb;
            border-radius: 8px; padding: 12px; text-align: center;
          }
          .explanation-text { 
            background: #f0fdf4; 
            border-left: 4px solid #16a34a;
            padding: 15px; 
            border-radius: 0 8px 8px 0;
            font-style: italic;
            color: #166534;
          }
          .footer { 
            text-align: center; 
            color: #9ca3af; 
            font-size: 12px; 
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌾 CropAI — Crop Recommendation Report</h1>
          <p>Generated on ${new Date().toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })}</p>
        </div>

        <div class="section">
          <h2>🏆 Top Recommendation</h2>
          <div class="crop-name">${cropEmoji} ${safeCropName}</div>
          <p>Confidence Score: <strong>${confidencePct}%</strong></p>
          <div class="confidence-bar">
            <div class="confidence-fill"></div>
          </div>
        </div>

        <div class="section">
          <h2>💡 Why This Crop?</h2>
          <div class="explanation-text">${safeExplanation}</div>
        </div>

        <div class="section">
          <h2>🔄 Alternative Crops</h2>
          <div class="alternatives">
            <div class="alt-box">
              <div style="font-size:22px">${alt1Emoji}</div>
              <strong>${safeAlt1Name}</strong>
              <div style="color:#16a34a">${alt1Confidence}%</div>
            </div>
            <div class="alt-box">
              <div style="font-size:22px">${alt2Emoji}</div>
              <strong>${safeAlt2Name}</strong>
              <div style="color:#16a34a">${alt2Confidence}%</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>📊 Input Parameters Summary</h2>
          <div class="grid">
            <div class="stat-box">
              <div class="stat-label">Nitrogen (N)</div>
              <div class="stat-value">${nitrogen}</div>
              <div class="stat-unit">kg/ha</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Phosphorus (P)</div>
              <div class="stat-value">${phosphorus}</div>
              <div class="stat-unit">kg/ha</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Potassium (K)</div>
              <div class="stat-value">${potassium}</div>
              <div class="stat-unit">kg/ha</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Soil pH</div>
              <div class="stat-value">${ph}</div>
              <div class="stat-unit">pH</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Temperature</div>
              <div class="stat-value">${temperature}</div>
              <div class="stat-unit">°C</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Humidity</div>
              <div class="stat-value">${humidity}</div>
              <div class="stat-unit">%</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Rainfall</div>
              <div class="stat-value">${rainfall}</div>
              <div class="stat-unit">mm</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Moisture</div>
              <div class="stat-value">${moisture}</div>
              <div class="stat-unit">%</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Generated by CropAI — AI-Powered Crop Recommendation System</p>
          <p>Powered by Random Forest ML Model with SHAP Explainability</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CropAI_Report_${cropName.replace(/\s+/g, '_')}_${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('✅ Report downloaded successfully!');
  };

  return (
    <div className="space-y-5">
      {/* ── Hero card ─────────────────────────────────────────────────────── */}
      <div className="card flex flex-col sm:flex-row items-center gap-6">
        {/* Crop icon */}
        <div className="text-7xl select-none" role="img" aria-label={cropName}>
          {getCropEmoji(cropName)}
        </div>

        {/* Primary info */}
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">
            Top Recommendation
          </p>
          <h2 className="text-3xl font-bold text-gray-900 capitalize mt-1">
            {cropName}
          </h2>

          {/* Confidence gauge */}
          <div className="mt-3 flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-32 h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${confidencePct}%`, backgroundColor: GAUGE_COLOR(confidenceScore) }}
              />
            </div>
            <span className={`font-bold text-lg ${CONFIDENCE_COLOR(confidenceScore)}`}>
              {confidencePct}% confident
            </span>
          </div>
        </div>

        {/* Reset button */}
        <button
          onClick={onReset}
          className="text-sm text-primary-600 hover:underline font-medium self-start sm:self-center"
        >
          ← New Query
        </button>
      </div>

      {/* ── Explanation card ───────────────────────────────────────────────── */}
      <div className="card border-l-4 border-primary-500">
        <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
          💡 Why this crop?
        </h3>
        <p className="text-gray-700 leading-relaxed">{explanationText}</p>
      </div>

      {/* ── Alternatives bar chart ─────────────────────────────────────────── */}
      {chartData.length > 1 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Confidence Comparison</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 16 }}>
              <XAxis
                type="number"
                domain={[0, 1]}
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={90}
              />
              <Tooltip
                formatter={(v) => [`${Math.round(v * 100)}%`, "Confidence"]}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={i === 0 ? "#16a34a" : "#86efac"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Input summary ──────────────────────────────────────────────────── */}
      {result.soil_data && result.weather_data && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-3">Input Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[
              ["N", nitrogen, "kg/ha"],
              ["P", phosphorus, "kg/ha"],
              ["K", potassium, "kg/ha"],
              ["pH", ph, ""],
              ["Temp", temperature, "°C"],
              ["Humidity", humidity, "%"],
              ["Rainfall", rainfall, "mm"],
              ["Moisture", moisture, "%"],
            ].map(([label, value, unit]) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-semibold text-gray-800">
                  {value}
                  {unit && <span className="text-gray-400 text-xs ml-0.5">{unit}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={handleDownloadReport}
          className="w-full sm:w-auto bg-green-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-green-700 transition"
        >
          ⬇️ Download Report
        </button>
      </div>
      <p className="text-sm text-gray-500">💡 Tip: Open the downloaded file in browser and press Ctrl+P to save as PDF</p>
    </div>
  );
}
