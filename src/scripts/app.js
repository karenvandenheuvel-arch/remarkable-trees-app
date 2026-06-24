'use strict';

/* ----------------------------------------------------
   IMPORTS
---------------------------------------------------- */
import { fetchTrees } from './api.js';
import { translations } from './utils.js';
import { initMap, locateUser, map } from "./map.js";

import {
  setupFilters,
  applyFilters,
  populateStatusFilter,
  populateRarityFilter
} from './filter.js';

import { loadFavorites } from './favorites.js';

export const ORS_API_KEY =
  "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjM2MDQyNDEwYzMyZDQ1NzRhNTNlNzE1ODcxN2EzYzU4IiwiaCI6Im11cm11cjY0In0=";


/* ----------------------------------------------------
   STATE
---------------------------------------------------- */
export let currentLanguage = "nl";

const savedLang = localStorage.getItem("preferredLanguage");
if (savedLang) currentLanguage = savedLang;

export let allTrees = [];


/* ----------------------------------------------------
   VIEW SWITCH
---------------------------------------------------- */
function setupViewSwitch() {
  const listBtn = document.getElementById("view-list");
  const mapBtn = document.getElementById("view-map");

  const listView = document.getElementById("list-view");
  const mapView = document.getElementById("map-view");

  if (!listBtn || !mapBtn || !listView || !mapView) return;

  const savedView = localStorage.getItem("viewMode");

  listBtn.addEventListener("click", () => {
    listView.style.display = "flex";
    mapView.style.display = "none";
    mapView.classList.remove("fullscreen");

    listBtn.classList.add("active");
    mapBtn.classList.remove("active");

    localStorage.setItem("viewMode", "list");
  });

  mapBtn.addEventListener("click", () => {
    listView.style.display = "none";
    mapView.style.display = "block";
    mapView.classList.add("fullscreen");

    mapBtn.classList.add("active");
    listBtn.classList.remove("active");

    localStorage.setItem("viewMode", "map");

    if (map) {
      setTimeout(() => map.invalidateSize(), 50);
    }
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
      localStorage.setItem("preferredLanguage", currentLanguage);

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      updateViewSwitchLabels();
      populateStatusFilter();
      populateRarityFilter();
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
      rarity: "Zeldzaamheid (alle)",
      species: "Soort (alle)"
    },
    fr: {
      search: "Rechercher par nom",
      sort: "Trier par",
      status: "Statut (tous)",
      rarity: "Rareté (tous)",
      species: "Espèce (toutes)"
    }
  };

  document.getElementById("search-bar").placeholder = placeholders[lang].search;
  document.querySelector("#sort-select option").textContent = placeholders[lang].sort;
  document.querySelector("#status-filter option").textContent = placeholders[lang].status;
  document.querySelector("#rarity-filter option").textContent = placeholders[lang].rarity;

  // ⭐ custom species dropdown
  document.querySelector(".species-selected").textContent = placeholders[lang].species;
}


/* ----------------------------------------------------
   INIT
---------------------------------------------------- */
export async function initApp() {
  console.log("initApp start…");

  // taal herstellen
  const langButtons = document.querySelectorAll(".lang-btn");
  langButtons.forEach(b => b.classList.remove("active"));
  document
    .querySelector(`.lang-btn[data-lang="${currentLanguage}"]`)
    ?.classList.add("active");

  loadFavorites();
  allTrees = await fetchTrees();

  initMap();
  setupViewSwitch();

  const savedView = localStorage.getItem("viewMode");
  setTimeout(() => {
    if (savedView === "map") {
      document.getElementById("view-map").click();
    } else {
      document.getElementById("view-list").click();
    }
  }, 50);

  updateViewSwitchLabels();
  populateStatusFilter();
  populateRarityFilter();
  updateFilterPlaceholders();

  document.getElementById("girth-value").textContent =
    document.getElementById("girth-slider").value + " cm";
  document.getElementById("crown-value").textContent =
    document.getElementById("crown-slider").value + " m";

  document.getElementById("favorites-toggle").classList.remove("active");
  document.getElementById("sort-select").value = "name-asc";

  applyFilters();

  setTimeout(() => locateUser(), 300);

  console.log("initApp klaar.");
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

        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.onload = () => img.classList.add("loaded");
        }

        img.classList.remove("lazy");
        obs.unobserve(img);
      }
    });
  }, {
    root: null,
    threshold: 0.2
  });

  lazyImages.forEach(img => observer.observe(img));
}


/* ----------------------------------------------------
   START
---------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  setupLanguageSwitch();
  initApp();
  setupFilters();
});
