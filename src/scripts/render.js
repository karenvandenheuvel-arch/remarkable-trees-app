'use strict';

import { translations } from './utils.js';

export function renderTreeList(trees, lang = "nl") {
  const list = document.getElementById("list-view");
  list.innerHTML = "";

  trees.forEach(tree => {
    const card = createTreeCard(tree, lang);
    list.appendChild(card);
  });
}

export function createTreeCard(tree, lang = "nl") {
  const card = document.createElement("div");
  card.classList.add("tree-card");

  // FOTO
  const img = document.createElement("img");
  img.src = tree.firstimage || "https://via.placeholder.com/150";
  img.alt = tree.nom_fr;
  img.onerror = () => {
    img.src = "https://via.placeholder.com/150";
  };

  // NAAM
  const name = document.createElement("h3");
  name.textContent = lang === "nl" ? tree.nom_nl : tree.nom_fr;

  // LATIJNSE NAAM
  const latin = document.createElement("p");
  latin.textContent = tree.nom_la;

  // OMTREK
  const cir = document.createElement("p");
  cir.textContent = `${translations[lang].girth}: ${tree.circonference || "?"} cm`;

  // KRUINDIAMETER
  const dia = document.createElement("p");
  dia.textContent = `${translations[lang].crown}: ${tree.diametre_cime || "?"} m`;

  // LINK
  const link = document.createElement("a");
  link.href = lang === "nl" ? tree.url_nl : tree.url_fr;
  link.target = "_blank";
  link.classList.add("detail-link");
  link.textContent = translations[lang].more;

  // FAVORIET-KNOP (JOUW EXACTE SVG)
  const fav = document.createElement("button");
  fav.classList.add("fav-btn");

  // OUTLINE (standaard)
  fav.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" class="tree-icon outline">
      <path d="M200-80v-80h240v-160h-80q-83 0-141.5-58.5T160-520q0-60 33-110.5t89-73.5q9-75 65.5-125.5T480-880q76 0 132.5 50.5T678-704q56 23 89 73.5T800-520q0 83-58.5 141.5T600-320h-80v160h240v80H200Zm160-320h240q50 0 85-35t35-85q0-36-20.5-66T646-630l-42-18-6-46q-6-45-39.5-75.5T480-800q-45 0-78.5 30.5T362-694l-6 46-42 18q-33 14-53.5 44T240-520q0 50 35 85t85 35Z"
            fill="none"
            stroke="currentColor"
            stroke-width="60"/>
    </svg>
  `;

  // KLIK → FILLED
  fav.addEventListener("click", () => {
    const active = fav.classList.toggle("active");

    fav.innerHTML = active
      ? `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" class="tree-icon filled">
          <path d="M200-80v-80h240v-160h-80q-83 0-141.5-58.5T160-520q0-60 33-110.5t89-73.5q9-75 65.5-125.5T480-880q76 0 132.5 50.5T678-704q56 23 89 73.5T800-520q0 83-58.5 141.5T600-320h-80v160h240v80H200Zm160-320h240q50 0 85-35t35-85q0-36-20.5-66T646-630l-42-18-6-46q-6-45-39.5-75.5T480-800q-45 0-78.5 30.5T362-694l-6 46-42 18q-33 14-53.5 44T240-520q0 50 35 85t85 35Z"
                fill="currentColor"/>
        </svg>
      `
      : `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" class="tree-icon outline">
          <path d="M200-80v-80h240v-160h-80q-83 0-141.5-58.5T160-520q0-60 33-110.5t89-73.5q9-75 65.5-125.5T480-880q76 0 132.5 50.5T678-704q56 23 89 73.5T800-520q0 83-58.5 141.5T600-320h-80v160h240v80H200Zm160-320h240q50 0 85-35t35-85q0-36-20.5-66T646-630l-42-18-6-46q-6-45-39.5-75.5T480-800q-45 0-78.5 30.5T362-694l-6 46-42 18q-33 14-53.5 44T240-520q0 50 35 85t85 35Z"
                fill="none"
                stroke="currentColor"
                stroke-width="60"/>
        </svg>
      `;
  });

  // OPBOUW
  card.appendChild(fav);
  card.appendChild(img);
  card.appendChild(name);
  card.appendChild(latin);
  card.appendChild(cir);
  card.appendChild(dia);
  card.appendChild(link);

  return card;
}


