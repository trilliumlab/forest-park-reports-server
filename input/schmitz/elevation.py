import rasterio as rio
from pathlib import Path

src = rio.open(Path(__file__).resolve().parent.parent.joinpath('seattle.tif'))
band = src.read(1)


def get_elevation(coords):
    x, y = coords
    row, col = rio.transform.rowcol(src.transform, [x], [y])
    return band[row[0]][col[0]] * 0.3048
