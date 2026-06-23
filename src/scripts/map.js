import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { createTreeCard, renderDetailModal } from "./render.js";
import { currentLanguage } from "./app.js";
import { favorites } from "./favorites.js";
import { initLazyLoading } from "./app.js";
import { ORS_API_KEY } from "./app.js";


// ---------------------------------------------------------
// ⭐ STATE
// ---------------------------------------------------------
export let map;
let markers = [];

let walkPoints = [];      // { lat, lon, name }
let walkSegments = [];    // { distance, duration, from, to }
let walkLine = [];        // polyline layers
let totalDistance = 0;    // meters


// ---------------------------------------------------------
// ⭐ MARKER ICON
// ---------------------------------------------------------
const treeMarkerIcon = L.divIcon({
  className: "tree-marker-icon",
  html: `
    <svg viewBox="0 -960 960 960" class="tree-icon filled">
      <path d="M558-80H402v-160H120l160-240h-80l280-400 280 400h-80l160 240H558v160Z"
            fill="rgb(20, 120, 60)"
            stroke="rgb(20, 100, 50)"
            stroke-width="60"
            stroke-linejoin="round"
            stroke-linecap="round"
      />
    </svg>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});


// ---------------------------------------------------------
// ⭐ ORS ROUTE FETCH
// ---------------------------------------------------------
async function fetchWalkingRoute(start, end) {
  const url = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";

  const body = {
    coordinates: [
      [start.lon, start.lat],
      [end.lon, end.lat]
    ]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": ORS_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return await response.json();
}


// ---------------------------------------------------------
// ⭐ MAP INIT
// ---------------------------------------------------------
export function initMap() {
  if (map) return;

  map = L.map("map").setView([50.8466, 4.3528], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  loadSavedWalks(); // ⭐ toon opgeslagen wandelingen bij opstart
}


// ---------------------------------------------------------
// ⭐ MARKERS
// ---------------------------------------------------------
export function renderMarkers(trees) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  trees.forEach(tree => {
    const lat = tree.geo_point_2d?.lat;
    const lon = tree.geo_point_2d?.lon;
    if (!lat || !lon) return;

    const marker = L.marker([lat, lon], { icon: treeMarkerIcon }).addTo(map);

    const card = createTreeCard(tree, currentLanguage, favorites, true);
    marker.bindPopup(card, { maxWidth: 350 });

    marker.on("popupopen", (e) => {
      initLazyLoading();

      const popupRoot = e.popup.getElement();
      if (!popupRoot) return;

      const contentEl = popupRoot.querySelector(".leaflet-popup-content");
      if (!contentEl) return;

      // DETAIL LINK
      const link = contentEl.querySelector(".detail-link");
      if (link) {
        link.addEventListener("click", (ev) => {
          ev.preventDefault();
          renderDetailModal(tree, currentLanguage);
        });
      }

      // TOEVOEGEN AAN WANDELING
      let btn = contentEl.querySelector(".add-to-walk");
      if (!btn) {
        btn = document.createElement("button");
        btn.textContent = "➕ Voeg toe aan wandeling";
        btn.classList.add("add-to-walk");
        contentEl.appendChild(btn);
      }

      btn.onclick = () => addTreeToWalk(tree);
    });

    markers.push(marker);
  });
}


// ---------------------------------------------------------
// ⭐ USER LOCATIE
// ---------------------------------------------------------
export function locateUser() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      document.dispatchEvent(new CustomEvent("userLocated", {
        detail: { lat, lon }
      }));
    },
    error => console.error("Kon locatie niet ophalen:", error.message),
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  );
}

document.addEventListener("userLocated", (event) => {
  const { lat, lon } = event.detail;

  L.circleMarker([lat, lon], {
    radius: 8,
    color: "#ff4081",
    fillColor: "#ff4081",
    fillOpacity: 0.9
  }).addTo(map);

  map.setView([lat, lon], 15);
});


// ---------------------------------------------------------
// ⭐ WANDERING TOEVOEGEN
// ---------------------------------------------------------
async function addTreeToWalk(tree) {
  const lat = tree.geo_point_2d?.lat;
  const lon = tree.geo_point_2d?.lon;
  if (!lat || !lon) return;

  let name;
  if (currentLanguage === "nl") {
    name = tree.nom_nl || tree.nom_fr || tree.nom_la || "Onbekende boom";
  } else {
    name = tree.nom_fr || tree.nom_nl || tree.nom_la || "Arbre inconnu";
  }

  // Eerste punt
  if (walkPoints.length === 0) {
    walkPoints.push({ lat, lon, name });
    document.getElementById("walk-panel").classList.remove("hidden"); // ⭐ panel tonen
    updateWalkPanel();
    return;
  }

  const prev = walkPoints[walkPoints.length - 1];

  // ⭐ ORS ROUTE
  const route = await fetchWalkingRoute(prev, { lat, lon });

  const coords = route.features[0].geometry.coordinates;
  const distance = route.features[0].properties.summary.distance;
  const duration = route.features[0].properties.summary.duration;

  totalDistance += distance;

  walkSegments.push({
    distance,
    duration,
    from: prev.name,
    to: name
  });

  // ⭐ POLYLINE
  const latlngs = coords.map(c => [c[1], c[0]]);
  const segmentLine = L.polyline(latlngs, {
    color: "#ff4081",
    weight: 4,
    opacity: 0.9
  }).addTo(map);

  walkLine.push(segmentLine);

  walkPoints.push({ lat, lon, name });

  document.getElementById("walk-panel").classList.remove("hidden"); // ⭐ panel tonen
  updateWalkPanel();
  map.fitBounds(segmentLine.getBounds(), { padding: [50, 50] });
}


// ---------------------------------------------------------
// ⭐ ZIJPANEEL
// ---------------------------------------------------------
function updateWalkPanel() {
  const panel = document.getElementById("walk-panel");
  const list = document.getElementById("walk-list");
  const totalEl = document.getElementById("walk-total");
  const timeEl = document.getElementById("walk-time");

  panel.classList.remove("hidden"); // ⭐ panel altijd tonen
  list.innerHTML = "";

  walkPoints.forEach((p, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${p.name}`;
    list.appendChild(li);

    if (i < walkSegments.length) {
      const seg = walkSegments[i];

      const meters = seg.distance;
      const distText = meters < 1000
        ? `${Math.round(meters)} m`
        : `${(meters / 1000).toFixed(2)} km`;

      const minutes = Math.round(seg.duration / 60);

      const segLi = document.createElement("li");
      segLi.classList.add("segment-item");
      segLi.innerHTML = `
        <div class="seg-meta">${distText} • ${minutes} min</div>
      `;
      list.appendChild(segLi);
    }
  });

  // Totale afstand
  totalEl.textContent =
    totalDistance < 1000
      ? `${Math.round(totalDistance)} m`
      : `${(totalDistance / 1000).toFixed(2)} km`;

  // Totale tijd
  const seconds = walkSegments.reduce((sum, seg) => sum + seg.duration, 0);
  const minutes = Math.round(seconds / 60);
  timeEl.textContent = `${minutes} min`;
}


