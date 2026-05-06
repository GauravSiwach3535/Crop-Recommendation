export default function About() {
  const featureCards = [
    {
      icon: "🧪",
      title: "Enter Soil & Weather Data",
      description:
        "Input 9 agronomic parameters: Nitrogen, Phosphorus, Potassium, pH, Moisture, Temperature, Humidity, Rainfall, and Soil Type",
    },
    {
      icon: "🤖",
      title: "AI Analyzes Your Data",
      description:
        "Our Random Forest ML model trained on 2200 crop samples with 99%+ accuracy processes your inputs instantly",
    },
    {
      icon: "🌾",
      title: "Get Crop Recommendation",
      description:
        "Receive the best crop suggestion with confidence score, SHAP-based explanation, and 2 alternative crops",
    },
  ];

  const techStack = [
    "Python 3.11",
    "Django REST Framework",
    "Random Forest (scikit-learn)",
    "SHAP Explainability",
    "JWT Authentication",
    "PostgreSQL",
    "React.js 18",
    "Tailwind CSS",
    "Recharts",
    "Axios",
    "React Router DOM",
  ];

  const team = [
    { name: "Mohit", id: "12212378" },
    { name: "Dev Baliyan", id: "12211464" },
    { name: "Gaurav", id: "12220408" },
    { name: "Rahul", id: "12219061" },
    { name: "Yashwant", id: "12221704" },
    { name: "Tushar Nagar", id: "12220228" },
  ];

  const stats = [
    { value: "22", label: "Crop Types" },
    { value: "99%+", label: "Model Accuracy" },
    { value: "7", label: "Input Features" },
    { value: "2200", label: "Training Samples" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">
          <div className="px-6 py-10 sm:px-10 sm:py-12">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
                About CropAI
              </p>
              <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-slate-900">
                AI-Powered Crop Recommendation System
              </h1>
              <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
                A full-stack web application that uses Machine Learning (Random Forest Classifier)
                and SHAP explainability to recommend the most suitable crop based on soil nutrients
                (N, P, K), soil pH, moisture, and weather conditions (temperature, humidity,
                rainfall).
              </p>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <div className="grid gap-6 sm:grid-cols-3">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                  {card.icon}
                </div>
                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  {card.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Backend</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {techStack.slice(0, 6).map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-slate-800"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Frontend</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {techStack.slice(6).map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-slate-800"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Meet the Team</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {team.map((member) => (
                <div
                  key={member.name}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-semibold text-emerald-700">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {member.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Registration: {member.id}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Project Stats</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-slate-200 bg-emerald-50 p-5 text-center"
                >
                  <p className="text-3xl font-bold text-emerald-700">{item.value}</p>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
