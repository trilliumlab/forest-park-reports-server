from customtkinter import *
from tkintermapview import TkinterMapView
from CTkListbox import *
from trail_processor import *

overpass_files = {item.stem: item for item in scripts_dir.iterdir() if item.is_file() and item.suffix == ".overpassql"}
elevation_scripts = {item.stem: item for item in scripts_dir.iterdir() if item.is_file() and item.suffix == ".py"}


class App(CTk):
    APP_NAME = "Trail Editor"
    WIDTH = 1280
    HEIGHT = 720

    PATH_COLOR = "#3E69CB"
    RELATION_COLOR = "#9b3fd1"
    SELECTED_COLOR = "#32a852"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.osm = None
        self.paths = set()
        self.selection = set()

        # App Window settings
        self.title(App.APP_NAME)
        self.geometry(str(App.WIDTH) + "x" + str(App.HEIGHT))
        self.minsize(App.WIDTH, App.HEIGHT)

        # Configure window closing
        self.protocol("WM_DELETE_WINDOW", self.on_closing)
        self.bind("<Command-q>", self.on_closing)
        self.bind("<Command-w>", self.on_closing)
        self.createcommand('tk::mac::Quit', self.on_closing)

        # Create three CTkFrames
        self.grid_columnconfigure(0, weight=0)
        self.grid_columnconfigure(1, weight=1)
        self.grid_columnconfigure(2, weight=0)
        self.grid_rowconfigure(0, weight=1)

        self.frame_left = CTkFrame(master=self, corner_radius=0, fg_color="transparent")
        self.frame_left.grid(row=0, column=0, padx=0, pady=0, sticky="nsew")

        self.frame_center = CTkFrame(master=self, corner_radius=0, fg_color=None)
        self.frame_center.grid(row=0, column=1, rowspan=1, pady=0, padx=0, sticky="nsew")

        self.frame_right = CTkFrame(master=self, corner_radius=0, fg_color="transparent")
        self.frame_right.grid(row=0, column=2, padx=0, pady=0, sticky="nsew")
        # Start hidden
        self.frame_right.grid_remove()

        # ============ frame_left ============
        self.frame_left.grid_rowconfigure(5, weight=1)

        self.trail_system_label = CTkLabel(self.frame_left, text="Trail System:")
        self.trail_system_label.grid(row=0, sticky="w", column=0, padx=(20, 12), pady=(2, 0))
        self.trail_system_menu = CTkOptionMenu(self.frame_left, command=self.change_tile_server,
                                               values=list(overpass_files.keys()))
        self.trail_system_menu.grid(pady=(0, 0), padx=12, row=1, column=0)

        self.load_data_button = CTkButton(master=self.frame_left, text="Load Data", command=self.load_data)
        self.load_data_button.grid(pady=(12, 0), padx=12, row=2, column=0)

        self.save_ways_button = CTkButton(master=self.frame_left, text="Save Ways", command=self.save_ways)
        self.save_ways_button.grid(pady=(12, 0), padx=12, row=3, column=0)

        self.save_relations_button = CTkButton(master=self.frame_left, text="Save Relations",
                                               command=self.save_relations)
        self.save_relations_button.grid(pady=(12, 0), padx=12, row=4, column=0)

        self.tile_server_label = CTkLabel(self.frame_left, text="Tile Server:")
        self.tile_server_label.grid(row=6, sticky="w", column=0, padx=(20, 12), pady=(12, 0))
        self.tile_server_menu = CTkOptionMenu(self.frame_left, values=[
            "OpenStreetMap", "Google normal", "Google satellite"
        ])
        self.tile_server_menu.grid(row=7, column=0, padx=12, pady=(0, 12))

        # ============ frame_center ===========
        self.frame_center.grid_rowconfigure(1, weight=1)
        self.frame_center.grid_rowconfigure(0, weight=0)
        self.frame_center.grid_columnconfigure(0, weight=1)
        self.frame_center.grid_columnconfigure(1, weight=1)
        self.frame_center.grid_columnconfigure(2, weight=0)

        self.map_widget = TkinterMapView(self.frame_center, corner_radius=10)
        self.map_widget.grid(row=1, rowspan=1, column=0, columnspan=3, sticky="nswe", padx=12, pady=(0, 12))

        self.tag_entry = CTkEntry(master=self.frame_center, placeholder_text="tag")
        self.tag_entry.grid(row=0, column=0, sticky="we", padx=(12, 0), pady=12)
        self.tag_entry.bind("<Return>", self.select_ways)

        self.value_entry = CTkEntry(master=self.frame_center, placeholder_text="value")
        self.value_entry.grid(row=0, column=1, sticky="we", padx=(12, 0), pady=12)
        self.value_entry.bind("<Return>", self.select_ways)

        self.select_button = CTkButton(master=self.frame_center, text="Select", width=90, command=self.select_ways)
        self.select_button.grid(row=0, column=2, sticky="w", padx=12, pady=12)

        # ============ frame_left ============
        self.relations_listbox = CTkListbox(master=self.frame_right, command=self.select_relation, width=270)
        self.relations_listbox.grid(row=0, column=0, padx=12, pady=12)

        self.edit_relation_frame = CTkFrame(master=self.frame_right, corner_radius=0, fg_color="transparent")
        self.edit_relation_frame.grid(row=1, column=0)

        self.new_relation_button = CTkButton(master=self.edit_relation_frame, text="New Relation")
        self.new_relation_button.grid(row=0, column=0, padx=12, pady=0)

        self.delete_relation_button = CTkButton(master=self.edit_relation_frame, text="Delete Relation")
        self.delete_relation_button.grid(row=0, column=1, padx=(0, 12), pady=0)

        self.add_selection_button = CTkButton(master=self.frame_right, text="Add Selection from Relation", width=294)
        self.add_selection_button.grid(row=2, column=0, pady=(24, 12))

        self.remove_selection_button = CTkButton(master=self.frame_right, text="Remove Selection from Relation", width=294)
        self.remove_selection_button.grid(row=3, column=0, pady=(0, 12))

        self.metadata_listbox = CTkListbox(master=self.frame_right, command=self.select_relation, width=270)
        self.metadata_listbox.grid(row=4, column=0, padx=12, pady=12)

        self.edit_metadata_frame = CTkFrame(master=self.frame_right, corner_radius=0, fg_color="transparent")
        self.edit_metadata_frame.grid(row=5, column=0)

        self.new_metadata_button = CTkButton(master=self.edit_metadata_frame, text="Add Tag")
        self.new_metadata_button.grid(row=0, column=0, padx=12, pady=0)

        self.delete_metadata_button = CTkButton(master=self.edit_metadata_frame, text="Delete Tag")
        self.delete_metadata_button.grid(row=0, column=1, padx=(0, 12), pady=0)

        # Set default values
        self.map_widget.set_address("Forest Park, Oregon")

    def select_ways(self, event=None):
        print("CLICKED SELECT")
        self.map_widget.set_address(self.tag_entry.get())

    def select_way(self, path_id):
        path = next(path for path in self.paths if path.name == path_id)
        self.change_path_color(path, self.SELECTED_COLOR)
        self.selection.add(path_id)

    def deselect_way(self, path_id):
        path = next(path for path in self.paths if path.name == path_id)
        self.change_path_color(path, self.SELECTED_COLOR)
        self.selection.add(path_id)

    def change_path_color(self, path, color):
        self.paths.remove(path)
        path.delete()
        path = self.map_widget.set_path(path.position_list, color=color, width=path.width, command=self.path_click, name=path.name)
        self.paths.add(path)

    def load_data(self):
        trail_system = self.trail_system_menu.get()
        print(f"Loading trail system {trail_system}")
        self.osm = fetch_osm(overpass_files[trail_system])

        print("Fetched OSM Data:")
        print("version: ", self.osm['version'])
        print("generator: ", self.osm['generator'])
        print("osm3s: ", self.osm['osm3s'])

        for element in self.osm['elements']:
            points = [(point['lat'], point['lon']) for point in element['geometry']]
            path = self.map_widget.set_path(points, width=4, command=self.path_click, name=str(element["id"]))
            self.paths.add(path)

        self.frame_right.grid()

    def path_click(self, path):
        print(path)
        if path.name in self.selection:
            self.select_way(path.name)
        else:
            self.deselect_way(path.name)

    def save_ways(self):
        pass

    def save_relations(self):
        pass

    def select_relation(self, selected):
        print(selected)

    def change_tile_server(self, source: str):
        if source == "OpenStreetMap":
            self.map_widget.set_tile_server("https://a.tile.openstreetmap.org/{z}/{x}/{y}.png")
        elif source == "Google normal":
            self.map_widget.set_tile_server("https://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}&s=Ga",
                                            max_zoom=22)
        elif source == "Google satellite":
            self.map_widget.set_tile_server("https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}&s=Ga",
                                            max_zoom=22)

    def on_closing(self, event=0):
        self.destroy()

    def start(self):
        self.mainloop()


if __name__ == "__main__":
    app = App()
    app.start()