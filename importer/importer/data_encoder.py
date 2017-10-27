import struct
import json
from .pyfl_utils.models.texturepack import TexturePack

class ModelEncoder(object):

    def __init__(self, ship_name, import_id, model_data):
        self.ship_name = ship_name
        self.import_id = import_id
        self.data = model_data

        self.lods = model_data['lods']
    
    def write_to_zip(self, zf):
        inventory = []
        for lod_name in self.lods:
            inventory += self._write_lod_file(zf, lod_name)
        
        self.data = None
        return inventory
        
    def _write_lod_file(self, zf, lod_name):
        type_name = 'uvs'

        inventory = []
        inventory.append(self._write_uv_vert(zf, lod_name, 'uvs', self.data['uvs']))
        inventory.append(self._write_uv_vert(zf, lod_name, 'vertices', self.data['vertices']))
        inventory.append(self._write_normals(zf, lod_name))
        inventory.append(self._write_mat_ids(zf, lod_name))

        return inventory

    def _write_uv_vert(self, zf, lod_name, type_name, data):
        filename = '{}.{}.{}.dat'.format(self.import_id, type_name, lod_name.lower())

        entries = self.data[type_name][lod_name]
        content = struct.pack('I', len(entries))

        for entry in entries:
            length = len(entry)
            content += struct.pack('I', length)
            content += struct.pack('f' * length, *entry)

        zf.writestr(filename, content)
        return filename

    def _write_normals(self, zf, lod_name):
        filename = '{}.{}.{}.dat'.format(self.import_id, 'normals', lod_name.lower())

        normals = self.data['normals'][lod_name]

        content = struct.pack('I', len(normals))
        for entry in normals:
            
            content += struct.pack('I', len(entry))
            for normal in entry:
                content += struct.pack('f' * 3, *normal)

        zf.writestr(filename, content)
        return filename

    def _write_mat_ids(self, zf, lod_name):
        filename = '{}.{}.{}.dat'.format(self.import_id, 'materials', lod_name.lower())        
        mat_ids = self.data['materials_per_mesh'][lod_name]

        content = struct.pack('I' * len(mat_ids), *mat_ids)

        zf.writestr(filename, content)
        return filename

class TextureEncoder(object):
    def __init__(self, pack_id, material_ids, mat_path, parent):
        self.textures = None
        self.additions = None
        self.meta = None
        self.pack_id = pack_id
        self.material_ids = material_ids
        self.mat_path = mat_path
        self.parent = parent

    def load(self):
        full_pack = TexturePack(self.material_ids, [self.mat_path], self.parent)
        self.textures = full_pack.get_textures()
        self.additions = full_pack.get_additions()
        self.meta = full_pack.get_meta()

    def write_to_zip(self, zf):
        self.load()

        inventory = []
        for tex_id, tex in self.textures.items():
            self._write_texture(zf, tex_id, tex, inventory)

            for key in self.additions[tex_id]:
                self._write_texture(zf, '{}.{}'.format(tex_id, key), self.additions[tex_id][key], inventory)

            if tex_id in self.meta:
                self._write_meta(zf, tex_id, self.meta[tex_id], inventory)

        self.textures = None
        self.additions = None
        return inventory

    def _write_meta(self, zf, tex_id, data, inventory):
        filename = '{}.{}.meta.tex'.format(self.pack_id, tex_id)
        content = json.dumps(data)

        zf.writestr(filename, content)
        inventory.append(filename)

    def _write_texture(self, zf, tex_id, tex, inventory):
        filename = '{}.{}.tex'.format(self.pack_id, tex_id)

        content = struct.pack('I', tex.ix)
        content += struct.pack('I', tex.iy)
        content += struct.pack('?', tex.inversion)
        content += tex.rgb_matrix

        zf.writestr(filename, content)
        inventory.append(filename)
