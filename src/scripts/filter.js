/* ----------------------------------------------------
   IMPORTS
---------------------------------------------------- */
import { allTrees, currentLanguage, userLat, userLon } from "./app.js";
import { favorites, resetFavorites } from "./favorites.js";
import { rarityLabels } from "./utils.js";
import { renderTreeList } from "./render.js";
import { renderMarkers } from "./map.js";
import noUiSlider from "nouislider";
import "nouislider/dist/nouislider.css";

let girthSlider;
let crownSlider;

/* ----------------------------------------------------
   GENUS LABELS
---------------------------------------------------- */
const genusLabels = {
  Quercus: { nl: "Eiken", fr: "Chênes" },
  Fagus:   { nl: "Beuken", fr: "Hêtres" },
  Acer:    { nl: "Esdoorns", fr: "Érables" },
  Tilia:   { nl: "Lindes", fr: "Tilleuls" },
  Platanus:{ nl: "Platanen", fr: "Platanes" }
};

function distance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ----------------------------------------------------
   APPLY FILTERS
---------------------------------------------------- */
function applyFilters() {
  const statusValue = document.getElementById("status-filter").value;
  const searchValue = document.getElementById("search-bar").value.toLowerCase();
  const rarityValue = document.getElementById("rarity-filter").value;

  let filtered = [...allTrees];

  /* STATUS */
  if (statusValue !== "all") {
    filtered = filtered.filter(tree => {
      return currentLanguage === "nl"
        ? tree.statuts_nl === statusValue
        : tree.statuts_fr === statusValue;
    });
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

  /* OMTREK — DUAL RANGE */
  if (girthSlider?.noUiSlider) {
    const [girthMinCm, girthMaxCm] = girthSlider.noUiSlider.get().map(Number);
    const girthMinM = girthMinCm / 100;
    const girthMaxM = girthMaxCm / 100;

    filtered = filtered.filter(tree => {
      const raw = tree.circonference;
      if (raw == null) return false;

      const girth = Number(String(raw).replace(",", "."));
      return !isNaN(girth) && girth >= girthMinM && girth <= girthMaxM;
    });
  }

  /* DIAMETER TOP — DUAL RANGE */
  if (crownSlider?.noUiSlider) {
    const [crownMin, crownMax] = crownSlider.noUiSlider.get().map(Number);

    filtered = filtered.filter(tree => {
      const raw = tree.diametre_cime;
      if (raw == null) return false;

      const crown = Number(String(raw).replace(",", "."));
      return !isNaN(crown) && crown >= crownMin && crown <= crownMax;
    });
  }

  /* FAVORIETEN */
  const favBtn = document.getElementById("favorites-toggle");
  const favOnly = favBtn.classList.contains("active");

  if (favOnly) {
    filtered = filtered.filter(tree => favorites.includes(tree.id_arbres_cms));
  }

  /* SPECIES DROPDOWN UPDATEN */
  renderSpeciesDropdown(filtered);

  /* SPECIES FILTER */
  const selectedSpecies = window.selectedSpecies || [];

  if (selectedSpecies.length > 0) {
    filtered = filtered.filter(tree => {
      const name = currentLanguage === "nl" ? tree.nom_nl : tree.nom_fr;
      return selectedSpecies.includes(name);
    });
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

  /* AFSTAND */
  const selectedRadius = Number(document.getElementById("distance-slider").value);

  if (userLat && userLon && selectedRadius > 0) {
    filtered = filtered.filter(tree => {
      const lat = tree.geo_point_2d.lat;
      const lon = tree.geo_point_2d.lon;

      const d = distance(userLat, userLon, lat, lon);
      return d <= selectedRadius;
    });
  }

  /* ⭐ UPDATE SLIDER VALUES IN UI — FIX VOOR UNDEFINED */

  // --- OMTREK ---
  if (girthSlider?.noUiSlider) {
    const girth = girthSlider.noUiSlider.get();

    if (!girth || girth[0] === undefined || girth[1] === undefined) {
      document.getElementById("girth-value").textContent = "0 – 600 cm";
    } else {
      document.getElementById("girth-value").textContent =
        `${Math.round(girth[0])} – ${Math.round(girth[1])} cm`;
    }
  }

  // --- DIAMETER TOP ---
  if (crownSlider?.noUiSlider) {
    const crown = crownSlider.noUiSlider.get();

    if (!crown || crown[0] === undefined || crown[1] === undefined) {
      document.getElementById("crown-value").textContent = "0 – 40 m";
    } else {
      document.getElementById("crown-value").textContent =
        `${Math.round(crown[0])} – ${Math.round(crown[1])} m`;
    }
  }

  /* RENDER */
  renderTreeList(filtered, currentLanguage, favorites);
  renderMarkers(filtered);
}


/* ----------------------------------------------------
   SETUP FILTERS
---------------------------------------------------- */
function setupFilters() {
  document.getElementById("status-filter").addEventListener("change", applyFilters);
  document.getElementById("search-bar").addEventListener("input", applyFilters);
  document.getElementById("rarity-filter").addEventListener("change", applyFilters);

  /* AFSTAND */
  const distanceSlider = document.getElementById("distance-slider");
  const distanceValue = document.getElementById("distance-value");

  distanceSlider.addEventListener("input", () => {
    distanceValue.textContent = distanceSlider.value + " m";
    applyFilters();
  });

  /* OMTREK — DUAL RANGE SLIDER */
  girthSlider = document.getElementById("girth-slider");
  crownSlider = document.getElementById("crown-slider");

  const girthValue = document.getElementById("girth-value");
  const crownValue = document.getElementById("crown-value");

  noUiSlider.create(girthSlider, {
    start: [0, 600],
    connect: true,
    range: {
      min: 0,
      max: 600
    },
    step: 10
  });

  girthSlider.noUiSlider.on("update", (values) => {
    const min = Math.round(values[0]);
    const max = Math.round(values[1]);
    girthValue.textContent = `${min} – ${max} cm`;
    applyFilters();
  });

  /* DIAMETER TOP — DUAL RANGE SLIDER */
  noUiSlider.create(crownSlider, {
    start: [0, 40],
    connect: true,
    range: {
      min: 0,
      max: 40
    },
    step: 1
  });

  crownSlider.noUiSlider.on("update", (values) => {
    const min = Math.round(values[0]);
    const max = Math.round(values[1]);
    crownValue.textContent = `${min} – ${max} m`;
    applyFilters();
  });

  /* FAVORIETEN */
  const favBtn = document.getElementById("favorites-toggle");
  favBtn.addEventListener("click", () => {
    favBtn.classList.toggle("active");
    applyFilters();
  });

  document.getElementById("favorites-reset").addEventListener("click", () => {
    resetFavorites();
    applyFilters();
  });

  /* SORTEREN */
  document.getElementById("sort-select").addEventListener("change", applyFilters);

  /* ⭐ INITIAL FALLBACK (alleen bij eerste load nodig) */
  document.getElementById("girth-value").textContent = "0 – 600 cm";
  document.getElementById("crown-value").textContent = "0 – 40 m";
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
    opt.value = currentLanguage === "nl"
      ? allTrees.find(t => t.statuts_fr === statusFr)?.statuts_nl || statusFr
      : statusFr;

    opt.textContent = opt.value;
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
   CUSTOM SPECIES DROPDOWN
---------------------------------------------------- */
function renderSpeciesDropdown(filtered) {
  const dropdown = document.getElementById("species-dropdown");
  const selectedBox = dropdown.querySelector(".species-selected");
  const optionsBox = dropdown.querySelector(".species-options");

  const lang = currentLanguage;
  const selectedSpecies = new Set(window.selectedSpecies || []);

  optionsBox.innerHTML = "";

  const groups = {};

  filtered.forEach(tree => {
    const genus = tree.nom_la?.split(" ")[0];
    if (!genus) return;

    const name = lang === "nl" ? tree.nom_nl : tree.nom_fr;

    if (!groups[genus]) groups[genus] = {};
    if (!groups[genus][name]) groups[genus][name] = 0;

    groups[genus][name]++;
  });

  Object.entries(groups).forEach(([genus, species]) => {
    const label = document.createElement("div");
    label.className = "group-label";
    label.textContent = genusLabels[genus]?.[lang] || genus;
    optionsBox.appendChild(label);

    Object.entries(species).forEach(([name, count]) => {
      const row = document.createElement("label");
      row.className = "option";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = name;
      checkbox.checked = selectedSpecies.has(name);

      checkbox.addEventListener("change", () => {
        if (checkbox.checked) selectedSpecies.add(name);
        else selectedSpecies.delete(name);

        window.selectedSpecies = [...selectedSpecies];
        applyFilters();
      });

      row.appendChild(checkbox);
      row.append(`${name} (${count})`);
      optionsBox.appendChild(row);
    });
  });

  if (selectedSpecies.size === 0) {
    selectedBox.textContent = lang === "nl" ? "Soort (alle)" : "Espèce (toutes)";
  } else {
    selectedBox.textContent = [...selectedSpecies].join(", ");
  }

  selectedBox.onclick = () => {
    optionsBox.style.display =
      optionsBox.style.display === "block" ? "none" : "block";
  };

  document.addEventListener("click", e => {
    if (!dropdown.contains(e.target)) {
      optionsBox.style.display = "none";
    }
  });
}

/* ----------------------------------------------------
   RESET FILTERS
---------------------------------------------------- */
document.getElementById("reset-filters").addEventListener("click", resetAllFilters);

export function resetAllFilters() {
  const search = document.getElementById("search-bar");
  if (search) search.value = "";

  const status = document.getElementById("status-filter");
  if (status) status.value = "all";

  const rarity = document.getElementById("rarity-filter");
  if (rarity) rarity.value = "all";

  window.selectedSpecies = [];

  // dual sliders via noUiSlider resetten
  if (girthSlider?.noUiSlider) {
    girthSlider.noUiSlider.set([0, 600]);
    const girthValue = document.getElementById("girth-value");
    if (girthValue) girthValue.textContent = "0 – 600 cm";
  }

  if (crownSlider?.noUiSlider) {
    crownSlider.noUiSlider.set([0, 40]);
    const crownValue = document.getElementById("crown-value");
    if (crownValue) crownValue.textContent = "0 – 40 m";
  }

  const distanceSlider = document.getElementById("distance-slider");
  const distanceValue = document.getElementById("distance-value");
  if (distanceSlider && distanceValue) {
    distanceSlider.value = 0;
    distanceValue.textContent = "0 m";
  }

  const favToggle = document.getElementById("favorites-toggle");
  if (favToggle) favToggle.classList.remove("active");

  applyFilters();
}

/* ----------------------------------------------------
   EXPORTS
---------------------------------------------------- */
export {
  applyFilters,
  setupFilters,
  populateStatusFilter,
  populateRarityFilter
};