// ---------------------------------------------------------
// ⭐ DOMCONTENTLOADED — ALLE KNOPPEN WERKEN NU ALTIJD
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {

  const removeLastBtn = document.getElementById("walk-remove-last");
  const resetBtn = document.getElementById("walk-reset");
  const saveBtn = document.getElementById("walk-save");
  const savedList = document.getElementById("saved-walks-list");

  // ⭐ Laatste verwijderen
  if (removeLastBtn) {
    removeLastBtn.addEventListener("click", () => {
      if (walkPoints.length <= 1) return;

      walkPoints.pop();

      const lastLine = walkLine.pop();
      map.removeLayer(lastLine);

      const lastSeg = walkSegments.pop();
      totalDistance -= lastSeg.distance;

      updateWalkPanel();
    });
  }

  // ⭐ Reset
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      walkPoints = [];
      walkSegments = [];
      totalDistance = 0;

      walkLine.forEach(line => map.removeLayer(line));
      walkLine = [];

      updateWalkPanel(); // ⭐ panel blijft zichtbaar maar leeg
    });
  }

  // ⭐ Wandeling opslaan
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const name = prompt("Geef een naam voor deze wandeling:");
      if (!name) return;

      const saved = JSON.parse(localStorage.getItem("savedWalks") || "[]");

      saved.push({
        name,
        points: walkPoints,
        segments: walkSegments,
        totalDistance,
        totalTime: walkSegments.reduce((sum, seg) => sum + seg.duration, 0)
      });

      localStorage.setItem("savedWalks", JSON.stringify(saved));
      loadSavedWalks();
    });
  }

  // ⭐ Laden / verwijderen
  if (savedList) {
    savedList.addEventListener("click", async (e) => {
      const loadIndex = e.target.dataset.load;
      const deleteIndex = e.target.dataset.delete;

      const saved = JSON.parse(localStorage.getItem("savedWalks") || "[]");

      // ⭐ Laden
      if (loadIndex !== undefined) {
        const walk = saved[loadIndex];

        walkPoints = [];
        walkSegments = [];
        totalDistance = 0;
        walkLine.forEach(line => map.removeLayer(line));
        walkLine = [];

        for (let i = 0; i < walk.points.length; i++) {
          const p = walk.points[i];

          if (i === 0) {
            walkPoints.push(p);
            continue;
          }

          const prev = walk.points[i - 1];

          const route = await fetchWalkingRoute(prev, p);
          const coords = route.features[0].geometry.coordinates;
          const distance = route.features[0].properties.summary.distance;
          const duration = route.features[0].properties.summary.duration;

          totalDistance += distance;

          walkSegments.push({
            distance,
            duration,
            from: prev.name,
            to: p.name
          });

          const latlngs = coords.map(c => [c[1], c[0]]);
          const segmentLine = L.polyline(latlngs, {
            color: "#ff4081",
            weight: 4,
            opacity: 0.9
          }).addTo(map);

          walkLine.push(segmentLine);
          walkPoints.push(p);
        }

        document.getElementById("walk-panel").classList.remove("hidden"); // ⭐ panel tonen
        updateWalkPanel();
        return;
      }

      // ⭐ Verwijderen
      if (deleteIndex !== undefined) {
        saved.splice(deleteIndex, 1);
        localStorage.setItem("savedWalks", JSON.stringify(saved));
        loadSavedWalks();
      }
    });
  }

  // ⭐ Bij DOM klaar: opgeslagen wandelingen tonen
  loadSavedWalks();
});


