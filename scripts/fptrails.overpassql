/*
This Overpass query fetches all paths within forest park
*/

[out:json];
relation(1760140);
map_to_area;
(
  way[highway=path](area);
  way[highway=footway](area);
  way["RLIS:systemname"="Linnton Park Trails"];
  way["RLIS:systemname"="Macleay Park Trails"];
  way["RLIS:systemname"="Ridge Trail"];
  way(449538957);
  way(113897534);
);
out geom;
