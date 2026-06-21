import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { createTreeCard, renderDetailModal } from "./render.js";
import { currentLanguage } from "./app.js";
import { favorites } from "./favorites.js";
import { initLazyLoading } from "./app.js";   // ⭐ BELANGRIJK

export let map;
let markers = [];

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

export function initMap() {
  if (map) return;

  map = L.map("map").setView([50.8466, 4.3528], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
}

export function renderMarkers(trees) {
  // oude markers verwijderen
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  trees.forEach(tree => {
    const lat = tree.geo_point_2d?.lat;
    const lon = tree.geo_point_2d?.lon;

    if (!lat || !lon) return;

    const marker = L.marker([lat, lon], { icon: treeMarkerIcon }).addTo(map);

    // DOM‑card (geen HTML‑string)
    const card = createTreeCard(tree, currentLanguage, favorites, true);
    marker.bindPopup(card, { maxWidth: 350 });

    // ⭐ FIX: popup listeners + lazy loading
    marker.on("popupopen", () => {
      // ⭐ FOTO’S IN POPUP LAZY LADEN
      initLazyLoading();

      // ⭐ DETAIL‑MODAL KOPPELEN
      const link = document.querySelector(".leaflet-popup .detail-link");
      if (link) {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          renderDetailModal(tree, currentLanguage);
        });
      }
    });

    markers.push(marker);
  });
}

export function locateUser() {
  if (!navigator.geolocation) {
    console.warn("Geolocatie wordt niet ondersteund door deze browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      console.log("Jouw locatie:", lat, lon);

      document.dispatchEvent(new CustomEvent("userLocated", {
        detail: { lat, lon }
      }));
    },
    error => {
      console.error("Kon locatie niet ophalen:", error.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
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
