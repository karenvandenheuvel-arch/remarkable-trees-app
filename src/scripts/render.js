'use strict';

export function renderTreeList(trees, lang = "nl") {
  const list = document.getElementById("list-view");
  list.innerHTML = "";

  trees.forEach(tree => {
    const card = createTreeCard(tree, lang);
    list.appendChild(card);
  });
}

import { translations } from './utils.js';

export function createTreeCard(tree, lang = "nl") {
  const card = document.createElement("div");
  card.classList.add("tree-card");

  // Foto
  const img = document.createElement("img");
  img.src = tree.firstimage || "https://via.placeholder.com/150";
  img.alt = tree.nom_fr;
  img.onerror = () => {
    img.src = "https://via.placeholder.com/150";
  };

  // Naam afhankelijk van taal
  const name = document.createElement("h3");
  name.textContent = lang === "nl" ? tree.nom_nl : tree.nom_fr;

  // Latijnse naam
  const latin = document.createElement("p");
  latin.textContent = tree.nom_la;

  // Status afhankelijk van taal
  const status = document.createElement("p");
  status.textContent = lang === "nl" ? tree.statuts_nl : tree.statuts_fr;

  // ⭐ Omtrek (vertaald)
  const cir = document.createElement("p");
  cir.textContent = `${translations[lang].girth}: ${tree.circonference || "?"} cm`;

  // ⭐ Kruindiameter (vertaald)
  const dia = document.createElement("p");
  dia.textContent = `${translations[lang].crown}: ${tree.diametre_cime || "?"} m`;

  // ⭐ Link naar detailpagina (vertaald)
  const link = document.createElement("a");
  link.href = lang === "nl" ? tree.url_nl : tree.url_fr;
  link.target = "_blank";
  link.classList.add("detail-link");
  link.textContent = translations[lang].more;

  // Favoriet
  const fav = document.createElement("button");
  fav.classList.add("fav-btn");
  fav.textContent = "⭐";

  // Opbouw
  card.appendChild(img);
  card.appendChild(name);
  card.appendChild(latin);
  card.appendChild(status);
  card.appendChild(cir);
  card.appendChild(dia);
  card.appendChild(link);
  card.appendChild(fav);

  return card;
}



