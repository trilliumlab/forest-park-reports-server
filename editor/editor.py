#!/usr/bin/env python

from customtkinter import *
from tkintermapview import TkinterMapView
from tkinter.messagebox import *
import tkinter as tki
from CTkListbox import CTkListbox
from trail_processor import *
from ordered_set import OrderedSet
import importlib
import webbrowser

overpass_files = {item.stem: item for item in scripts_dir.iterdir() if item.is_file() and item.suffix == ".overpassql"}
elevation_scripts = {item.stem: item for item in scripts_dir.iterdir() if item.is_file() and item.suffix == ".py"}

elevation_modules = {}


class TagEditor(CTk):

    def __init__(self, tag, value, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.returning = None
        self.title('Tag Editor')

        # main frame
        self.main_frame = CTkFrame(master=self, corner_radius=0)
        self.main_frame.pack()

        self.entry_frame = CTkFrame(master=self.main_frame, corner_radius=0, fg_color="transparent")
        self.entry_frame.grid(row=0, column=0, padx=12, pady=(12, 24))

        self.button_frame = CTkFrame(master=self.main_frame, corner_radius=0, fg_color="transparent")
        self.button_frame.grid_columnconfigure(index=0, weight=1)
        self.button_frame.grid(row=1, column=0, padx=12, pady=12, sticky="E")

        # Tag editor
        self.tag_label = CTkLabel(master=self.entry_frame, text="Tag:")
        self.tag_label.grid(row=0, column=0, padx=(14, 0), sticky="W")

        self.value_label = CTkLabel(master=self.entry_frame, text="Value:")
        self.value_label.grid(row=0, column=2, padx=(12, 0), sticky="W")

        self.tag_entry = CTkEntry(master=self.entry_frame)
        if tag is not None:
            self.tag_entry.insert(0, tag)
        self.tag_entry.grid(row=1, column=0, padx=(12, 2))

        self.colon_label = CTkLabel(master=self.entry_frame, text=":", font=(None, 16))
        self.colon_label.grid(row=1, column=1, pady=(0, 4))

        self.value_entry = CTkEntry(master=self.entry_frame, width=200)
        if value is not None:
            self.value_entry.insert(0, value)
        self.value_entry.grid(row=1, column=2, padx=(10, 12))

        self.cancel_button = CTkButton(master=self.button_frame, text="Cancel", width=100, command=self.on_cancel)
        self.cancel_button.grid(row=0, column=0, padx=12, sticky="E")

        self.ok_button = CTkButton(master=self.button_frame, text="Ok", width=70, command=self.on_ok)
        self.ok_button.grid(row=0, column=1, sticky="E")

        # roughly center the box on screen
        # for accuracy see: https://stackoverflow.com/a/10018670/1217270
        self.update_idletasks()
        xp = (self.winfo_screenwidth() // 2) - (self.winfo_width() // 2)
        yp = (self.winfo_screenheight() // 2) - (self.winfo_height() // 2)
        geom = (self.winfo_width(), self.winfo_height(), xp, yp)
        self.geometry('{0}x{1}+{2}+{3}'.format(*geom))
        # call self.close_mod when the close button is pressed
        self.protocol("WM_DELETE_WINDOW", self.close_mod)
        # a trick to activate the window (on Windows 7)
        self.deiconify()
        try:
            self.grab_set()
        except Exception as e:
            print(e)

    def on_ok(self):
        self.returning = (self.tag_entry.get(), self.value_entry.get())
        self.quit()

    def on_cancel(self):
        self.returning = None
        self.quit()

    # remove this function and the call to protocol
    # then the close button will act normally
    def close_mod(self):
        pass

    def result(self):
        self.mainloop()
        self.destroy()
        return self.returning


class TagChooser(CTk):

    def __init__(self, tag, option1, option2, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.option1 = option1
        self.option2 = option2

        self.returning = None
        self.title('Tag Chooser')

        # main frame
        self.main_frame = CTkFrame(master=self, corner_radius=0)
        self.main_frame.pack()

        self.label = CTkLabel(
            master=self.main_frame, text=f'Conflicting "{tag}" tags found! Choose which one to keep.')
        self.label.grid(row=0, padx=24, pady=12)

        self.option1_button = CTkButton(master=self.main_frame, text=option1, width=380, command=self.on_option1)
        self.option1_button.grid(row=1, padx=12)

        self.option2_button = CTkButton(master=self.main_frame, text=option2, width=380, command=self.on_option2)
        self.option2_button.grid(row=2, padx=12, pady=(12, 24))

        # roughly center the box on screen
        # for accuracy see: https://stackoverflow.com/a/10018670/1217270
        self.update_idletasks()
        xp = (self.winfo_screenwidth() // 2) - (self.winfo_width() // 2)
        yp = (self.winfo_screenheight() // 2) - (self.winfo_height() // 2)
        geom = (self.winfo_width(), self.winfo_height(), xp, yp)
        self.geometry('{0}x{1}+{2}+{3}'.format(*geom))
        # call self.close_mod when the close button is pressed
        self.protocol("WM_DELETE_WINDOW", self.close_mod)
        # a trick to activate the window (on Windows 7)
        self.deiconify()
        try:
            self.grab_set()
        except Exception as e:
            print(e)

    def on_option1(self):
        self.returning = self.option1
        self.quit()

    def on_option2(self):
        self.returning = self.option2
        self.quit()

    # remove this function and the call to protocol
    # then the close button will act normally
    def close_mod(self):
        pass

    def result(self):
        self.mainloop()
        self.destroy()
        return self.returning


def set_menubar_name(name):
    if sys.platform == 'darwin':
        try:
            from Foundation import NSBundle
            bundle = NSBundle.mainBundle()
            if bundle:
                info = bundle.localizedInfoDictionary() or bundle.infoDictionary()
                info['CFBundleName'] = name
                info['CFBundleDisplayName'] = name
                print(f"Set menubar name {name}")
        except ImportError:
            print("pyobjc not installed, not setting app name.")
    else:
        print("Menubar name not set: platform must be macOS!")


class App(CTk):
    APP_NAME = "Relation Editor"
    WIDTH = 1380
    HEIGHT = 1006

    UNSELECTED_COLOR = "#3E69CB"
    UNSELECTED_NO_RELATION_COLOR = "#d10003"
    SELECTED_COLOR = "#19b7d7"
    SELECTED_NO_RELATION_COLOR = "#e07f00"
    SELECTED_RELATION_COLOR = "#731792"
    SELECTED_RELATION_AND_SELECTED_COLOR = "#bc109c"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.osm = None
        self.relations = None
        self.reversed = []
        self.selected_relation = None
        self.selected_trails = OrderedSet()
        self.paths = OrderedSet()
        self.markers = OrderedSet()

        self._last_selected_tag = None

        # App Window settings
        self.title(App.APP_NAME)
        self.geometry(str(App.WIDTH) + "x" + str(App.HEIGHT))
        self.minsize(App.WIDTH, App.HEIGHT)
        self.wm_iconphoto(False, tki.PhotoImage(file=editor_dir.joinpath("icon.png")))

        # Set menu bar name on macOS
        set_menubar_name(App.APP_NAME)

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
        self.control_frame.grid_rowconfigure(4, weight=1)

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

        self.save_ways_button = CTkButton(master=self.control_frame, text="Save Data", command=self.save_data)
        self.save_ways_button.grid(pady=(12, 0), padx=12, row=3, column=0)

        self.tile_server_label = CTkLabel(self.control_frame, text="Tile Server:")
        self.tile_server_label.grid(row=5, sticky="w", column=0, padx=(20, 12), pady=(12, 0))
        self.tile_server_menu = CTkOptionMenu(self.control_frame, command=self.change_tile_server, values=[
            "OpenStreetMap", "Google normal", "Google satellite"
        ])
        self.tile_server_menu.grid(row=6, column=0, padx=12, pady=(0, 12))

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
        self.tag_entry.bind("<Return>", self.focus_value)

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

        self.link_relation_button = CTkButton(
            master=self.relation_frame, command=self.reverse_relation, text="Reverse Relation", width=294)
        self.link_relation_button.grid(row=3, column=0, padx=(0, 12), pady=(12, 0))

        self.selected_trails_frame = CTkFrame(master=self.relation_frame, corner_radius=0, fg_color="transparent")
        self.selected_trails_frame.grid(row=4, column=0, padx=(0, 12), pady=(24, 0))

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
        self.add_selection_button.grid(row=5, column=0, padx=(0, 12), pady=(0, 12))

        self.metadata_listbox = CTkListbox(master=self.relation_frame, command=self.select_tag, width=270)
        self.metadata_listbox.grid(row=6, column=0, padx=(0, 12), pady=12)

        self.edit_metadata_frame = CTkFrame(master=self.relation_frame, corner_radius=0, fg_color="transparent")
        self.edit_metadata_frame.grid(row=7, column=0)

        self.new_metadata_button = CTkButton(master=self.edit_metadata_frame, command=self.add_tag, text="Add Tag")
        self.new_metadata_button.grid(row=0, column=0, padx=(0, 12), pady=0)

        self.delete_metadata_button = CTkButton(
            master=self.edit_metadata_frame, command=self.delete_tag, text="Delete Tag")
        self.delete_metadata_button.grid(row=0, column=1, padx=(0, 12), pady=0)

        self.detect_tags_button = CTkButton(
            master=self.relation_frame, command=self.detect_tags, text="Autodetect Relation Tags", width=294)
        self.detect_tags_button.grid(row=8, column=0, padx=(0, 12), pady=(12, 0))

        # Configure map widget
        self.map_widget.set_address("Forest Park, Oregon")
        self.map_widget.add_right_click_menu_command(
            label="Query Features", command=self.query_features, pass_coords=True)

    def focus_value(self, event=None):
        self.value_entry.focus_set()

    def select_ways(self, event=None):
        tag = self.tag_entry.get().strip()
        value = self.value_entry.get().strip().lower()

        for trail in self.osm['elements']:
            if tag.lower() == 'id':
                if str(trail['id']) == value:
                    self.selected_trails.add(trail['id'])
            tags = trail['tags']
            if tag in tags:
                if tags[tag].strip().lower() == value:
                    self.selected_trails.add(trail['id'])

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

        trail_system = self.trail_system_menu.get()

        # Load reversed
        self.reversed = load_json(reversed_dir.joinpath(trail_system + ".json"), [])

        # Fetch trails from overpass
        print(f"Loading trail system {trail_system}")
        self.osm = fetch_osm(overpass_files[trail_system])

        print("Fetched OSM Data:")
        print("version: ", self.osm['version'])
        print("generator: ", self.osm['generator'])
        print("osm3s: ", self.osm['osm3s'])

        # Reverse reversed trails
        for element in self.osm['elements']:
            if element['id'] in self.reversed:
                element['geometry'].reverse()
                element['nodes'].reverse()

        # Convert overpass data to paths
        for element in self.osm['elements']:
            points = [(point['lat'], point['lon']) for point in element['geometry']]
            path = self.map_widget.set_path(points, width=4, command=self.path_click, data=element["id"])
            self.paths.add(path)

        # Load relations
        self.relations = load_json(relations_dir.joinpath(trail_system + ".json"), {})

        # Update UI
        self.update_markers()
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

    def save_data(self):
        if self.osm is None:
            print("Trail system must be loaded before saving data!")
            return

        self.save_ways()
        self.save_relations()
        self.save_reversed()

    def save_ways(self):
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
        ways_path = ways_dir.joinpath(trail_system + ".json")
        save_json(self.osm, ways_path)
        print(f"Ways saved to {ways_path}")

    def save_relations(self):
        trail_system = self.trail_system_menu.get()
        relations_path = relations_dir.joinpath(trail_system + ".json")
        save_json(self.relations, relations_path)
        print(f"Relations saved to {relations_path}")

    def save_reversed(self):
        trail_system = self.trail_system_menu.get()
        reversed_path = reversed_dir.joinpath(trail_system + ".json")
        save_json(self.reversed, reversed_path)
        print(f"Reversed saved to {reversed_path}")

    def new_relation(self):
        relation_id = 0
        relation_ids = [r['id'] for r in self.relations]
        while relation_id in relation_ids:
            relation_id += 1

        self.relations.append({
            'type': 'relation',
            'id': relation_id,
            'tags': {},
            'members': []
        })
        self.update_relations_listbox()
        self.relations_listbox.activate(self.relations_listbox.size()-1)

    def delete_relation(self):
        relation = next((r for r in self.relations if r['id'] == self.selected_relation), None)
        if relation is None:
            showwarning(message="No relation selected!")
        else:
            relation_name = str(relation['id'])
            if 'name' in relation['tags']:
                relation_name += f" ({relation['tags']['name']})"
            delete = askokcancel(message=f"Are you sure you want to delete relation {relation_name}?", icon="warning")
            if delete:
                self.selected_relation = None
                self.relations.remove(relation)
                self.update_relations_listbox()
                self.update_path_colors()

    def reverse_relation(self):
        relation = next((r for r in self.relations if r['id'] == self.selected_relation), None)
        relation['members'].reverse()
        trails = [e for e in self.osm['elements'] if e['id'] in relation['members']]

        for trail in trails:
            if trail['id'] in self.reversed:
                self.reversed.remove(trail['id'])
            else:
                self.reversed.append(trail['id'])

            trail['nodes'].reverse()
            trail['geometry'].reverse()

        # Updated UI
        self.update_markers()
        self.update_relation_trails_listbox()

    def link_relation(self):
        relation = next((r for r in self.relations if r['id'] == self.selected_relation), None)
        trails = [e for e in self.osm['elements'] if e['id'] in relation['members']]
        if len(trails) == 0:
            print("Relations must have at least one trail to link!")
            return
        sorted_trails = [trails[0]]

        while len(sorted_trails) < len(trails):
            sorted_first_node = sorted_trails[0]['nodes'][0]
            sorted_last_node = sorted_trails[-1]['nodes'][-1]
            initial_len = len(sorted_trails)

            for trail in trails:
                # Don't add trails that are already added
                if trail in sorted_trails:
                    continue
                trail_first_node = trail['nodes'][0]
                trail_last_node = trail['nodes'][-1]
                if sorted_first_node == trail_first_node:
                    # The beginning of the first trail is the same as the beginning of the new trail
                    # Therefore the new trail should be reversed and added to the beginning
                    if trail['id'] in self.reversed:
                        self.reversed.remove(trail['id'])
                    else:
                        self.reversed.append(trail['id'])

                    trail['nodes'].reverse()
                    trail['geometry'].reverse()
                    sorted_trails.insert(0, trail)
                    break
                elif sorted_first_node == trail_last_node:
                    # The beginning of the first trail is the same as the end of the new trail
                    # Therefore the enw trail should be added to the beginning
                    sorted_trails.insert(0, trail)
                    break
                elif sorted_last_node == trail_first_node:
                    # The end of the last trail is the same as the beginning of the new trail
                    # Therefore the new trail should be added to the end
                    sorted_trails.append(trail)
                    break
                elif sorted_last_node == trail_last_node:
                    # The end of the last trail is the same as the end of the new trail
                    # Therefore the new trail should be reversed and added to the end
                    if trail['id'] in self.reversed:
                        self.reversed.remove(trail['id'])
                    else:
                        self.reversed.append(trail['id'])

                    trail['nodes'].reverse()
                    trail['geometry'].reverse()
                    sorted_trails.append(trail)
                    break

            if len(sorted_trails) == initial_len:
                # If we get here, it means we didn't find any trails with shared nodes
                showerror(message=f"Failed to link trails: Trails are not continuous! (Continuous segment: "
                                  f"{sorted_trails[0]['id']}-{sorted_trails[-1]['id']})")
                return

        # Set the relation members to the sorted trails
        relation['members'] = [t['id'] for t in sorted_trails]

        # Update UI
        self.update_markers()
        self.update_relation_trails_listbox()

    def add_selection(self):
        relation = next((r for r in self.relations if r['id'] == self.selected_relation), None)
        for trail in self.selected_trails:
            if trail not in relation['members']:
                relation['members'].append(trail)
        self.selected_trails = OrderedSet()
        self.update_relation_trails_listbox()
        self.update_selected_trails_listbox()
        self.update_path_colors()
        self.update_markers()

    def remove_selection(self):
        relation = next((r for r in self.relations if r['id'] == self.selected_relation), None)
        for trail in self.selected_trails:
            if trail in relation['members']:
                relation['members'].remove(trail)
        self.selected_trails = OrderedSet()
        self.update_relation_trails_listbox()
        self.update_selected_trails_listbox()
        self.update_path_colors()
        self.update_markers()

    def clear_selection(self):
        self.selected_trails = OrderedSet()
        self.update_path_colors()
        self.update_selected_trails_listbox()

    def add_tag(self):
        relation = next((r for r in self.relations if r['id'] == self.selected_relation), None)
        result = self.tag_editor("", "")
        if result is None:
            return
        tag, value = result
        relation['tags'][tag] = value

        self.update_metadata_listbox()
        if tag == "name":
            index = self.relations_listbox.curselection()
            self.update_relations_listbox()
            self.relations_listbox.activate(index)

    def delete_tag(self):
        relation = next((r for r in self.relations if r['id'] == self.selected_relation), None)
        tags = relation['tags']
        tag = list(tags.keys())[self.metadata_listbox.curselection()]
        delete = askokcancel(message=f'Are you sure you want to delete tag "{tag}"?', icon="warning")
        if delete:
            del tags[tag]
            self.update_metadata_listbox()
            if tag == "name":
                index = self.relations_listbox.curselection()
                self.update_relations_listbox()
                self.relations_listbox.activate(index)
        self._last_selected_tag = None

    def detect_tags(self):
        relation = next((r for r in self.relations if r['id'] == self.selected_relation), None)
        tags = relation['tags']
        ignored_values = {}
        for element in self.osm['elements']:
            if element['id'] in relation['members']:
                for tag in element['tags']:
                    if tag not in ignored_values:
                        ignored_values[tag] = []
                    if tag in tags:
                        option1 = tags[tag]
                        option2 = element['tags'][tag]
                        if option1 != option2:
                            if option1 in ignored_values[tag]:
                                tags[tag] = option2
                            elif option2 in ignored_values[tag]:
                                tags[tag] = option1
                            else:
                                # This means that two trails have different values for the same tag.
                                tag_chooser = TagChooser(tag, option1, option2)
                                result = tag_chooser.result()
                                ignored_values[tag].append(option2 if result == option1 else option1)
                                tags[tag] = result
                    else:
                        tags[tag] = element['tags'][tag]

        self.update_metadata_listbox()
        index = self.relations_listbox.curselection()
        self.update_relations_listbox()
        self.relations_listbox.activate(index)

    def select_tag(self, selected):
        current_tag = self.metadata_listbox.curselection()
        last_tag = self._last_selected_tag
        self._last_selected_tag = current_tag

        if last_tag == current_tag:
            self.edit_tag()

    def edit_tag(self):
        relation = next((r for r in self.relations if r['id'] == self.selected_relation), None)
        tags = relation['tags']
        initial_tag = list(tags.keys())[self.metadata_listbox.curselection()]
        initial_value = tags[initial_tag]

        result = self.tag_editor(initial_tag, initial_value)
        if result is None:
            return
        tag, value = result

        if tag != initial_tag:
            del tags[initial_tag]
        tags[tag] = value

        self.update_metadata_listbox()
        if tag == "name":
            index = self.relations_listbox.curselection()
            self.update_relations_listbox()
            self.relations_listbox.activate(index)

    def tag_editor(self, tag, value):
        relation = next((r for r in self.relations if r['id'] == self.selected_relation), None)
        tags = relation['tags']

        initial_tag = tag

        while True:
            tag_editor = TagEditor(tag, value)
            result = tag_editor.result()
            if result is None:
                return
            tag, value = result
            if tag in tags and tag != initial_tag:
                showwarning(message=f'The tag "{tag}" already exists!')
            elif not tag.strip() or not value.strip():
                showwarning(message="Tag and value can't be blank or empty!")
            else:
                return tag, value

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
        self.update_markers()

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
        self._last_selected_tag = None
        # Clear listbox
        for i in range(self.relations_listbox.size()):
            self.relations_listbox.delete(0)
        # Add relations
        for i, relation in enumerate(self.relations):
            relation_name = str(relation['id'])
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

    def update_markers(self):
        for marker in self.markers:
            marker.delete()
            self.markers = OrderedSet()
        relation = next((r for r in self.relations if r['id'] == self.selected_relation), None)
        if relation is None:
            return
        first = next((e['geometry'][0] for e in self.osm['elements'] if e['id'] == relation['members'][0]), None)
        last = next((e['geometry'][-1] for e in self.osm['elements'] if e['id'] == relation['members'][-1]), None)

        self.markers.add(self.map_widget.set_marker(last['lat'], last['lon']))
        self.markers.add(self.map_widget.set_marker(
            first['lat'], first['lon'], marker_color_outside="#32a852", marker_color_circle="green"))

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
