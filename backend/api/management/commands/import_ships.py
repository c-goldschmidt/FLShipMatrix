import json
import struct
import math

from django.core.management.base import BaseCommand
from django.db import transaction
from zipfile import ZipFile

from api.models import Ship, ShipModelLOD, Texture, TexturePack

class Command(BaseCommand):

    DIRECT_FIELDS = {
        'name': 'name',
        'infocard': 'infocard',
        'price': 'price',
        'hold_size': 'hold_size',
        'nanobot_limit': 'max_bots',
        'shield_battery_limit': 'max_bats', 
        'max_bank_angle': 'weapon_angle', 
        'hit_pts': 'hitpoints', 
        'strafe_force': 'strafe', 
        'strafe_power_usage': 'strafe_power', 
        'linear_drag': 'linear_drag',
        'nudge_force': 'nudge', 
        'mass': 'mass', 
    }

    TRIPLET_FIELDS = {
        'steering_torque': 'torgue',
        'angular_drag': 'drag',
        'rotation_inertia': 'inertia',
    }
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default=None,
            help='File to import.',
        )
        parser.add_argument(
            '--flush',
            action='store_true',
            default=False,
            help='delete all old ships',
        )  

    @transaction.atomic
    def handle(self, **options):
        filename = options.get('file')
        flush = options.get('flush', False)

        if flush:
            Ship.objects.all().delete()
            TexturePack.objects.all().delete()
            

        with ZipFile(filename, 'r') as zf:
            ship_data = json.loads(zf.read('data.json').decode('utf-8'))
            pack_by_pack_id = self._import_textures(zf, ship_data['texture_ids'])
            self._import_ships(zf, ship_data['ships'], pack_by_pack_id)

    @classmethod
    def _import_ships(cls, zf, data, pack_by_pack_id):
        for import_id in data:
            cls._import_ship(zf, data[import_id], import_id, pack_by_pack_id)
            data[import_id] = None


    @classmethod
    def _import_ship(cls, zf, data, import_id, pack_by_pack_id):
        full_data = {}

        for key, target in cls.DIRECT_FIELDS.items():
            full_data[target] = data[key][0] if isinstance(data[key], list) else data[key]
        
        for key, target in cls.TRIPLET_FIELDS.items():
            parts = data[key].split(',')

            full_data[target + '_x'] = math.floor(float(parts[0]))
            full_data[target + '_y'] = math.floor(float(parts[1]))
            full_data[target + '_z'] = math.floor(float(parts[2]))

        ship = Ship.objects.create(**full_data)

        for pack_id in data['texture_pack_ids']:
            ship.textures.add(pack_by_pack_id[pack_id])

        for lod_name in data['model_data']['lods']:
            cls._import_model(zf, ship, lod_name, import_id)

    @staticmethod
    def _import_model(zf, ship, lod_name, import_id):
        ShipModelLOD.objects.create(**{
            'ship': ship,
            'lod_name': lod_name,
        })

        vertices = zf.read('{}.vertices.{}.dat'.format(import_id, lod_name.lower()))
        normals = zf.read('{}.normals.{}.dat'.format(import_id, lod_name.lower()))
        uvs = zf.read('{}.uvs.{}.dat'.format(import_id, lod_name.lower()))
        materials = zf.read('{}.materials.{}.dat'.format(import_id, lod_name.lower()))

        data = struct.pack('I', len(vertices))
        data += struct.pack('I', len(normals))
        data += struct.pack('I', len(uvs))
        data += struct.pack('I', len(materials))
        data += vertices
        data += normals
        data += uvs
        data += materials
        
        filename = 'static/models/{}.{}.dat'.format(ship.id,  lod_name)
        with open(filename, 'wb') as handle:
            handle.write(data)

    @classmethod
    def _import_textures(cls, zf, texture_ids):
        pack_by_pack_id = {}
        for pack_id in texture_ids:
            pack = TexturePack.objects.create(pack_id=pack_id)
            pack_by_pack_id[int(pack_id)] = pack

            for tex_id in texture_ids[pack_id]:
                try:
                    tex_data = zf.read('{}.{}.tex'.format(pack_id, tex_id))
                except KeyError:
                    print('could not find {}.{}.tex'.format(pack_id, tex_id))
                    continue

                additions = cls._load_additions(zf, pack, pack_id, tex_id)

                data = {
                    'tex_id': tex_id,
                    'texture_pack': pack,
                }
                data.update(additions)

                new_tex = Texture.objects.create(**data)

                filename = 'static/textures/{}.{}.tex'.format(pack.id, tex_id)
                with open(filename, 'wb') as handle:
                    handle.write(tex_data)

        return pack_by_pack_id

    @classmethod
    def _load_additions(cls, zf, pack, pack_id, tex_id):
        result = {}
        for adds in ['light', 'bump', 'meta']:
            try:
                tex_data = zf.read('{}.{}.{}.tex'.format(pack_id, tex_id, adds))

                filename = 'static/textures/{}.{}.{}.tex'.format(pack.id, tex_id, adds)
                with open(filename, 'wb') as handle:
                    handle.write(tex_data)

                result['has_{}'.format(adds)] = True
            except KeyError:
                pass

        return result
