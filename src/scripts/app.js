'use strict';

import { fetchTrees } from './api.js';
import { renderTreeList } from './render.js';
import { translations, rarityLabels } from './utils.js';

/* ----------------------------------------------------
   STATE
---------------------------------------------------- */
let currentLanguage = "nl";
let allTrees = [];

const FAVORITES_KEY = "remarkableTreesFavorites";
let favorites = [];

/* ----------------------------------------------------
   STATUS FILTER
---------------------------------------------------- */
function populateStatusFilter() {
  const select = document.getElementById("status-filter");
  select.innerHTML = `<option value="all">${currentLanguage === "nl" ? "Alle" : "Tous"}</option>`;

  const lang = currentLanguage;

  const statuses = [...new Set(allTrees.map(t => t.statuts_fr).filter(Boolean))].sort();

  statuses.forEach(statusFr => {
    const opt = document.createElement("option");
    opt.value = statusFr;

    const label =
      lang === "nl"
        ? allTrees.find(t => t.statuts_fr === statusFr)?.statuts_nl || statusFr
        : statusFr;

    opt.textContent = label;
    select.appendChild(opt);
  });
}

/* ----------------------------------------------------
   RARITY FILTER
---------------------------------------------------- */
function populateRarityFilter() {
  const select = document.getElementById("rarity-filter");

  select.innerHTML = `<option value="all">${currentLanguage === "nl" ? "Alle" : "Tous"}</option>`;

  const lang = currentLanguage;

  const rarities = [...new Set(allTrees.map(t => t.rarete).filter(Boolean))].sort((a, b) => a - b);

  rarities.forEach(rarity => {
    const opt = document.createElement("option");
    opt.value = rarity;
    opt.textContent = rarityLabels[lang][rarity] || rarity;
    select.appendChild(opt);
  });
}

/* ----------------------------------------------------
   APPLY FILTER
---------------------------------------------------- */
function applyFilters() {
  const statusValue = document.getElementById("status-filter").value;
  const searchValue = document.getElementById("search-bar").value.toLowerCase();
  const rarityValue = document.getElementById("rarity-filter").value;

  let filtered = [...allTrees];

  // STATUS
  if (statusValue !== "all") {
    filtered = filtered.filter(tree => tree.statuts_fr === statusValue);
  }

  // ZOEKEN
  if (searchValue.trim() !== "") {
    filtered = filtered.filter(tree =>
      tree.nom_nl.toLowerCase().includes(searchValue) ||
      tree.nom_fr.toLowerCase().includes(searchValue)
    );
  }

  // ZELDZAAMHEID
  if (rarityValue !== "all") {
    filtered = filtered.filter(tree => String(tree.rarete) === rarityValue);
  }

  // SLIDERS
  const girthSliderValue = Number(document.getElementById("girth-slider").value); // cm
  const crownMin = Number(document.getElementById("crown-slider").value);        // m

  // OMTREK (cm → m)
  if (girthSliderValue > 0) {
    const girthMinMeters = girthSliderValue / 100;
    filtered = filtered.filter(tree => {
      const girth = Number(tree.circonference);
      return !isNaN(girth) && girth >= girthMinMeters;
    });
  }

  // KRUINDIAMETER (m)
  if (crownMin > 0) {
    filtered = filtered.filter(tree => {
      const crown = Number(tree.diametre_cime);
      return !isNaN(crown) && crown >= crownMin;
    });
  }

  // FAVORIETEN FILTER (BUTTON)
  const favBtn = document.getElementById("favorites-toggle");
  const favOnly = favBtn.classList.contains("active");

  if (favOnly) {
    filtered = filtered.filter(tree => favorites.includes(tree.id_arbres_cms));
  }

  renderTreeList(filtered, currentLanguage, favorites);
}

/* ----------------------------------------------------
   FILTER SETUP
---------------------------------------------------- */
function setupFilters() {
  document.getElementById("status-filter").addEventListener("change", applyFilters);
  document.getElementById("search-bar").addEventListener("input", applyFilters);
  document.getElementById("rarity-filter").addEventListener("change", applyFilters);

  const girthSlider = document.getElementById("girth-slider");
  const crownSlider = document.getElementById("crown-slider");

  girthSlider.addEventListener("input", () => {
    document.getElementById("girth-value").textContent = girthSlider.value + " cm";
    applyFilters();
  });

  crownSlider.addEventListener("input", () => {
    document.getElementById("crown-value").textContent = crownSlider.value + " m";
    applyFilters();
  });

  // FAVORIETEN TOGGLE BUTTON
  const favBtn = document.getElementById("favorites-toggle");
  favBtn.addEventListener("click", () => {
    favBtn.classList.toggle("active");
    applyFilters();
  });

document.getElementById("favorites-reset").addEventListener("click", () => {
  resetFavorites();
});


}

/* ----------------------------------------------------
   FAVORIETEN
---------------------------------------------------- */
function loadFavorites() {
  const stored = localStorage.getItem(FAVORITES_KEY);
  favorites = stored ? JSON.parse(stored) : [];
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function toggleFavorite(treeId) {
  if (favorites.includes(treeId)) {
    favorites = favorites.filter(id => id !== treeId);
  } else {
    favorites.push(treeId);
  }

  saveFavorites();
  applyFilters();
}

function resetFavorites() {
  favorites = [];
  saveFavorites();

  // toggle‑button uitzetten
  const favBtn = document.getElementById("favorites-toggle");
  favBtn.classList.remove("active");

  // lijst opnieuw renderen
  applyFilters();
}


/* ----------------------------------------------------
   INIT
---------------------------------------------------- */
export async function initApp() {
  loadFavorites();
  allTrees = await fetchTrees();

  updateViewSwitchLabels();
  populateStatusFilter();
  populateRarityFilter();

  document.getElementById("girth-value").textContent =
    document.getElementById("girth-slider").value + " cm";

  document.getElementById("crown-value").textContent =
    document.getElementById("crown-slider").value + " m";

  // FAVORIETENFILTER UIT BIJ START
  document.getElementById("favorites-toggle").classList.remove("active");

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

  listBtn.addEventListener("click", () => {
    listView.style.display = "block";
    mapView.style.display = "none";

    listBtn.classList.add("active");
    mapBtn.classList.remove("active");
  });

  mapBtn.addEventListener("click", () => {
    listView.style.display = "none";
    mapView.style.display = "block";

    mapBtn.classList.add("active");
    listBtn.classList.remove("active");
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
      populateStatusFilter();
      populateRarityFilter();
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

/* ----------------------------------------------------
   START
---------------------------------------------------- */
setupViewSwitch();
setupLanguageSwitch();
setupFilters();
initApp();
