'use strict';

import { translations } from './utils.js';
import { toggleFavorite } from './favorites.js';
import { initLazyLoading } from "./app.js";


/* ----------------------------------------------------
   RENDER LIST
---------------------------------------------------- */
export function renderTreeList(trees, lang = "nl", favorites = []) {
  const list = document.getElementById("list-view");
  list.innerHTML = "";

  // ⭐ Geen resultaten → toon boodschap
  if (trees.length === 0) {
    const msg = document.createElement("p");
    msg.classList.add("no-results");
    msg.textContent =
      lang === "nl"
        ? "Geen bomen gevonden die aan je filters voldoen."
        : "Aucun arbre ne correspond à vos filtres.";
    list.appendChild(msg);
    return;
  }

  // ⭐ Wel resultaten → render cards
  trees.forEach(tree => {
    const card = createTreeCard(tree, lang, favorites, false);
    list.appendChild(card);
  });
  initLazyLoading();
  
}



/* ----------------------------------------------------
   CREATE TREE CARD
---------------------------------------------------- */
export function createTreeCard(tree, lang = "nl", favorites = [], fromMap = false) {

  const card = document.createElement("div");
  card.classList.add("tree-card");

  const treeId = tree.id_arbres_cms;
  const isFav = favorites.includes(treeId);

  /* ---------------- FOTO WRAPPER ---------------- */
  const imgWrapper = document.createElement("div");
  imgWrapper.classList.add("tree-image");

  /* ---------------- PLAATSHOUDER (boom silhouet) ---------------- */
  const placeholder =
    "data:image/svg+xml;utf8,\
    <svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300' preserveAspectRatio='xMidYMid slice'>\
      <rect width='400' height='300' rx='16' ry='16' fill='%23f2f2f2'/>\
      <path d='M200 40 L140 140 L165 140 L130 200 L165 200 L155 250 L245 250 L235 200 L270 200 L235 140 L260 140 Z' \
            fill='%23c7c7c7'/>\
    </svg>";

  /* ---------------- FOTO ELEMENT ---------------- */
/* ---------------- FOTO ELEMENT (LAZY) ---------------- */
const img = document.createElement("img");
const hasImage = Boolean(tree.firstimage);

// placeholder blijft zoals je hebt
img.src = placeholder;

// echte foto pas later laden
if (hasImage) {
  img.dataset.src = tree.firstimage;
}

img.alt = hasImage ? tree.nom_fr : "";
img.classList.add("lazy");


  imgWrapper.appendChild(img);

  /* ---------------- FAVORIET-KNOP ---------------- */
  const fav = document.createElement("button");
  fav.classList.add("fav-btn");
  if (isFav) fav.classList.add("active");

  // SVG afhankelijk van state
  fav.innerHTML = isFav
    ? `
      <svg viewBox="0 -960 960 960" class="tree-icon filled">
        <path d="M558-80H402v-160H120l160-240h-80l280-400 280 400h-80l160 240H558v160Z"
              fill="currentColor"/>
      </svg>
    `
    : `
      <svg viewBox="0 -960 960 960" class="tree-icon outline">
        <path d="M558-80H402v-160H120l160-240h-80l280-400 280 400h-80l160 240H558v160Z"
              fill="none"
              stroke="currentColor"
              stroke-width="60"
              stroke-linejoin="round"
              stroke-linecap="round"/>
      </svg>
    `;

  // KLIK → toggleFavorite (met localStorage)
fav.addEventListener("click", (e) => {
  e.stopPropagation();
  e.preventDefault();

  // ⭐ Bepaal nieuwe state op basis van UI, niet op basis van favorites[]
  const wasFav = fav.classList.contains("active");
  const newIsFav = !wasFav;

  toggleFavorite(treeId, !fromMap);

  // ⭐ UI live updaten
  if (newIsFav) {
    fav.classList.add("active");
    fav.innerHTML = `
      <svg viewBox="0 -960 960 960" class="tree-icon filled">
        <path d="M558-80H402v-160H120l160-240h-80l280-400 280 400h-80l160 240H558v160Z"
              fill="currentColor"/>
      </svg>
    `;
  } else {
    fav.classList.remove("active");
    fav.innerHTML = `
      <svg viewBox="0 -960 960 960" class="tree-icon outline">
        <path d="M558-80H402v-160H120l160-240h-80l280-400 280 400h-80l160 240H558v160Z"
              fill="none"
              stroke="currentColor"
              stroke-width="60"
              stroke-linejoin="round"
              stroke-linecap="round"/>
      </svg>
    `;
  }

  // ⭐ Popup opnieuw openen zodat nieuwe card nieuwe listener krijgt
  if (fromMap) {
    const popup = fav.closest(".leaflet-popup");
    if (popup && popup._source) {
      const marker = popup._source;
      marker.closePopup();
      marker.openPopup();
    }
  }
});



  imgWrapper.appendChild(fav);

  /* ---------------- TEKST ---------------- */
  const name = document.createElement("h3");
  name.textContent = lang === "nl" ? tree.nom_nl : tree.nom_fr;

  const latin = document.createElement("p");
  latin.textContent = tree.nom_la;

const cir = document.createElement("p");
cir.textContent = `${translations[lang].girth}: ${
  tree.circonference ? Math.round(tree.circonference * 100) : "?"
} cm`;

const dia = document.createElement("p");
dia.textContent = `${translations[lang].crown}: ${
  tree.diametre_cime ?? "?"
} m`;



  const link = document.createElement("a");
link.href = "#"; 
link.classList.add("detail-link");
link.textContent = translations[lang].more;

link.addEventListener("click", (e) => {
  e.preventDefault();
  renderDetailModal(tree, lang);
});




  /* ---------------- OPBOUW ---------------- */
  card.appendChild(imgWrapper);
  card.appendChild(name);
  card.appendChild(latin);
  card.appendChild(cir);
  card.appendChild(dia);
  card.appendChild(link);

  return card;
}

