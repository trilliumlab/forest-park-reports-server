/*
This Overpass query fetches all paths in Schmitz park
*/

[out:json];
(
  // Schmitz Preserve Park
  way(32401639);
);
map_to_area;
(
  (
    way[highway~"footway|steps"](area);
    way(204190754);
    way(204190761);
  ); - (
  	way(216673332);
    way(1216945456);
    way(102852477);
    way(1217266000);
  );
);
out geom;
