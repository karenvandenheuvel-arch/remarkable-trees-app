/* ----------------------------------------------------
   IMPORTS
---------------------------------------------------- */
import { applyFilters } from "./filter.js";

/* ----------------------------------------------------
   STATE
---------------------------------------------------- */
export const FAVORITES_KEY = "remarkableTreesFavorites";
export let favorites = [];

/* ----------------------------------------------------
   FAVORIETEN
---------------------------------------------------- */
export function loadFavorites() {
  const stored = localStorage.getItem(FAVORITES_KEY);
  favorites = stored ? JSON.parse(stored) : [];
}

export function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function toggleFavorite(treeId, shouldApplyFilters = true) {
  if (favorites.includes(treeId)) {
    favorites = favorites.filter(id => id !== treeId);
  } else {
    favorites.push(treeId);
  }

  saveFavorites();

  if (shouldApplyFilters) {
    applyFilters();
  }
}


export function resetFavorites() {
  favorites = [];
  saveFavorites();

  // toggle‑button uitzetten
  const favBtn = document.getElementById("favorites-toggle");
  favBtn.classList.remove("active");

  // lijst opnieuw renderen
  applyFilters();
}
