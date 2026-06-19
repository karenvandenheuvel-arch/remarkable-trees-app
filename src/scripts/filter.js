/* ----------------------------------------------------
   IMPORTS
---------------------------------------------------- */
import { allTrees, currentLanguage } from "./app.js";
import { favorites, resetFavorites } from "./favorites.js";
import { rarityLabels } from "./utils.js";
import { renderTreeList } from "./render.js";
import { renderMarkers } from "./map.js";

/* ----------------------------------------------------
   APPLY FILTER
---------------------------------------------------- */
function applyFilters() {
  const statusValue = document.getElementById("status-filter").value;
  const searchValue = document.getElementById("search-bar").value.toLowerCase();
  const rarityValue = document.getElementById("rarity-filter").value;

  let filtered = [...allTrees];

  /* STATUS */
  if (statusValue !== "all") {
    filtered = filtered.filter(tree => tree.statuts_fr === statusValue);
  }

  /* ZOEKEN */
  if (searchValue.trim() !== "") {
    filtered = filtered.filter(tree =>
      tree.nom_nl.toLowerCase().includes(searchValue) ||
      tree.nom_fr.toLowerCase().includes(searchValue)
    );
  }

  /* ZELDZAAMHEID */
  if (rarityValue !== "all") {
    filtered = filtered.filter(tree => String(tree.rarete) === rarityValue);
  }

  /* SLIDERS */
  const girthSliderValue = Number(document.getElementById("girth-slider").value);
  const crownMin = Number(document.getElementById("crown-slider").value);

  // OMTREK (cm → m)
  if (girthSliderValue > 0) {
    const girthMinMeters = girthSliderValue / 100;
    filtered = filtered.filter(tree => {
      const girth = Number(tree.circonference);
      return !isNaN(girth) && girth >= girthMinMeters;
    });
  }

  // KRUINDIAMETER
  if (crownMin > 0) {
    filtered = filtered.filter(tree => {
      const crown = Number(tree.diametre_cime);
      return !isNaN(crown) && crown >= crownMin;
    });
  }

  /* FAVORIETEN */
  const favBtn = document.getElementById("favorites-toggle");
  const favOnly = favBtn.classList.contains("active");

  if (favOnly) {
    filtered = filtered.filter(tree => favorites.includes(tree.id_arbres_cms));
  }

  /* SORTEREN */
  const sortValue = document.getElementById("sort-select").value;

  filtered.sort((a, b) => {
    switch (sortValue) {
      case "name-asc": {
        const nameA = (currentLanguage === "nl" ? a.nom_nl : a.nom_fr) || "";
        const nameB = (currentLanguage === "nl" ? b.nom_nl : b.nom_fr) || "";
        return nameA.localeCompare(nameB);
      }

      case "name-desc": {
        const nameA = (currentLanguage === "nl" ? a.nom_nl : a.nom_fr) || "";
        const nameB = (currentLanguage === "nl" ? b.nom_nl : b.nom_fr) || "";
        return nameB.localeCompare(nameA);
      }

      case "girth-desc":
        return (Number(b.circonference) || 0) - (Number(a.circonference) || 0);

      case "girth-asc":
        return (Number(a.circonference) || 0) - (Number(b.circonference) || 0);

      case "crown-desc":
        return (Number(b.diametre_cime) || 0) - (Number(a.diametre_cime) || 0);

      case "crown-asc":
        return (Number(a.diametre_cime) || 0) - (Number(b.diametre_cime) || 0);

      default:
        return 0;
    }
  });

  renderTreeList(filtered, currentLanguage, favorites);
  renderMarkers(filtered);
  
}

