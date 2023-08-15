import requests
import json
from pathlib import Path

overpass_url = "https://overpass-api.de/api/interpreter"

editor_dir = Path(__file__).resolve().parent
project_dir = editor_dir.parent
cache_dir = project_dir.joinpath("cache")
ways_dir = project_dir.joinpath("ways")
relations_dir = project_dir.joinpath("relations")
scripts_dir = project_dir.joinpath("scripts")

cache_dir.mkdir(exist_ok=True)


def process_trails(query_path, dest_path, elevation_function):
    osm = fetch_osm(query_path)
    process_osm(osm, elevation_function)
    save_osm(dest_path, osm)


def save_osm(dest_path, osm):
    with open(dest_path, 'w') as dest:
        json.dump(osm, dest)


def process_osm(osm, elevation_function):
    for element in osm['elements']:
        print(f"Processing {element['type']} {element['id']}")
        for point in element['geometry']:
            point['elev'] = elevation_function((point['lon'], point['lat']))


def fetch_osm(query_path):
    with open(query_path, 'r') as query_file:
        query = query_file.read().strip()
        print("Read overpass query")

        system_name = Path(query_path).stem

        # cache_path = str(query_path) + ".cache"
        response_cache = cache_dir.joinpath(system_name+".response.cache")
        query_cache = cache_dir.joinpath(system_name+".query.cache")

        open(response_cache, 'a+')
        open(query_cache, 'a+')

        with open(response_cache, 'r') as last_response_file:
            with open(query_cache, 'r') as last_query_file:
                last_query = last_query_file.read().strip()
                if last_query == query:
                    print("Query has not changed, returning cached response")
                    return json.load(last_response_file)

                print("New query, requesting from overpass api")
                r = requests.post(overpass_url, data=query)
                j = r.json()
                print("Overpass api request successful")

                with open(query_cache, 'w') as lqw:
                    lqw.write(query)
                with open(response_cache, 'w') as lrw:
                    lrw.write(r.text)
                return j
