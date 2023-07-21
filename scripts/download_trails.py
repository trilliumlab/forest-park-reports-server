import argparse
import requests
import json
from pathlib import Path

overpass_url = "https://overpass-api.de/api/interpreter"

script_dir = Path(__file__).resolve().parent


parser = argparse.ArgumentParser()
parser.add_argument('-q', '--query', required=True)
parser.add_argument('-e', '--elevation')
args = parser.parse_args()


def fetch_osm():
    with open(args.query, 'r') as query_file:
        query = query_file.read().strip()
        print("Read overpass query")

        open(script_dir.joinpath('.last_response'), 'a+')
        open(script_dir.joinpath('.last_query'), 'a+')

        with open(script_dir.joinpath('.last_response'), 'r+') as last_response_file:
            with open(script_dir.joinpath('.last_query'), 'r+') as last_query_file:
                last_query = last_query_file.read().strip()
                if last_query == query:
                    print("Query has not changed, returning cached response")
                    return json.load(last_response_file)

                print("New query, requesting from overpass api")
                r = requests.post(overpass_url, data=query)
                j = r.json()
                print("Overpass api request successful")

                last_query_file.write(query)
                last_response_file.write(r.text)
                return j


osm = fetch_osm()
print("FETCHED OSM")

# osm = r.json()
# for key in osm.keys():
# print(key)
# print(osm['version'])
# print(osm['generator'])
# print(osm['osm3s'])
