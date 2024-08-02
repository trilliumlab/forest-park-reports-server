/*
This Overpass query fetches all paths in the bald hill / mulkey creek / fitton green / crestmont areas
*/

[out:json];
(
  // Bald hill natural area
  way(794243597);
  // Bald hill farm
  way(794243584);
  // Fitton green natural area
  way(299174633);
  // Crestmont
  way(794243583);
);
map_to_area;
(
  (
    way[highway~"path|cycleway|track"](area);
    // Cardwell-Fitton connection
    way(132889555);
  ); - (
    way(939459224);
  );
);
out geom;
