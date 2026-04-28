from functools import lru_cache

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Zurich City Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

YEARS = list(range(2012, 2027))

BASE_SERIES = {
    "budget_total": {
        "label": "Gesamtbudget der Stadt",
        "unit": "Mrd. CHF",
        "color": "#c43c30",
        "values": [8.2, 8.4, 8.5, 8.8, 9.0, 9.3, 9.6, 9.9, 10.2, 10.5, 10.9, 11.2, 11.6, 11.9, 12.3],
    },
    "employees": {
        "label": "Stadtische Mitarbeitende",
        "unit": "FTE",
        "color": "#1f7a7a",
        "values": [26750, 27200, 27640, 28120, 28680, 29100, 29650, 30120, 30780, 31450, 32100, 32780, 33420, 34100, 34750],
    },
    "tax_revenue": {
        "label": "Steuereinnahmen",
        "unit": "Mrd. CHF",
        "color": "#5f5aa2",
        "values": [4.4, 4.5, 4.7, 4.8, 4.9, 5.0, 5.2, 5.4, 5.3, 5.5, 5.8, 6.0, 6.1, 6.3, 6.5],
    },
    "investments": {
        "label": "Investitionen",
        "unit": "Mrd. CHF",
        "color": "#d58a1f",
        "values": [0.9, 1.0, 1.0, 1.1, 1.2, 1.2, 1.3, 1.4, 1.3, 1.5, 1.6, 1.7, 1.7, 1.8, 1.9],
    },
    "operating_costs": {
        "label": "Laufende Kosten",
        "unit": "Mrd. CHF",
        "color": "#627b3f",
        "values": [7.3, 7.4, 7.5, 7.7, 7.8, 8.1, 8.3, 8.5, 8.9, 9.0, 9.3, 9.5, 9.9, 10.1, 10.4],
    },
    "population": {
        "label": "Bevolkerung",
        "unit": "Personen",
        "color": "#2f6f9f",
        "values": [394000, 398600, 404200, 410400, 415700, 421900, 428700, 434900, 436300, 438500, 443000, 447800, 452600, 457100, 462000],
    },
}

DEPARTMENTS = [
    {"name": "Prasidialdepartement", "budget": 0.55},
    {"name": "Finanzdepartement", "budget": 1.05},
    {"name": "Sicherheitsdepartement", "budget": 1.4},
    {"name": "Gesundheits- und Umweltdepartement", "budget": 2.15},
    {"name": "Tiefbau- und Entsorgungsdepartement", "budget": 1.25},
    {"name": "Hochbaudepartement", "budget": 0.95},
    {"name": "Schul- und Sportdepartement", "budget": 2.25},
    {"name": "Sozialdepartement", "budget": 1.55},
]


def _trend(values: list[float], years: int = 2) -> list[float]:
    recent = values[-5:]
    yearly_delta = (recent[-1] - recent[0]) / (len(recent) - 1)
    return [round(values[-1] + yearly_delta * step, 1) for step in range(1, years + 1)]


@lru_cache(maxsize=1)
def get_dashboard_data() -> dict:
    series = []
    for key, item in BASE_SERIES.items():
        values = [
            {"year": year, "value": value, "forecast": False}
            for year, value in zip(YEARS, item["values"], strict=True)
        ]
        values.extend(
            {"year": YEARS[-1] + index, "value": value, "forecast": True}
            for index, value in enumerate(_trend(item["values"]), start=1)
        )
        series.append({**item, "key": key, "values": values})

    return {
        "updatedAt": "2026-04-28",
        "city": "Zurich",
        "sourceNote": "MVP-Datensatz mit offizieller Open-Data-Zielstruktur. Werte dienen als Demo und sind nicht als offizielle Prognose zu verwenden.",
        "sources": [
            {
                "name": "Open Data Stadt Zurich",
                "url": "https://data.stadt-zuerich.ch/",
                "topics": ["Finanzdaten", "Budget", "Personal", "Bevolkerung", "Investitionen"],
            }
        ],
        "series": series,
        "departments": DEPARTMENTS,
    }


@app.get("/api/dashboard")
def dashboard():
    return get_dashboard_data()


@app.get("/api/health")
def health():
    return {"status": "ok"}
