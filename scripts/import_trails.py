import os
import sys
from pathlib import Path
import shutil
import uuid
import json
# pip install psycopg[binary]
import psycopg

if len(sys.argv) != 2:
    print("Missing required argument: GPX input path")
    exit()

if input("Running this script will overwrite trails. Proceed? (y/n)\n").lower() == "n":
    print("Okay, exiting")
    exit()

input_dir = Path(sys.argv[1])
script_dir = Path(__file__).resolve().parent
root_dir = script_dir.parent
trails_dir = root_dir.joinpath("trails")

# loading config file
with open(root_dir.joinpath("config.json")) as f:
    config = json.load(f)

# connect to pgsql
conn = psycopg.connect(config["database"]["url"])
conn.cursor().execute("set application_name = 'Forest Park Trail Importer'")

conn.cursor().execute("""CREATE TABLE IF NOT EXISTS public.trail_info (
    uuid uuid NOT NULL,
    name text NOT NULL,
    PRIMARY KEY (uuid)
);""")

conn.commit()

for file in input_dir.glob('*.gpx'):
    trail_name = file.name[:-4]
    # assign each trail an uuid based off the name
    # because we use uuid5 which is a hash as long as the name doesn't change, the same uuid will be generated
    trail_uuid = uuid.uuid5(uuid.NAMESPACE_URL, trail_name)

    trail_file = trails_dir.joinpath(str(trail_uuid)+".gpx")

    # Create the trail if doesn't exist
    if not os.path.exists(trail_file):
        shutil.copy(file, trail_file)

    # add metadata to database
    cur = conn.cursor()
    cur.execute("INSERT INTO public.trail_info (uuid, name) VALUES (%s, %s)", (trail_uuid, trail_name))

conn.commit()
