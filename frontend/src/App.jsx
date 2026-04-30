import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/dashboard";
const DEFAULT_KEYS = ["budget_total", "tax_revenue", "population"];
const PRESETS = [
  { label: "5 Jahre", years: 5 },
  { label: "10 Jahre", years: 10 },
  { label: "Alles", years: 17 },
];

function formatNumber(value, unit = "") {
  if (unit === "Personen" || unit === "FTE") {
    return new Intl.NumberFormat("de-CH").format(Math.round(value));
  }

  return `${new Intl.NumberFormat("de-CH", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value < 10 ? 1 : 0,
  }).format(value)} ${unit}`;
}

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(DEFAULT_KEYS);
  const [startYear, setStartYear] = useState(2012);
  const [perCapita, setPerCapita] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const keys = params.get("keys");
    const start = Number(params.get("start"));

    if (keys) {
      setSelectedKeys(keys.split(",").filter(Boolean));
    }
    if (start) {
      setStartYear(start);
    }
    setPerCapita(params.get("perCapita") === "1");
    setDarkMode(params.get("dark") === "1");
  }, []);

  useEffect(() => {
    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => setDashboard(data))
      .catch(() => setDashboard({ error: true }));
  }, []);

  const populationByYear = useMemo(() => {
    const population = dashboard?.series?.find((item) => item.key === "population");
    return new Map(population?.values.map((row) => [row.year, row.value]) ?? []);
  }, [dashboard]);

  const selectedSeries = useMemo(() => {
    return dashboard?.series?.filter((item) => selectedKeys.includes(item.key)) ?? [];
  }, [dashboard, selectedKeys]);

  const allSeries = dashboard?.series ?? [];

  function buildChartRows(seriesList) {
    const rows = new Map();

    seriesList.forEach((item) => {
      item.values
        .filter((entry) => entry.year >= startYear)
        .forEach((entry) => {
          const row = rows.get(entry.year) ?? { year: entry.year, forecast: entry.forecast };
          const population = populationByYear.get(entry.year) || 1;
          const isMoney = item.unit.includes("CHF");
          const value = perCapita && isMoney ? (entry.value * 1_000_000_000) / population : entry.value;
          const displayValue = Number(value.toFixed(perCapita && isMoney ? 0 : 2));

          row[item.key] = displayValue;
          row[entry.forecast ? `${item.key}_forecast` : `${item.key}_historical`] = displayValue;
          row.forecast = row.forecast || entry.forecast;
          rows.set(entry.year, row);
        });
    });

    return Array.from(rows.values()).sort((a, b) => a.year - b.year);
  }

  const chartData = useMemo(() => {
    return buildChartRows(selectedSeries);
  }, [perCapita, populationByYear, selectedSeries, startYear]);

  const allChartData = useMemo(() => {
    return buildChartRows(allSeries);
  }, [allSeries, perCapita, populationByYear, startYear]);

  const latestYear = Math.max(...chartData.filter((row) => !row.forecast).map((row) => row.year), 2026);
  const latestRows = selectedSeries.map((item) => {
    const current = item.values.find((entry) => entry.year === latestYear);
    const previous = item.values.find((entry) => entry.year === latestYear - 1);
    return { item, current, previous };
  });

  function toggleKey(key) {
    setSelectedKeys((current) => {
      if (current.includes(key)) {
        return current.length === 1 ? current : current.filter((item) => item !== key);
      }
      return [...current, key];
    });
  }

  function resetDashboard() {
    setSelectedKeys(DEFAULT_KEYS);
    setStartYear(2012);
    setPerCapita(false);
    setDarkMode(false);
    window.history.replaceState(null, "", window.location.pathname);
  }

  function copyShareLink() {
    const params = new URLSearchParams({
      keys: selectedKeys.join(","),
      start: String(startYear),
      perCapita: perCapita ? "1" : "0",
      dark: darkMode ? "1" : "0",
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadCsv() {
    const headers = ["year", "forecast", ...selectedSeries.map((item) => item.label)];
    const rows = chartData.map((row) => [
      row.year,
      row.forecast ? "yes" : "no",
      ...selectedSeries.map((item) => row[item.key] ?? ""),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "zuerich-stadt-dashboard.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (!dashboard) {
    return <main className="loading">Dashboard wird geladen...</main>;
  }

  if (dashboard.error) {
    return <main className="loading">Dashboard-Daten konnten nicht geladen werden.</main>;
  }

  return (
    <main className={darkMode ? "app dark" : "app"}>
      <section className="hero">
        <div>
          <p className="eyebrow">Civic Tech · Open Government Data</p>
          <h1>Zürich Stadt-Dashboard</h1>
          <p className="intro">
            Zentrale Kennzahlen der Stadt Zürich werden zeitlich eingeordnet,
            vergleichbar gemacht und mit klaren Quellenhinweisen dargestellt.
          </p>
        </div>
        <div className="hero-actions">
          <button onClick={copyShareLink}>{copied ? "Link kopiert" : "Share-Link"}</button>
          <button onClick={downloadCsv}>CSV</button>
          <button onClick={resetDashboard}>Reset</button>
        </div>
      </section>

      <section className="controls" aria-label="Dashboard Filter">
        <div>
          <span className="control-label">Kennzahlen</span>
          <div className="chips">
            {dashboard.series.map((item) => (
              <button
                className={selectedKeys.includes(item.key) ? "chip active" : "chip"}
                key={item.key}
                onClick={() => toggleKey(item.key)}
                style={{ "--accent": item.color }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="range-control">
          <span className="control-label">Zeitraum ab {startYear}</span>
          <input
            max="2026"
            min="2012"
            onChange={(event) => setStartYear(Number(event.target.value))}
            type="range"
            value={startYear}
          />
          <div className="preset-row">
            {PRESETS.map((preset) => (
              <button key={preset.label} onClick={() => setStartYear(2028 - preset.years)}>
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <label className="toggle">
          <input checked={perCapita} onChange={(event) => setPerCapita(event.target.checked)} type="checkbox" />
          Pro-Kopf-Werte für Finanzkennzahlen
        </label>
        <label className="toggle">
          <input checked={darkMode} onChange={(event) => setDarkMode(event.target.checked)} type="checkbox" />
          Dark Mode
        </label>
      </section>

      <section className="kpi-grid">
        {latestRows.map(({ item, current, previous }) => {
          const delta = current && previous ? current.value - previous.value : 0;
          return (
            <article className="kpi" key={item.key}>
              <span style={{ color: item.color }}>{item.label}</span>
              <strong>{current ? formatNumber(current.value, item.unit) : "-"}</strong>
              <small>
                {delta >= 0 ? "+" : ""}
                {formatNumber(delta, item.unit)} gegenüber Vorjahr
              </small>
            </article>
          );
        })}
      </section>

      <section className="chart-panel">
        <div className="panel-heading">
          <div>
            <h2>Zeitverlauf und Trendfortschreibung</h2>
            <p>Gestrichelte Abschnitte zeigen eine einfache Fortschreibung und keine offizielle Prognose.</p>
          </div>
          <span>{startYear}-2028</span>
        </div>
        <ResponsiveContainer height={380} width="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedSeries.map((item) => (
              <Fragment key={item.key}>
                <Line
                  dataKey={`${item.key}_historical`}
                  dot={false}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={3}
                  type="monotone"
                />
                <Line
                  dataKey={`${item.key}_forecast`}
                  dot={false}
                  legendType="none"
                  name={`${item.label} Trend`}
                  stroke={item.color}
                  strokeDasharray="8 6"
                  strokeWidth={3}
                  type="monotone"
                />
              </Fragment>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="grid-two">
        <article className="chart-panel">
          <h2>Budgetstruktur nach Departement</h2>
          <ResponsiveContainer height={320} width="100%">
            <BarChart data={dashboard.departments} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={130} />
              <Tooltip />
              <Bar dataKey="budget" fill="#c43c30" name="Budget 2026 in Mrd. CHF" />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="chart-panel">
          <h2>Investitionen vs. laufende Kosten</h2>
          <ResponsiveContainer height={320} width="100%">
            <AreaChart data={allChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area dataKey="investments" fill="#d58a1f" name="Investitionen" stackId="1" stroke="#d58a1f" />
              <Area dataKey="operating_costs" fill="#627b3f" name="Laufende Kosten" stackId="1" stroke="#627b3f" />
            </AreaChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="source-strip">
        <div>
          <strong>Quellen</strong>
          <p>{dashboard.sourceNote}</p>
        </div>
        <a href={dashboard.sources[0].url} rel="noreferrer" target="_blank">
          {dashboard.sources[0].name}
        </a>
      </section>
    </main>
  );
}

export default App;
