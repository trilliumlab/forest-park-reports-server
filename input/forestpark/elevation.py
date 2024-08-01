import rasterio as rio

src = rio.open('../input/forestpark_full.tif')
band = src.read(1)


def get_elevation(coords):
    x, y = coords
    row, col = rio.transform.rowcol(src.transform, [x], [y])
    return band[row[0]][col[0]] * 0.3048
