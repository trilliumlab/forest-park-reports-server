/*
This Overpass query fetches all paths within forest park
*/

[out:json];
relation(1760140);
map_to_area;
(
  (
    way[highway=path](area);
    way[highway=footway](area);
    way["RLIS:systemname"="Linnton Park Trails"];
    way["RLIS:systemname"="Macleay Park Trails"];
    way["RLIS:systemname"="Ridge Trail"];
    way["RLIS:systemname"="Holman Property Trails"];
    way(449538957);
    way(113897534);
    // Wildwood trails outside of forest park
    way(125433416);
    way(149061058);
    way(149061059);
    way(741577920);
    way(739476981);
    way(739476983);
    way(739476984);
    way(135479075);
    way(135479074);
    way(113897578);
    way(113897350);
    way(113897600);
    way(113897568);
    way(113897074);
    way(113897248);
    way(135806554);
    way(784369300);
    way(113897159);
    way(541810344);
    way(113897079);
  );
  -
  (
    way(165474130);
    way(114741001);
    way(113897056);
    way(113897525);
    way(1055485242);
    way(113897611);
    way(113897504);
    way(130915104);
    way(115915123);
    way(129727827);
    way(115915124);
    way(449155367);
    way(149081455);
  );
);
out geom;
