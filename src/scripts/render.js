'use strict';

import { translations } from './utils.js';
import { toggleFavorite } from './app.js';

/* ----------------------------------------------------
   RENDER LIST
---------------------------------------------------- */
export function renderTreeList(trees, lang = "nl", favorites = []) {
  const list = document.getElementById("list-view");
  list.innerHTML = "";

  trees.forEach(tree => {
    const card = createTreeCard(tree, lang, favorites);
    list.appendChild(card);
  });
}

/* ----------------------------------------------------
   CREATE TREE CARD
---------------------------------------------------- */
export function createTreeCard(tree, lang = "nl", favorites = []) {
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
  const img = document.createElement("img");
  const hasImage = Boolean(tree.firstimage);

  img.src = hasImage ? tree.firstimage : placeholder;
  img.alt = hasImage ? tree.nom_fr : "";

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
  fav.addEventListener("click", () => {
    toggleFavorite(treeId);
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
  link.href = lang === "nl" ? tree.url_nl : tree.url_fr;
  link.target = "_blank";
  link.classList.add("detail-link");
  link.textContent = translations[lang].more;

  /* ---------------- OPBOUW ---------------- */
  card.appendChild(imgWrapper);
  card.appendChild(name);
  card.appendChild(latin);
  card.appendChild(cir);
  card.appendChild(dia);
  card.appendChild(link);

  return card;
}