// ---------------------------------------------------------
// ⭐ WANDELINGEN LADEN FUNCTIE
// ---------------------------------------------------------
function loadSavedWalks() {
  const container = document.getElementById("saved-walks");
  const list = document.getElementById("saved-walks-list");

  const saved = JSON.parse(localStorage.getItem("savedWalks") || "[]");

  if (saved.length === 0) {
    container.classList.add("hidden");
    return;
  }

  container.classList.remove("hidden");
  list.innerHTML = "";

  saved.forEach((walk, index) => {
    const li = document.createElement("li");
   li.innerHTML = `
  <strong>${walk.name}</strong>
  <div class="saved-walk-actions">
    <button data-load="${index}">Laden</button>
    <button data-delete="${index}" class="danger">Verwijderen</button>
  </div>
`;

    list.appendChild(li);
  });
}

document.getElementById("walk-export").addEventListener("click", () => {
  exportWalkAsGpx();
});


function exportWalkAsGpx() {
  if (walkPoints.length === 0) {
    alert("Geen wandeling om te exporteren.");
    return;
  }

  const gpx = generateGpxFromWalk(walkPoints);
  downloadGpx(gpx, "wandeling.gpx");
}

function generateGpxFromWalk(points) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Remarkable Trees App" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Wandeling</name>
    <trkseg>
`;

  const footer = `
    </trkseg>
  </trk>
</gpx>`;

  const body = points
    .map(p => `      <trkpt lat="${p.lat}" lon="${p.lon}"><name>${p.name}</name></trkpt>`)
    .join("\n");

  return header + body + footer;
}

function downloadGpx(gpxContent, filename) {
  const blob = new Blob([gpxContent], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

function generateGoogleMapsUrl(points) {
  if (points.length === 0) return null;

  const base = "https://www.google.com/maps/dir/";
  const segments = points.map(p => `${p.lat},${p.lon}`).join("/");
  return base + segments + "/?travelmode=walking";
}

document.getElementById("walk-open-maps").addEventListener("click", () => {
  const url = generateGoogleMapsUrl(walkPoints);

  if (!url) {
    alert("Geen wandeling om te openen.");
    return;
  }

  window.open(url, "_blank");
});

const exportToggle = document.getElementById("walk-export-toggle");
const exportContent = document.getElementById("walk-export-content");
const exportArrow = document.querySelector(".walk-export-arrow");

exportToggle.addEventListener("click", () => {
  const isOpen = exportContent.style.display !== "none";

  if (isOpen) {
    exportContent.style.display = "none";
    exportArrow.style.transform = "rotate(-90deg)";
  } else {
    exportContent.style.display = "flex";
    exportArrow.style.transform = "rotate(0deg)";
  }
});

// Start collapsed
exportContent.style.display = "none";
exportArrow.style.transform = "rotate(-90deg)";

