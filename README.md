# 🌍 eqweb ~ Latest Earthquake Monitor 
<img src="https://raw.githubusercontent.com/alanfox2000software/eqweb/refs/heads/main/.github/Pic/screenshot.png" />
</p>

This application presents a comprehensive multi-agency joint observation analysis on a dynamic world map.

## 🚀 Live
Check out the live application here: [https://alanfox2000software.github.io/eqweb/](https://alanfox2000software.github.io/eqweb/)

---

## ✨ Features

- **Global Coverage with Multi-Agency Data**: Integrates data filtering across 25 major global seismic networks and research institutes.
- **Two-Way URL & UI Syncing**: 
  - Changing filters dynamically updates the browser URL parameters (`?time=...&mg=...&type=...&region=...`) using the HTML5 History API without reloading the page.
  - Opening a specific shared URL automatically pre-selects the corresponding dropdown filters and fetches the correct data instantly.
- **Joint Observation Analysis (Spider-Web Network)**: When multiple agencies report the same seismic event, the map connects the main report node to sub-agency markers via dashed polylines to prevent overlapping and visualize joint data disparities.
- **Adaptive Dynamic Layout**: Fully responsive flexbox/grid hybrid CSS layout that keeps the navigation filter bar pinned at the top and seamlessly resizes the sidebar and Leaflet canvas on various screen resolutions.
- **International Standardized Time**: Displays event occurrences in a precise `YYYY-MM-DD HH:MM:SS` format, automatically detecting and appending the user's localized timezone offset (e.g., `UTC+8`, `UTC-5`).

---

## 🌐 Supported Data Sources

The dashboard aggregates real-time data from **25 major international seismic networks and institutes** across the globe. Users can isolate records from any specific provider using the data source menu:

| Abbreviation | Full Agency Name | Country / Region |
| :--- | :--- | :--- |
| **USGS** | U.S. Geological Survey | United States |
| **EMSC** | EU Mediterranean Earthquake Centre | European Union / Mediterranean |
| **BGS** | British Geological Survey | United Kingdom |
| **GFZ** | German Research Centre for Geosciences (Potsdam) | Germany |
| **JMA** | Japan Meteorological Agency | Japan |
| **CHI** | Chile Earthquake Center (CSN) | Chile |
| **CAN** | Natural Resources Canada | Canada |
| **INGV** | National Institute of Geophysics and Volcanology | Italy |
| **CWB** | Central Weather Bureau (now CWA) | Taiwan |
| **IRSC** | Iranian Seismological Center | Iran |
| **TUR** | Turkish Disaster and Emergency Management Authority (AFAD) | Turkey |
| **CEIC** | China Earthquake Networks Center | China |
| **AUS** | Geoscience Australia | Australia |
| **NZL** | New Zealand Earthquake Commission (GeoNet) | New Zealand |
| **PHIVOLCS** | Philippine Institute of Volcanology and Seismology | Philippines |
| **ROU** | National Institute for Earth Physics | Romania |
| **OVSICORI** | Observatorio Vulcanológico y Sismológico de Costa Rica | Costa Rica |
| **BMKG** | Meteorology, Climatology, and Geophysics Bureau | Indonesia |
| **IGEPN** | Instituto Geofísico - Escuela Politécnica Nacional | Ecuador |
| **IGN** | Instituto Geográfico Nacional | Spain |
| **IMO** | Icelandic Meteorological Office | Iceland |
| **INPRES** | Instituto Nacional de Prevención Sísmica | Argentina |
| **SSN** | Servicio Sismológico Nacional | Mexico |
| **INDIA** | National Center for Seismology | India |
| **All** | Consolidated View (All available agencies above) | Global |

---

## 🛠️ Tech Stack

- **Frontend Framework / Library**: HTML5, CSS3, JavaScript (ES6+), jQuery (v3.7.1)
- **Map Render Engine**: [Leaflet.js](https://leafletjs.com/) (v1.9.4) & OpenStreetMap Tile Layers
- **Backend Infrastructure**: Cloudflare Workers API (Reverse Proxy / Data Aggregator)

---

## 📁 Project Structure

```text
eqweb/
├── index.html     # Main application layout & English localized selector panel
├── style.css      # Custom adaptive styling & layout fix for various viewports
├── app.js         # Core frontend logic (API requests, Leaflet renders, URL-sync)
└── README.md      # Project documentation