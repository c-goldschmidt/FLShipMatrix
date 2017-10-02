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
        fl_ini = os.path.join(args.root, 'EXE', 'freelancer.ini')
        if not os.path.isfile(fl_ini):
            raise ParserError('could not find freelancer.ini in EXE folder')
        self.config = ConfigLoader(fl_ini)
        _logger.debug('config loaded')

        self.data_files = []
        

    def run_import(self):
        self.timer = Timer(_logger.info)
        self.timer.step('started')

        ships_data = self._get_ships()
        self.timer.step('data parsed')
        
        content = json.dumps(ships_data).encode('utf-8')
        self.timer.step('data dumped')

        _logger.debug('size: {}'.format(len(content)))

        with open('debug.json', 'wb') as file:
            file.write(content)

        buffer = BytesIO()
        with ZipFile('output.zip', mode='w', compression=ZIP_DEFLATED) as zf:
            zf.writestr('data.json', content)
            self.timer.step('main ship data saved to zip')

            for data_file in self.data_files:
                data_file.write_to_zip(zf)

            self.timer.step('datafiles saved')
        
        self.timer.done('ALL DONE!')
        
    def _get_ships(self):
        ships = self.config.goods.get_by_kv('category', 'ship')

        result_dict = {
            'ships': {},
        }
        material_ids = []
        texture_paths = []
        
        import_id = 0
        for ship in ships:
            hull_name = ship.get('hull')
            hull = self.config.goods.get_by_kv('nickname', hull_name, multiple=False)

            ship_name = hull.get('ship')
            result_dict['ships'][import_id] = {
                'price': hull.get('price'),
            }
            self._get_ship_info(result_dict['ships'][import_id], ship_name)
            mat, tex = self._get_model(result_dict['ships'][import_id], ship_name, import_id)

            material_ids = concat_lists(material_ids, mat)
            texture_paths = concat_lists(texture_paths, tex)

            self.timer.step('ship {} parsed'.format(ship_name))
            import_id += 1

        self.timer.step('all ships parsed')
        self._get_textures(material_ids, texture_paths, result_dict)
        self.timer.step('textures parsed')

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

        self.data_files.append(ModelEncoder(ship_name, import_id, model_data))
        self._get_hardpoints(result_dict, utf)

        mat_paths = shiparch_entry.get('material_library')
        return model.material_ids, mat_paths

    def _get_hardpoints(self, result_dict, model):
        hp_parser = HardpointParser(model, self)
        result_dict['hardpoints'] = hp_parser.hardpoints

    def _get_textures(self, material_ids, texture_paths, result_dict):
        material_ids = list(set(material_ids))
        texture_paths = list(set(texture_paths))
        texture_paths = [self.config.get_absolute_path('data', path) for path in texture_paths]

        textures = [UTFFile(path) for path in texture_paths]
        
        full_pack = TexturePack(material_ids, textures, self)
        self.data_files.append(TextureEncoder(full_pack.get_textures()))
        
        result_dict['texture_ids'] = material_ids

    def status(self, message):
        _logger.info(message)
