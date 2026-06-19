'use strict';

/* ----------------------------------------------------
   IMPORTS
---------------------------------------------------- */
import { fetchTrees } from './api.js';
import { translations } from './utils.js';
import { initMap } from "./map.js";
import { map } from "./map.js";

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

  listBtn.addEventListener("click", () => {
    listView.style.display = "flex";
    mapView.style.display = "none";
    mapView.classList.remove("fullscreen");

    listBtn.classList.add("active");
    mapBtn.classList.remove("active");
  });

  mapBtn.addEventListener("click", () => {
    listView.style.display = "none";
    mapView.style.display = "block";
    mapView.classList.add("fullscreen");

    mapBtn.classList.add("active");
    listBtn.classList.remove("active");

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

  // ⭐ juiste taal-knop actief zetten
  document
    .querySelector(`.lang-btn[data-lang="${currentLanguage}"]`)
    ?.classList.add("active");

  loadFavorites();
  allTrees = await fetchTrees();
  initMap();

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
   START
---------------------------------------------------- */
setupViewSwitch();
setupLanguageSwitch(); // ⭐ moet vóór initApp()
setupFilters();
initApp();
