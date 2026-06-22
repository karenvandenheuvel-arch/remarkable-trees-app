import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { createTreeCard, renderDetailModal } from "./render.js";
import { currentLanguage } from "./app.js";
import { favorites } from "./favorites.js";
import { initLazyLoading } from "./app.js";
import { ORS_API_KEY } from "./app.js"; // jouw key staat hier, prima

export let map;
let markers = [];

// ⭐ Wandeling state
let walkPoints = [];
let walkLine = [];        // altijd array
let totalDistance = 0;    // meters
let walkSegments = [];    // segmenten met afstand + tijd


// ⭐ MARKER ICON (moet boven renderMarkers staan!)
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


// ⭐ ORS ROUTE FETCH
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


// ⭐ MAP INIT
export function initMap() {
  if (map) return;

  map = L.map("map").setView([50.8466, 4.3528], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
}


// ⭐ MARKERS
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


// ⭐ USER LOCATIE
export function locateUser() {
  if (!navigator.geolocation) {
    console.warn("Geolocatie wordt niet ondersteund door deze browser.");
    return;
  }

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


// ⭐ WANDERING TOEVOEGEN
async function addTreeToWalk(tree) {
  const lat = tree.geo_point_2d?.lat;
  const lon = tree.geo_point_2d?.lon;

  if (!lat || !lon) return;

  // Boomnaam voor in het zijpaneel
let name;

if (currentLanguage === "nl") {
  name = tree.nom_nl || tree.nom_fr || tree.nom_la || "Onbekende boom";
} else {
  name = tree.nom_fr || tree.nom_nl || tree.nom_la || "Arbre inconnu";
}


  // Eerste punt
  if (walkPoints.length === 0) {
    walkPoints.push({ lat, lon, name });
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

  updateWalkPanel();

  map.fitBounds(segmentLine.getBounds(), { padding: [50, 50] });
}





// ⭐ AFSTAND UI
function updateDistanceUI() {
  const el = document.getElementById("walk-distance");
  if (!el) return;

  let meters = totalDistance;
  let text = meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(2)} km`;

  el.textContent = `Totale afstand: ${text}`;
}


// ⭐ ZIJPANEEL
function updateWalkPanel() {
  const panel = document.getElementById("walk-panel");
  const list = document.getElementById("walk-list");
  const totalEl = document.getElementById("walk-total");
  const timeEl = document.getElementById("walk-time");

  panel.classList.remove("hidden");
  list.innerHTML = "";

  walkPoints.forEach((p, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${p.name}`;
    list.appendChild(li);
  });

  // totale afstand
  let meters = totalDistance;
  totalEl.textContent = meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(2)} km`;

  // totale tijd
  let seconds = walkSegments.reduce((sum, seg) => sum + seg.duration, 0);
  let minutes = Math.round(seconds / 60);
  timeEl.textContent = `${minutes} min`;
}


// ⭐ LAATSTE VERWIJDEREN
document.getElementById("walk-remove-last").addEventListener("click", () => {
  if (walkPoints.length <= 1) return;

  walkPoints.pop();

  const lastLine = walkLine.pop();
  map.removeLayer(lastLine);

  const lastSeg = walkSegments.pop();
  totalDistance -= lastSeg.distance;

  updateWalkPanel();
});


// ⭐ RESET VIA PANEEL
document.getElementById("walk-reset").addEventListener("click", () => {
  walkPoints = [];
  walkSegments = [];
  totalDistance = 0;

  walkLine.forEach(line => map.removeLayer(line));
  walkLine = [];

  document.getElementById("walk-panel").classList.add("hidden");
});
