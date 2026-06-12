'use strict';

export async function fetchTrees() {
  const baseUrl = "https://opendata.brussels.be/api/explore/v2.1/catalog/datasets/bruxelles_arbres_remarquables/records";
  const limit = 100;
  let offset = 0;
  let allTrees = [];

  try {
    while (true) {
      const url = `${baseUrl}?limit=${limit}&offset=${offset}`;
      console.log("Fetching:", url);

      const response = await fetch(url);
      const data = await response.json();

      const trees = data.results;
      allTrees = allTrees.concat(trees);

      if (trees.length < limit) break;

      offset += limit;
    }

    console.log("Totaal aantal bomen:", allTrees.length);
    return allTrees;

  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}
