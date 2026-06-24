/* ----------------------------------------------------
   IMPORTS
---------------------------------------------------- */
import { allTrees, currentLanguage } from "./app.js";
import { favorites, resetFavorites } from "./favorites.js";
import { rarityLabels } from "./utils.js";
import { renderTreeList } from "./render.js";
import { renderMarkers } from "./map.js";

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

  /* ⭐ UPDATE SPECIES DROPDOWN (op basis van ALLE filters behalve species) */
  renderSpeciesDropdown(filtered);

  /* ⭐ SPECIES FILTER */
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
    applyFilters();
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

  // huidige selectie
  const selectedSpecies = new Set(window.selectedSpecies || []);

  // dropdown leegmaken
  optionsBox.innerHTML = "";

  // groeperen per genus
  const groups = {};

  filtered.forEach(tree => {
    const genus = tree.nom_la?.split(" ")[0];
    if (!genus) return;

    const name = lang === "nl" ? tree.nom_nl : tree.nom_fr;

    if (!groups[genus]) groups[genus] = {};
    if (!groups[genus][name]) groups[genus][name] = 0;

    groups[genus][name]++;
  });

  // opbouwen
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

  // label updaten
  if (selectedSpecies.size === 0) {
    selectedBox.textContent = lang === "nl" ? "Soort (alle)" : "Espèce (toutes)";
  } else {
    selectedBox.textContent = [...selectedSpecies].join(", ");
  }

  // open/dicht togglen
  selectedBox.onclick = () => {
    optionsBox.style.display =
      optionsBox.style.display === "block" ? "none" : "block";
  };

  // sluiten bij klik buiten
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

  // Zoekveld resetten
  const search = document.getElementById("search-bar");
  if (search) search.value = "";

  // Dropdowns resetten
  const status = document.getElementById("status-filter");
  if (status) status.value = "all";

  const rarity = document.getElementById("rarity-filter");
  if (rarity) rarity.value = "all";

  // Species resetten
  window.selectedSpecies = [];

  // Sliders resetten
  const girthSlider = document.getElementById("girth-slider");
  const girthValue = document.getElementById("girth-value");
  if (girthSlider && girthValue) {
    girthSlider.value = 0;
    girthValue.textContent = "0 cm";
  }

  const crownSlider = document.getElementById("crown-slider");
  const crownValue = document.getElementById("crown-value");
  if (crownSlider && crownValue) {
    crownSlider.value = 0;
    crownValue.textContent = "0 m";
  }

  // Favorieten toggle UIT
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
