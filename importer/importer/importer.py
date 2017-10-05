import os
import logging
import json

from io import BytesIO
from zipfile import ZipFile, ZIP_DEFLATED

from .pyfl_utils import UTFFile, concat_lists
from .pyfl_utils.models.cmpmodel import CMPModel
from .pyfl_utils.models.texturepack import TexturePack
from .pyfl_utils.stringutils import try_decode

from .config_loader import ConfigLoader
from .errors import ParserError
from .hardpoint_parser import HardpointParser
from .timer import Timer
from .data_encoder import ModelEncoder, TextureEncoder

_logger = logging.getLogger(__name__)


class ShipDataImporter(object):
    STATS_FIELDS = [
        'ship_class', 'nickname', 'msg_id_prefix', 'mission_property', 'type', 'mass', 'hold_size', 'linear_drag', 'max_bank_angle',
        'camera_offset', 'camera_angular_acceleration', 'camera_horizontal_turn_angle', 'camera_vertical_turn_up_angle',
        'camera_vertical_turn_down_angle', 'camera_turn_look_ahead_slerp_amount', 'nanobot_limit', 'shield_battery_limit',
        'hit_pts', 'steering_torque', 'angular_drag', 'rotation_inertia', 'nudge_force', 'strafe_force', 'strafe_power_usage',
        'num_exhaust_nozzles', 'dockgroup',
    ]

    def __init__(self, args):
        self.mat_map = {}

        fl_ini = os.path.join(args.root, 'EXE', 'freelancer.ini')
        if not os.path.isfile(fl_ini):
            raise ParserError('could not find freelancer.ini in EXE folder')
        self.config = ConfigLoader(fl_ini)
        _logger.debug('config loaded')

        self.data_files = []
        

    def run_import(self):
        self.timer = Timer(_logger.info)
        self.timer.start()

        ships_data = self._get_ships()
        self.timer.step('data parsed')
        
        content = json.dumps(ships_data).encode('utf-8')
        self.timer.step('data dumped')

        _logger.debug('size: {}'.format(len(content)))

        with open('debug.json', 'wb') as file:
            file.write(content)

        buffer = BytesIO()
        with ZipFile('output.zip', mode='w', compression=ZIP_DEFLATED) as zf:
            self.timer.start()
            zf.writestr('data.json', content)
            self.timer.step('main ship data saved to zip')

            inventory = []
            for data_file in self.data_files:
                inventory += data_file.write_to_zip(zf)

            zf.writestr('inventory.json', json.dumps(inventory))

            self.timer.stop('datafiles saved')
        self.timer.stop('ALL DONE!')
        
    def _get_ships(self):
        self.timer.start()
        ships = self.config.goods.get_by_kv('category', 'ship')

        result_dict = {
            'ships': {},
        }

        import_id = 0
        for ship in ships:
            self.timer.start()
            hull_name = ship.get('hull')
            hull = self.config.goods.get_by_kv('nickname', hull_name, multiple=False)

            ship_name = hull.get('ship')
            result_dict['ships'][import_id] = {
                'price': hull.get('price'),
            }
            self._get_ship_info(result_dict['ships'][import_id], ship_name)
            self._get_model(result_dict['ships'][import_id], ship_name, import_id)

            self.timer.stop('ship {} parsed'.format(ship_name))
            import_id += 1

        self.timer.step('all ships parsed')
        self._get_textures(result_dict)
        self.timer.stop('textures parsed')

        return result_dict

    def _get_ship_info(self, result_dict, ship_name):
        shiparch_entry = self.config.shiparch.get_by_kv('nickname', ship_name, multiple=False)
        ids_name = shiparch_entry.get('ids_name')
        ids_info = shiparch_entry.get('ids_info')

        extended_dict = {            
            'name': 'unknown' if not ids_name else try_decode(self.config.get_dll_string(ids_name)),
            'infocard': 'unknown' if not ids_info else try_decode(self.config.get_dll_string(ids_info)),
        }
        for stat in self.STATS_FIELDS:
            stat_content = shiparch_entry.get(stat)
            if stat_content:
                extended_dict[stat] = stat_content

        result_dict.update(extended_dict)

    def _get_model(self, result_dict, ship_name, import_id):
        shiparch_entry = self.config.shiparch.get_by_kv('nickname', ship_name, multiple=False)

        path = self.config.get_absolute_path('data', shiparch_entry.get('DA_archetype'))
        _logger.debug(path)

        if not os.path.isfile(path):            
            raise ParserError('could not find cmp for {}'.format(ship_name))

        utf = UTFFile(path)
        model = CMPModel(utf, self)

        model_data = {
            'lods': model.get_lod_levels(),
            'vertices': model.prepared_vertices,
            'normals': model.prepared_normals,
            'uvs': model.prepared_uvs,
            'materials_per_mesh': model.materials_per_mesh,
        }
        result_dict['model_data'] = {'lods': model.get_lod_levels()}

        self.mat_map[import_id] = {
            'paths': concat_lists(shiparch_entry.get('material_library'), []),
            'ids': model.material_ids,
        }

        self.data_files.append(ModelEncoder(ship_name, import_id, model_data))
        self._get_hardpoints(result_dict, utf)

    def _get_hardpoints(self, result_dict, model):
        hp_parser = HardpointParser(model, self)
        result_dict['hardpoints'] = hp_parser.hardpoints

    def _get_path_map(self):
        path_map = {}
        for import_id, path in self._iterate_paths():
            abs_path = self.config.get_absolute_path('data', path)

            if abs_path not in path_map:
                path_map[abs_path] = {
                    'file': UTFFile(abs_path),
                    'ids': self.mat_map[import_id]['ids'],
                    'import_ids': [import_id],
                }
            else:
                path_map[abs_path]['ids'] += self.mat_map[import_id]['ids']
                path_map[abs_path]['import_ids'].append(import_id)
        return path_map

    def _iterate_paths(self):
        for import_id in self.mat_map:
            for path in self.mat_map[import_id]['paths']:
                yield import_id, path


    def _get_textures(self, result_dict):
        path_map = self._get_path_map()

        pack_id = 0
        result_dict['texture_ids'] = {}
        for path in path_map:
            material_ids = list(set(path_map[path]['ids']))

            full_pack = TexturePack(material_ids, [path_map[path]['file']], self)
            textures = full_pack.get_textures()

            if len(textures.keys()) == 0:
                continue

            self.data_files.append(TextureEncoder(pack_id, textures))

            for import_id in path_map[path]['import_ids']:
                if result_dict['ships'][import_id].get('texture_pack_ids') is None:
                    result_dict['ships'][import_id]['texture_pack_ids'] = []
                result_dict['ships'][import_id]['texture_pack_ids'].append(pack_id)

            result_dict['texture_ids'][pack_id] = list(textures.keys())
            pack_id += 1

    def status(self, message):
        _logger.info(message)
