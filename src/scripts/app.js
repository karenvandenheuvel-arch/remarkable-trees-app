'use strict';

/* ----------------------------------------------------
   IMPORTS
---------------------------------------------------- */
import { fetchTrees } from './api.js';
import { translations } from './utils.js';
import { initMap } from "./map.js";
import { map } from "./map.js";
import { renderMarkers } from "./map.js";




import {
  setupFilters,
  applyFilters,
  populateStatusFilter,
  populateRarityFilter,
  updateSortLabels
} from './filter.js';

import {
  loadFavorites,
  saveFavorites,
  toggleFavorite,
  resetFavorites,
  favorites
} from './favorites.js';

/* ----------------------------------------------------
   STATE
---------------------------------------------------- */
export let currentLanguage = "nl";
export let allTrees = [];


/* ----------------------------------------------------
   INIT
---------------------------------------------------- */
export async function initApp() {
  loadFavorites();
  allTrees = await fetchTrees();
  initMap(); // kaart tonen
  updateViewSwitchLabels();
  populateStatusFilter(allTrees, currentLanguage);
  populateRarityFilter(allTrees, currentLanguage);
  updateSortLabels(currentLanguage);
  updateFilterPlaceholders();

  document.getElementById("girth-value").textContent =
    document.getElementById("girth-slider").value + " cm";

  document.getElementById("crown-value").textContent =
    document.getElementById("crown-slider").value + " m";

  document.getElementById("favorites-toggle").classList.remove("active");
  document.getElementById("sort-select").value = "name-asc";

  applyFilters();
}

/* ----------------------------------------------------
   VIEW SWITCH
---------------------------------------------------- */


function setupViewSwitch() {
  const listBtn = document.getElementById("view-list");
  const mapBtn = document.getElementById("view-map");

  const listView = document.getElementById("list-view");
  const mapView = document.getElementById("map-view");

  // 👉 LIST VIEW
  listBtn.addEventListener("click", () => {
    // zichtbaarheid
    listView.style.display = "flex";   // belangrijk: flex voor je grid
    mapView.style.display = "none";

    // fullscreen class verwijderen
    mapView.classList.remove("fullscreen");

    // active states
    listBtn.classList.add("active");
    mapBtn.classList.remove("active");
  });

  // 👉 MAP VIEW
  mapBtn.addEventListener("click", () => {
    // zichtbaarheid
    listView.style.display = "none";
    mapView.style.display = "block";

    // fullscreen class toevoegen
    mapView.classList.add("fullscreen");

    // active states
    mapBtn.classList.add("active");
    listBtn.classList.remove("active");

    // Leaflet opnieuw laten tekenen
    setTimeout(() => {
      map.invalidateSize();
    }, 50);
  });
}


/* ----------------------------------------------------
   TAAL SWITCH
---------------------------------------------------- */
function setupLanguageSwitch() {
  const buttons = document.querySelectorAll(".lang-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      currentLanguage = btn.dataset.lang;

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      updateViewSwitchLabels();
      populateStatusFilter(allTrees, currentLanguage);
      populateRarityFilter(allTrees, currentLanguage);
      updateSortLabels(currentLanguage);
      updateFilterPlaceholders();

      applyFilters();
    });
  });
}

/* ----------------------------------------------------
   LABELS UPDATEN
---------------------------------------------------- */
function updateViewSwitchLabels() {
  document.getElementById("view-list").textContent =
    translations[currentLanguage].list;

  document.getElementById("view-map").textContent =
    translations[currentLanguage].map;
}

function updateFilterPlaceholders() {
  const lang = currentLanguage;

  const placeholders = {
    nl: {
      search: "Zoek op naam",
      sort: "Sorteer op",
      status: "Status (alle)",
      rarity: "Zeldzaamheid (alle)"
    },
    fr: {
      search: "Rechercher par nom",
      sort: "Trier par",
      status: "Statut (tous)",
      rarity: "Rareté (tous)"
    }
  };

  document.getElementById("search-bar").placeholder = placeholders[lang].search;
  document.querySelector("#sort-select option").textContent = placeholders[lang].sort;
  document.querySelector("#status-filter option").textContent = placeholders[lang].status;
  document.querySelector("#rarity-filter option").textContent = placeholders[lang].rarity;
}

/* ----------------------------------------------------
   START
---------------------------------------------------- */
setupViewSwitch();
setupLanguageSwitch();
setupFilters();
initApp();
