from customtkinter import *
from tkintermapview import TkinterMapView
from CTkListbox import *
from trail_processor import *
from ordered_set import OrderedSet
import importlib
import webbrowser

overpass_files = {item.stem: item for item in scripts_dir.iterdir() if item.is_file() and item.suffix == ".overpassql"}
elevation_scripts = {item.stem: item for item in scripts_dir.iterdir() if item.is_file() and item.suffix == ".py"}

elevation_modules = {}


class App(CTk):
    APP_NAME = "Relation Editor"
    WIDTH = 1280
    HEIGHT = 966

    UNSELECTED_COLOR = "#3E69CB"
    UNSELECTED_NO_RELATION_COLOR = "#d10003"
    SELECTED_COLOR = "#e07f00"
    SELECTED_NO_RELATION_COLOR = "#d1c700"
    SELECTED_RELATION_COLOR = "#731792"
    SELECTED_RELATION_AND_SELECTED_COLOR = "#bc109c"

    osm = None
    relations = None
    selected_relation = None
    selected_trails = OrderedSet()
    paths = OrderedSet()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

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

        # ============ control_frame ============
        self.control_frame.grid_rowconfigure(5, weight=1)

        self.trail_system_label = CTkLabel(self.control_frame, text="Trail System:")
        self.trail_system_label.grid(row=0, sticky="w", column=0, padx=(20, 12), pady=(2, 0))
        self.trail_system_menu = CTkOptionMenu(
            self.control_frame,
            command=self.change_tile_server,
            values=list(overpass_files.keys())
        )
        self.trail_system_menu.grid(pady=(0, 0), padx=12, row=1, column=0)

        self.load_data_button = CTkButton(master=self.control_frame, text="Load Data", command=self.load_data)
        self.load_data_button.grid(pady=(12, 0), padx=12, row=2, column=0)

        self.save_ways_button = CTkButton(master=self.control_frame, text="Save Ways", command=self.save_ways)
        self.save_ways_button.grid(pady=(12, 0), padx=12, row=3, column=0)

        self.save_relations_button = CTkButton(
            master=self.control_frame,
            text="Save Relations",
            command=self.save_relations
        )
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

        self.new_relation_button = CTkButton(
            master=self.edit_relation_frame, command=self.new_relation, text="New Relation")
        self.new_relation_button.grid(row=0, column=0, padx=(0, 12), pady=0)

        self.delete_relation_button = CTkButton(
            master=self.edit_relation_frame, command=self.delete_relation, text="Delete Relation")
        self.delete_relation_button.grid(row=0, column=1, padx=(0, 12), pady=0)

        self.link_relation_button = CTkButton(
            master=self.relation_frame, command=self.link_relation, text="Link Relation Trails", width=294)
        self.link_relation_button.grid(row=2, column=0, padx=(0, 12), pady=(12, 0))

        self.selected_trails_frame = CTkFrame(master=self.relation_frame, corner_radius=0, fg_color="transparent")
        self.selected_trails_frame.grid(row=3, column=0, padx=(0, 12), pady=(24, 0))

        self.relation_trails_listbox = CTkListbox(
            master=self.selected_trails_frame,
            command=self.select_relation_trails_listbox,
            width=117
        )
        self.relation_trails_listbox.grid(row=0, column=0, padx=(0, 12))

        self.selected_trails_listbox = CTkListbox(
            master=self.selected_trails_frame,
            command=self.select_selected_trails_listbox,
            width=117
        )
        self.selected_trails_listbox.grid(row=0, column=1)

        self.remove_selection_button = CTkButton(
            master=self.selected_trails_frame, command=self.remove_selection, text="Remove Selection")
        self.remove_selection_button.grid(row=1, column=0, padx=(0, 12), pady=12)

        self.clear_selection_button = CTkButton(
            master=self.selected_trails_frame, command=self.clear_selection, text="Clear Selection")
        self.clear_selection_button.grid(row=1, column=1, pady=12)

        self.add_selection_button = CTkButton(
            master=self.relation_frame, command=self.add_selection, text="Add Selection", width=294)
        self.add_selection_button.grid(row=4, column=0, padx=(0, 12), pady=(0, 12))

        self.metadata_listbox = CTkListbox(master=self.relation_frame, command=self.select_tag, width=270)
        self.metadata_listbox.grid(row=5, column=0, padx=(0, 12), pady=12)

        self.edit_metadata_frame = CTkFrame(master=self.relation_frame, corner_radius=0, fg_color="transparent")
        self.edit_metadata_frame.grid(row=6, column=0)

        self.new_metadata_button = CTkButton(master=self.edit_metadata_frame, command=self.add_tag, text="Add Tag")
        self.new_metadata_button.grid(row=0, column=0, padx=(0, 12), pady=0)

        self.delete_metadata_button = CTkButton(
            master=self.edit_metadata_frame, command=self.delete_tag, text="Delete Tag")
        self.delete_metadata_button.grid(row=0, column=1, padx=(0, 12), pady=0)

        self.detect_tags_button = CTkButton(
            master=self.relation_frame, command=self.detect_tags, text="Autodetect Relation Tags", width=294)
        self.detect_tags_button.grid(row=7, column=0, padx=(0, 12), pady=(12, 0))

        # Configure map widget
        self.map_widget.set_address("Forest Park, Oregon")
        self.map_widget.add_right_click_menu_command(
            label="Query Features", command=self.query_features, pass_coords=True)

    def select_ways(self, event=None):
        tag = self.tag_entry.get()
        value = self.value_entry.get()

        for element in self.osm['elements']:
            tags = element['tags']
            if tag in tags:
                if tags[tag].strip().lower() == value.strip().lower():
                    self.selected_trails.add(element['id'])

        self.update_path_colors()
        self.update_selected_trails_listbox()

    def select_way(self, path_id):
        self.selected_trails.add(path_id)
        self.update_path_colors()
        self.update_selected_trails_listbox()

    def deselect_way(self, path_id):
        self.selected_trails.remove(path_id)
        self.update_path_colors()
        self.update_selected_trails_listbox()

    def change_path_color(self, path, color):
        if path.path_color == color:
            # No need to modify path
            return
        path.delete()
        self.paths.remove(path)

        path = self.map_widget.set_path(
            path.position_list,
            color=color,
            width=path.width,
            command=self.path_click,
            data=path.data
        )
        self.paths.add(path)

    def load_data(self):
        # Reset data
        self.selected_relation = None
        self.selected_trails = OrderedSet()
        for path in self.paths:
            path.delete()
        self.paths = OrderedSet()

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
        relations_file = relations_dir.joinpath(trail_system + ".json")
        open(relations_file, 'a+')
        self.relations = load_relations(relations_file)

        self.update_relations_listbox()
        self.update_relation_trails_listbox()
        self.update_selected_trails_listbox()
        self.update_metadata_listbox()
        self.update_path_colors()

        # Show sidebar
        self.relation_frame.grid()

    def path_click(self, path):
        if path.data in self.selected_trails:
            self.deselect_way(path.data)
        else:
            self.select_way(path.data)

    def save_ways(self):
        if self.osm is None:
            print("Trail system must be loaded before saving ways!")
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
        save_json(self.osm, ways_dir.joinpath(trail_system + ".json"))

    def save_relations(self):
        if self.relations is None:
            print("Trail system must be loaded before saving relations!")
            return

        trail_system = self.trail_system_menu.get()
        save_json(self.relations, relations_dir.joinpath(trail_system + ".json"))

    def new_relation(self):
        pass

    def delete_relation(self):
        pass

    def link_relation(self):
        pass

    def add_selection(self):
        pass

    def remove_selection(self):
        pass

    def clear_selection(self):
        self.selected_trails = OrderedSet()
        self.update_path_colors()
        self.update_selected_trails_listbox()

    def add_tag(self):
        pass

    def delete_tag(self):
        pass

    def detect_tags(self):
        pass

    def select_relation(self, selected):
        # Grab relation from index as selection name is not just ID
        relation = self.relations[self.relations_listbox.curselection()]

        # Don't modify if already selected
        if relation['id'] == self.selected_relation:
            return

        self.selected_relation = relation['id']

        # Update listboxes
        self.update_metadata_listbox()
        self.update_relation_trails_listbox()
        # Select paths
        self.update_path_colors()

    def update_metadata_listbox(self):
        # Clear listbox
        for i in range(self.metadata_listbox.size()):
            self.metadata_listbox.delete(0)
        # Get tags from selected relation
        tags = {}
        if self.selected_relation is not None:
            tags = next(r['tags'] for r in self.relations if r['id'] == self.selected_relation)
        # Add new tags to listbox
        for i, tag in enumerate(tags):
            self.metadata_listbox.insert(i, f'"{tag}": "{tags[tag]}"')

    def update_relation_trails_listbox(self):
        # Clear listbox
        for i in range(self.relation_trails_listbox.size()):
            self.relation_trails_listbox.delete(0)
        # Get all trails of selected relation
        trails = []
        if self.selected_relation is not None:
            trails = next(r['members'] for r in self.relations if r['id'] == self.selected_relation)
        # Add trails from relation
        for i, trail in enumerate(trails):
            self.relation_trails_listbox.insert(i, trail)

    def update_selected_trails_listbox(self):
        # Clear listbox
        for i in range(self.selected_trails_listbox.size()):
            self.selected_trails_listbox.delete(0)
        # Add trails from selection
        for i, trail in enumerate(self.selected_trails):
            self.selected_trails_listbox.insert(i, trail)

    def update_relations_listbox(self):
        # Clear listbox
        for i in range(self.relations_listbox.size()):
            self.relations_listbox.delete(0)
        # Add relations
        for i, relation in enumerate(self.relations):
            relation_name = relation['id']
            if 'name' in relation['tags']:
                relation_name += f" ({relation['tags']['name']})"
            self.relations_listbox.insert(i, relation_name)

    def update_path_colors(self):
        for path in self.paths.copy():
            relation = next((r['id'] for r in self.relations if path.data in r['members']), None)
            if relation is None:
                if path.data in self.selected_trails:
                    self.change_path_color(path, self.SELECTED_NO_RELATION_COLOR)
                else:
                    self.change_path_color(path, self.UNSELECTED_NO_RELATION_COLOR)
            elif relation == self.selected_relation:
                if path.data in self.selected_trails:
                    self.change_path_color(path, self.SELECTED_RELATION_AND_SELECTED_COLOR)
                else:
                    self.change_path_color(path, self.SELECTED_RELATION_COLOR)
            else:
                if path.data in self.selected_trails:
                    self.change_path_color(path, self.SELECTED_COLOR)
                else:
                    self.change_path_color(path, self.UNSELECTED_COLOR)

    def select_tag(self, selected):
        pass

    def select_relation_trails_listbox(self, selected):
        self.open_way_page(selected)
        self.relation_trails_listbox.deselect(self.relation_trails_listbox.curselection())

    def select_selected_trails_listbox(self, selected):
        self.open_way_page(selected)
        self.selected_trails_listbox.deselect(self.selected_trails_listbox.curselection())

    def open_way_page(self, way):
        webbrowser.open(f"https://www.openstreetmap.org/way/{way}", new=0, autoraise=True)

    def query_features(self, coords):
        lat, lon = coords
        webbrowser.open(f"https://www.openstreetmap.org/query?lat={lat}&lon={lon}", new=0, autoraise=True)

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
