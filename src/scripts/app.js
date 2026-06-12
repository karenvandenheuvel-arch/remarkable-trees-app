'use strict';

import { fetchTrees } from './api.js';
import { renderTreeList } from './render.js';
import { translations } from './utils.js';


let currentLanguage = "nl";
let allTrees = [];

export async function initApp() {
    allTrees = await fetchTrees();
     updateViewSwitchLabels();
    renderTreeList(allTrees, currentLanguage);
}

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

function setupLanguageSwitch() {
    const buttons = document.querySelectorAll(".lang-btn");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            currentLanguage = btn.dataset.lang;

            // active class wisselen
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            updateViewSwitchLabels();
            // lijst opnieuw renderen

            renderTreeList(allTrees, currentLanguage);
        });
    });
}

function updateViewSwitchLabels() {
    document.getElementById("view-list").textContent = translations[currentLanguage].list;
    document.getElementById("view-map").textContent = translations[currentLanguage].map;
}



setupViewSwitch();
setupLanguageSwitch();
initApp();