export function createTreeCardHTML(tree, lang = "nl", favorites = []) {
  const card = createTreeCard(tree, lang, favorites);
  return card.outerHTML;
}

export function renderDetailModal(tree, lang = "nl") {
  console.log("MODAL IMAGE:", tree.firstimage);

  console.log("Detail tree:", tree);
  console.log("firstimage:", tree.firstimage);
  const modal = document.getElementById("detail-modal");
  const content = document.getElementById("detail-content");

  // --- Placeholder (zelfde als in de lijstweergave) ---
  const placeholder =
    "data:image/svg+xml;utf8,\
    <svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300' preserveAspectRatio='xMidYMid slice'>\
      <rect width='400' height='300' rx='16' ry='16' fill='%23f2f2f2'/>\
      <path d='M200 40 L140 140 L165 140 L130 200 L165 200 L155 250 L245 250 L235 200 L270 200 L235 140 L260 140 Z' \
            fill='%23c7c7c7'/>\
    </svg>";

  // --- Foto bepalen ---
  const hasImage = Boolean(tree.firstimage);
  const imageSrc = hasImage ? tree.firstimage : placeholder;

  // --- Google Maps link ---
  const lat = tree.geo_point_2d?.lat;
  const lon = tree.geo_point_2d?.lon;
  const mapsUrl = lat && lon ? `https://www.google.com/maps?q=${lat},${lon}` : null;

  // --- Officiële heritage link ---
  const officialUrl = lang === "nl" ? tree.url_nl : tree.url_fr;

  // --- Veilige tekstvelden ---
  const name = lang === "nl" ? (tree.nom_nl || tree.nom_fr || "Onbekende boom") 
                             : (tree.nom_fr || tree.nom_nl || "Arbre inconnu");

  const status = lang === "nl" ? (tree.statuts_nl || "Onbekend") 
                               : (tree.statuts_fr || "Inconnu");

  const rarity = translations[lang].rarityLabels?.[tree.rarete] || tree.rarete || "-";

  const cepee = tree.cepee || "-";

  // --- HTML van de modal ---
  content.innerHTML = `
    <div class="detail-image">
      <img src="${imageSrc}" alt="${name}">
    </div>

    <h2>${name}</h2>

    <div class="info-row"><strong>${translations[lang].status}:</strong> ${status}</div>
    <div class="info-row"><strong>${translations[lang].rarity}:</strong> ${rarity}</div>
    <div class="info-row"><strong>${translations[lang].cepee}:</strong> ${cepee}</div>

    ${mapsUrl ? `<div class="info-row"><a href="${mapsUrl}" target="_blank">${translations[lang].viewOnMap}</a></div>` : ""}

    ${officialUrl ? `
      <div class="info-row">
        <a href="${officialUrl}" target="_blank">${translations[lang].official}</a>
      </div>` : ""}
  `;

  // --- Modal tonen ---
  modal.classList.remove("hidden");

  // --- Sluiten ---
  modal.querySelector(".detail-close").onclick = () => modal.classList.add("hidden");
  modal.querySelector(".detail-backdrop").onclick = () => modal.classList.add("hidden");
}