/* ----------------------------------------------------
   FILTER SETUP
---------------------------------------------------- */
function setupFilters() {
  document.getElementById("status-filter").addEventListener("change", applyFilters);
  document.getElementById("search-bar").addEventListener("input", applyFilters);
  document.getElementById("rarity-filter").addEventListener("change", applyFilters);

  /* SLIDERS */
  const girthSlider = document.getElementById("girth-slider");
  const girthValue = document.getElementById("girth-value");

  girthSlider.addEventListener("input", () => {
    girthValue.textContent = girthSlider.value + " cm";
    applyFilters();
  });

  const crownSlider = document.getElementById("crown-slider");
  const crownValue = document.getElementById("crown-value");

  crownSlider.addEventListener("input", () => {
    crownValue.textContent = crownSlider.value + " m";
    applyFilters();
  });

  // INITIËLE WAARDES
  girthValue.textContent = girthSlider.value + " cm";
  crownValue.textContent = crownSlider.value + " m";

  /* FAVORIETEN */
  const favBtn = document.getElementById("favorites-toggle");
  favBtn.addEventListener("click", () => {
    favBtn.classList.toggle("active");
    applyFilters();
  });

  document.getElementById("favorites-reset").addEventListener("click", () => {
    resetFavorites();
  });

  document.getElementById("sort-select").addEventListener("change", applyFilters);
}

/* ----------------------------------------------------
   STATUS FILTER
---------------------------------------------------- */
function populateStatusFilter() {
  const select = document.getElementById("status-filter");
  select.innerHTML = `<option value="all">${currentLanguage === "nl" ? "Alle" : "Tous"}</option>`;

  const statuses = [...new Set(allTrees.map(t => t.statuts_fr).filter(Boolean))].sort();

  statuses.forEach(statusFr => {
    const opt = document.createElement("option");
    opt.value = statusFr;

    const label =
      currentLanguage === "nl"
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

  const rarities = [...new Set(allTrees.map(t => t.rarete).filter(Boolean))].sort((a, b) => a - b);

  rarities.forEach(rarity => {
    const opt = document.createElement("option");
    opt.value = rarity;
    opt.textContent = rarityLabels[currentLanguage][rarity] || rarity;
    select.appendChild(opt);
  });
}

/* ----------------------------------------------------
   RESET FILTER
---------------------------------------------------- */

document.getElementById("reset-filters").addEventListener("click", resetAllFilters);
export function resetAllFilters() {

  // ⭐ Zoekveld resetten
  const search = document.getElementById("search-bar");
  if (search) search.value = "";

  // ⭐ Dropdowns resetten
  const status = document.getElementById("status-filter");
  if (status) status.value = "all";

  const rarity = document.getElementById("rarity-filter");
  if (rarity) rarity.value = "all";

  // ⭐ Omtrek slider resetten
  const girthSlider = document.getElementById("girth-slider");
  const girthValue = document.getElementById("girth-value");
  if (girthSlider && girthValue) {
    girthSlider.value = 0;
    girthValue.textContent = "0 cm";
  }

  // ⭐ Diameter slider resetten
  const crownSlider = document.getElementById("crown-slider");
  const crownValue = document.getElementById("crown-value");
  if (crownSlider && crownValue) {
    crownSlider.value = 0;
    crownValue.textContent = "0 m";
  }

  // ⭐ Favorieten‑toggle UIT zetten (maar favorieten NIET wissen!)
  const favToggle = document.getElementById("favorites-only");
  if (favToggle) favToggle.checked = false;

  // ⭐ Filters opnieuw toepassen
  applyFilters();
}



/* ----------------------------------------------------
   SORT LABELS
---------------------------------------------------- */
function updateSortLabels() {
  const select = document.getElementById("sort-select");

  const labels = {
    nl: {
      "name-asc": "Naam (A → Z)",
      "name-desc": "Naam (Z → A)",
      "girth-desc": "Omtrek (groot → klein)",
      "girth-asc": "Omtrek (klein → groot)",
      "crown-desc": "Kruin (groot → klein)",
      "crown-asc": "Kruin (klein → groot)"
    },
    fr: {
      "name-asc": "Nom (A → Z)",
      "name-desc": "Nom (Z → A)",
      "girth-desc": "Circonférence (grand → petit)",
      "girth-asc": "Circonférence (petit → grand)",
      "crown-desc": "Couronne (grand → petit)",
      "crown-asc": "Couronne (petit → grand)"
    }
  };

  const currentValue = select.value;

  select.innerHTML = "";

  Object.entries(labels[currentLanguage]).forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  });

  select.value = currentValue || "name-asc";
}

/* ----------------------------------------------------
   EXPORTS
---------------------------------------------------- */
export {
  applyFilters,
  setupFilters,
  populateStatusFilter,
  populateRarityFilter,
  updateSortLabels
};
