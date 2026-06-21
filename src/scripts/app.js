'use strict';

/* ----------------------------------------------------
   IMPORTS
---------------------------------------------------- */
import { fetchTrees } from './api.js';
import { translations } from './utils.js';
import { initMap } from "./map.js";
import { map } from "./map.js";
import { locateUser } from "./map.js";


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

// ⭐ check of er een opgeslagen taal is
const savedLang = localStorage.getItem("preferredLanguage");
if (savedLang) {
  currentLanguage = savedLang;
}

export let allTrees = [];

/* ----------------------------------------------------
   VIEW SWITCH
---------------------------------------------------- */
function setupViewSwitch() {
  const listBtn = document.getElementById("view-list");
  const mapBtn = document.getElementById("view-map");

  const listView = document.getElementById("list-view");
  const mapView = document.getElementById("map-view");

  // ⭐ 1. View herstellen bij opstart
  const savedView = localStorage.getItem("viewMode");

  if (savedView === "map") {
    // Simuleer klik → voert alle logica correct uit
    setTimeout(() => mapBtn.click(), 0);
  } else {
    // Default = lijst
    setTimeout(() => listBtn.click(), 0);
  }

  // ⭐ 2. LIST VIEW
  listBtn.addEventListener("click", () => {
    // zichtbaarheid
    listView.style.display = "flex";
    mapView.style.display = "none";

    // fullscreen class verwijderen
    mapView.classList.remove("fullscreen");

    // active states
    listBtn.classList.add("active");
    mapBtn.classList.remove("active");

    // ⭐ opslaan
    localStorage.setItem("viewMode", "list");
  });

  // ⭐ 3. MAP VIEW
  mapBtn.addEventListener("click", () => {
    // zichtbaarheid
    listView.style.display = "none";
    mapView.style.display = "block";

    // fullscreen class toevoegen
    mapView.classList.add("fullscreen");

    // active states
    mapBtn.classList.add("active");
    listBtn.classList.remove("active");

    // ⭐ opslaan
    localStorage.setItem("viewMode", "map");

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

      // ⭐ taal opslaan
      localStorage.setItem("preferredLanguage", currentLanguage);

      // active class wisselen
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // UI opnieuw opbouwen
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
   INIT
---------------------------------------------------- */
export async function initApp() {

  // ⭐ taal herstellen
  const langButtons = document.querySelectorAll(".lang-btn");
  langButtons.forEach(b => b.classList.remove("active"));
  document
    .querySelector(`.lang-btn[data-lang="${currentLanguage}"]`)
    ?.classList.add("active");

  // ⭐ data + kaart
  loadFavorites();
  allTrees = await fetchTrees();
  initMap();

  // ⭐ setupViewSwitch pas NA initMap
  setupViewSwitch();

  // ⭐ view mode herstellen NA setupViewSwitch
  const savedView = localStorage.getItem("viewMode");
  setTimeout(() => {
    if (savedView === "map") {
      document.getElementById("view-map").click();
    } else {
      document.getElementById("view-list").click();
    }
  }, 50);

  // ⭐ UI labels & filters
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

  // ⭐ geolocatie pas starten wanneer de kaart zichtbaar is
  setTimeout(() => {
    locateUser();
  }, 300);
}
/* ----------------------------------------------------
   OBSERVER
---------------------------------------------------- */

export function initLazyLoading() {
  const lazyImages = document.querySelectorAll("img.lazy");

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;

        // ⭐ Alleen lazy load als er een echte foto is
        if (img.dataset.src) {
          img.src = img.dataset.src;

          // ⭐ Blur → sharp fade-in
          img.onload = () => {
            img.classList.add("loaded");
          };
        }

        // ⭐ Class verwijderen (optioneel)
        img.classList.remove("lazy");

        // ⭐ Stop observer voor deze afbeelding
        obs.unobserve(img);
      }
    });
  }, {
    root: null,        // viewport
    threshold: 0.2     // 20% zichtbaar = laden
  });

  lazyImages.forEach(img => observer.observe(img));
}


/* ----------------------------------------------------
   START
---------------------------------------------------- */
setupViewSwitch();
setupLanguageSwitch(); // ⭐ moet vóór initApp()
setupFilters();
initApp();
