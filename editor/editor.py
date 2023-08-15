from customtkinter import *
from tkintermapview import TkinterMapView
from CTkListbox import *
from trail_processor import *
import importlib

overpass_files = {item.stem: item for item in scripts_dir.iterdir() if item.is_file() and item.suffix == ".overpassql"}
elevation_scripts = {item.stem: item for item in scripts_dir.iterdir() if item.is_file() and item.suffix == ".py"}

elevation_modules = {}


class App(CTk):
    APP_NAME = "Relation Editor"
    WIDTH = 1280
    HEIGHT = 720

    PATH_COLOR = "#3E69CB"
    RELATION_COLOR = "#9b3fd1"
    SELECTED_COLOR = "#32a852"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.osm = None
        self.relations = None
        self.selected_relation = None
        self.paths = set()
        self.selection = set()

        # App Window settings
        self.title(App.APP_NAME)
        self.geometry(str(App.WIDTH) + "x" + str(App.HEIGHT))
        self.minsize(App.WIDTH, App.HEIGHT)

        # Configure window closing
        self.protocol("WM_DELETE_WINDOW", self.on_closing)
        if sys.platform == "darwin":
            self.bind("<Command-q>", self.on_closing)
            self.bind("<Command-w>", self.on_closing)
            self.createcommand('tk::mac::Quit', self.on_closing)

        # Create three CTkFrames
        self.grid_columnconfigure(0, weight=0)
        self.grid_columnconfigure(1, weight=1)
        self.grid_columnconfigure(2, weight=0)
        self.grid_columnconfigure(3, weight=0)
        self.grid_rowconfigure(0, weight=1)

        self.control_frame = CTkFrame(master=self, corner_radius=0, fg_color=None)
        self.control_frame.grid(row=0, column=0, padx=0, pady=0, sticky="nsew")

        self.map_frame = CTkFrame(master=self, corner_radius=0, fg_color=None)
        self.map_frame.grid(row=0, column=1, rowspan=1, pady=0, padx=0, sticky="nsew")

        self.relation_frame = CTkFrame(master=self, corner_radius=0, fg_color=None)
        self.relation_frame.grid(row=0, column=2, padx=0, pady=0, sticky="nsew")
        # Start hidden
        self.relation_frame.grid_remove()

        self.trail_frame = CTkFrame(master=self, corner_radius=0, fg_color="transparent")
        self.trail_frame.grid(row=0, column=3, padx=0, pady=0, sticky="nsew")
        # Start hidden
        self.trail_frame.grid_remove()

        # ============ control_frame ============
        self.control_frame.grid_rowconfigure(5, weight=1)

        self.trail_system_label = CTkLabel(self.control_frame, text="Trail System:")
        self.trail_system_label.grid(row=0, sticky="w", column=0, padx=(20, 12), pady=(2, 0))
        self.trail_system_menu = CTkOptionMenu(self.control_frame, command=self.change_tile_server,
                                               values=list(overpass_files.keys()))
        self.trail_system_menu.grid(pady=(0, 0), padx=12, row=1, column=0)

        self.load_data_button = CTkButton(master=self.control_frame, text="Load Data", command=self.load_data)
        self.load_data_button.grid(pady=(12, 0), padx=12, row=2, column=0)

        self.save_ways_button = CTkButton(master=self.control_frame, text="Save Ways", command=self.save_ways)
        self.save_ways_button.grid(pady=(12, 0), padx=12, row=3, column=0)

        self.save_relations_button = CTkButton(master=self.control_frame, text="Save Relations",
                                               command=self.save_relations)
        self.save_relations_button.grid(pady=(12, 0), padx=12, row=4, column=0)

        self.tile_server_label = CTkLabel(self.control_frame, text="Tile Server:")
        self.tile_server_label.grid(row=6, sticky="w", column=0, padx=(20, 12), pady=(12, 0))
        self.tile_server_menu = CTkOptionMenu(self.control_frame, command=self.change_tile_server, values=[
            "OpenStreetMap", "Google normal", "Google satellite"
        ])
        self.tile_server_menu.grid(row=7, column=0, padx=12, pady=(0, 12))

        # ============ map_frame ===========
        self.map_frame.grid_rowconfigure(1, weight=1)
        self.map_frame.grid_rowconfigure(0, weight=0)
        self.map_frame.grid_columnconfigure(0, weight=1)
        self.map_frame.grid_columnconfigure(1, weight=1)
        self.map_frame.grid_columnconfigure(2, weight=0)

        self.map_widget = TkinterMapView(self.map_frame, corner_radius=10)
        self.map_widget.grid(row=1, rowspan=1, column=0, columnspan=3, sticky="nswe", padx=(0, 12), pady=(0, 12))

        self.tag_entry = CTkEntry(master=self.map_frame, placeholder_text="tag")
        self.tag_entry.grid(row=0, column=0, sticky="we", padx=(0, 0), pady=12)
        self.tag_entry.bind("<Return>", self.select_ways)

        self.value_entry = CTkEntry(master=self.map_frame, placeholder_text="value")
        self.value_entry.grid(row=0, column=1, sticky="we", padx=(12, 0), pady=12)
        self.value_entry.bind("<Return>", self.select_ways)

        self.select_button = CTkButton(master=self.map_frame, text="Select", width=90, command=self.select_ways)
        self.select_button.grid(row=0, column=2, sticky="w", padx=12, pady=12)

        # ============ relation_frame ============
        self.relations_listbox = CTkListbox(master=self.relation_frame, command=self.select_relation, width=270)
        self.relations_listbox.grid(row=0, column=0, padx=(0, 12), pady=12)

        self.edit_relation_frame = CTkFrame(master=self.relation_frame, corner_radius=0, fg_color="transparent")
        self.edit_relation_frame.grid(row=1, column=0)

        self.new_relation_button = CTkButton(master=self.edit_relation_frame, text="New Relation")
        self.new_relation_button.grid(row=0, column=0, padx=(0, 12), pady=0)

        self.delete_relation_button = CTkButton(master=self.edit_relation_frame, text="Delete Relation")
        self.delete_relation_button.grid(row=0, column=1, padx=(0, 12), pady=0)

        self.add_selection_button = CTkButton(master=self.relation_frame, text="Add Selection from Relation", width=294)
        self.add_selection_button.grid(row=2, column=0, padx=(0, 12), pady=(24, 12))

        self.remove_selection_button = CTkButton(master=self.relation_frame, text="Remove Selection from Relation",
                                                 width=294)
        self.remove_selection_button.grid(row=3, column=0, padx=(0, 12), pady=(0, 12))

        self.metadata_listbox = CTkListbox(master=self.relation_frame, command=self.select_tag, width=270)
        self.metadata_listbox.grid(row=4, column=0, padx=(0, 12), pady=12)

        self.edit_metadata_frame = CTkFrame(master=self.relation_frame, corner_radius=0, fg_color="transparent")
        self.edit_metadata_frame.grid(row=5, column=0)

        self.new_metadata_button = CTkButton(master=self.edit_metadata_frame, text="Add Tag")
        self.new_metadata_button.grid(row=0, column=0, padx=(0, 12), pady=0)

        self.delete_metadata_button = CTkButton(master=self.edit_metadata_frame, text="Delete Tag")
        self.delete_metadata_button.grid(row=0, column=1, padx=(0, 12), pady=0)

        # ========== trail_frame =============
        # self.trail

        # Set default values
        self.map_widget.set_address("Forest Park, Oregon")

    def select_ways(self, event=None):
        tag = self.tag_entry.get()
        value = self.value_entry.get()
        print(f'Selecting ways with "{tag}": "{value}"')

    def select_way(self, path_id):
        path = next(path for path in self.paths if path.data == path_id)
        self.change_path_color(path, self.SELECTED_COLOR)
        self.selection.add(path_id)

    def deselect_way(self, path_id):
        path = next(path for path in self.paths if path.data == path_id)
        self.change_path_color(path, self.PATH_COLOR)
        self.selection.remove(path_id)

    def change_path_color(self, path, color):
        self.paths.remove(path)
        path.delete()
        path = self.map_widget.set_path(path.position_list, color=color, width=path.width, command=self.path_click,
                                        data=path.data)
        self.paths.add(path)

    def load_data(self):
        # Fetch trails from overpass
        trail_system = self.trail_system_menu.get()
        print(f"Loading trail system {trail_system}")
        self.osm = fetch_osm(overpass_files[trail_system])

        print("Fetched OSM Data:")
        print("version: ", self.osm['version'])
        print("generator: ", self.osm['generator'])
        print("osm3s: ", self.osm['osm3s'])

        # Convert overpass data to paths
        for element in self.osm['elements']:
            points = [(point['lat'], point['lon']) for point in element['geometry']]
            path = self.map_widget.set_path(points, width=4, command=self.path_click, data=element["id"])
            self.paths.add(path)

        # Load relations
        relations_file = relations_dir.joinpath(trail_system+".json")
        open(relations_file, 'a+')
        self.relations = load_relations(relations_file)

        for i, relation in enumerate(self.relations):
            relation_name = relation['id']
            if 'name' in relation['tags']:
                relation_name += f" ({relation['tags']['name']})"
            self.relations_listbox.insert(i, relation_name)

        # Show sidebar
        self.relation_frame.grid()

    def path_click(self, path):
        if path.data in self.selection:
            self.deselect_way(path.data)
        else:
            self.select_way(path.data)

    def save_ways(self):
        if self.osm is None:
            print("Trail system must be loaded before saving!")
            return

        trail_system = self.trail_system_menu.get()

        # Fallback method that returns 0
        def get_elevation(coords):
            return 0.0

        get_elevation_orig = get_elevation

        # If module already loaded for trail system, reuse
        if trail_system in elevation_modules and 'get_elevation' in dir(elevation_modules[trail_system]):
            get_elevation = elevation_modules[trail_system].get_elevation
        elif trail_system in elevation_scripts:
            print(f'Loading python module for trail system "{trail_system}".')
            spec = importlib.util.spec_from_file_location(trail_system, elevation_scripts[trail_system])
            module = importlib.util.module_from_spec(spec)
            sys.modules[trail_system] = module
            spec.loader.exec_module(module)
            print("Module loaded.")
            elevation_modules[trail_system] = module
            if 'get_elevation' in dir(elevation_modules[trail_system]):
                get_elevation = module.get_elevation

        if get_elevation == get_elevation_orig:
            # This means the get_elevation is still the fallback method
            print("Trail system has no python module! All elevations will be set to 0.")

        process_osm(self.osm, get_elevation)
        save_osm(self.osm, ways_dir.joinpath(trail_system + ".json"))

    def save_relations(self):
        pass

    def select_relation(self, selected):
        # Grab relation from index as selection name is not just ID
        relation = self.relations[self.relations_listbox.curselection()]

        # Don't modify if already selected
        if relation['id'] == self.selected_relation:
            return

        self.selected_relation = relation['id']
        # Clear listbox
        for i in range(self.metadata_listbox.size()):
            self.metadata_listbox.delete(0)
        # Add new tags
        tags = relation['tags']
        for i, tag in enumerate(tags):
            self.metadata_listbox.insert(i, f'"{tag}": "{tags[tag]}"')

    def select_tag(self, selected):
        pass

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
        exit()
        # self.destroy() # currently throws exception

    def start(self):
        self.mainloop()


if __name__ == "__main__":
    app = App()
    app.start()
