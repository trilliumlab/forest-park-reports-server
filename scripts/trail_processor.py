import requests
import json
from pathlib import Path

overpass_url = "https://overpass-api.de/api/interpreter"

script_dir = Path(__file__).resolve().parent


def process_trails(query_path, dest_path, elevation_function):
    osm = fetch_osm(query_path)
    process_osm(osm, elevation_function)
    with open(dest_path, 'w') as dest:
        json.dump(osm, dest)


def process_osm(osm, elevation_function):
    print("version: ", osm['version'])
    print("generator: ", osm['generator'])
    print("osm3s: ", osm['osm3s'])

    for element in osm['elements']:
        print(f"Processing {element['type']} {element['id']}")
        for point in element['geometry']:
            point['elev'] = elevation_function((point['lon'], point['lat']))


def fetch_osm(query_path):
    with open(query_path, 'r') as query_file:
        query = query_file.read().strip()
        print("Read overpass query")

        cache_path = str(query_path) + ".cache"

        open(script_dir.joinpath('.last_response'), 'a+')
        open(cache_path, 'a+')

        with open(script_dir.joinpath('.last_response'), 'r') as last_response_file:
            with open(cache_path, 'r') as last_query_file:
                last_query = last_query_file.read().strip()
                if last_query == query:
                    print("Query has not changed, returning cached response")
                    return json.load(last_response_file)

                print("New query, requesting from overpass api")
                r = requests.post(overpass_url, data=query)
                j = r.json()
                print("Overpass api request successful")

                with open(cache_path, 'w') as lqw:
                    lqw.write(query)
                with open(script_dir.joinpath('.last_response'), 'w') as lrw:
                    lrw.write(r.text)
                return j
