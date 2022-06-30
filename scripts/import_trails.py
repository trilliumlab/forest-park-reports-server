import os
import sys
from pathlib import Path
import shutil
import uuid
import json

if len(sys.argv) != 2:
    print("Missing required argument: GPX input path")
    exit()

overwrite = input("Would you like to overwrite trails (y/n)\n").lower() == "y"

input_dir = Path(sys.argv[1])
script_dir = Path(__file__).resolve().parent
trails_dir = Path(script_dir).parent.joinpath("trails")

for file in input_dir.glob('*.gpx'):
    trail_name = file.name[:-4]
    # assign each trail an uuid based off the name
    # because we use uuid5 which is a hash as long as the name doesn't change, the same uuid will be generated
    trail_uuid = uuid.uuid5(uuid.NAMESPACE_URL, trail_name)

    trail_dir = trails_dir.joinpath(str(trail_uuid))

    # Create the directory if it doesn't exist and copy if directory didn't previously exist or overwrite selected
    exists = os.path.exists(trail_dir)
    if not exists or overwrite:
        if not exists:
            os.makedirs(trail_dir)
        # write json
        with open(trail_dir.joinpath("trail.json"), 'w') as f:
            json.dump({"name": trail_name, "uuid": str(trail_uuid)}, f)
        # copy gpx
        shutil.copy(file, trail_dir.joinpath("trail.gpx"))
