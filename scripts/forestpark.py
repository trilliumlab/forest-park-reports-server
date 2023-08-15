import rasterio as rio
from pathlib import Path

script_dir = Path(__file__).resolve().parent

src = rio.open('../data/forestpark_full.tif')
band = src.read(1)


def get_elevation(coords):
    x, y = coords
    row, col = rio.transform.rowcol(src.transform, [x], [y])
    return band[row[0]][col[0]] * 0.3048


# query_path = script_dir.joinpath("fptrails.overpassql")
# dest_path = script_dir.parent.joinpath("trails").joinpath("fptrails.json")
# trail_processor.process_trails(query_path, dest_path, find_elevation)
