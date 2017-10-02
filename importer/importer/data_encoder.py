import struct

class ModelEncoder(object):

    def __init__(self, ship_name, import_id, model_data):
        self.ship_name = ship_name
        self.import_id = import_id
        self.data = model_data

        self.lods = model_data['lods']
    
    def write_to_zip(self, zf):

        for lod_name in self.lods:
            self._write_lod_file(zf, lod_name)
        
        self.data = None
        
    def _write_lod_file(self, zf, lod_name):
        type_name = 'uvs'

        self._write_uv_vert(zf, lod_name, 'uvs', self.data['uvs'])
        self._write_uv_vert(zf, lod_name, 'vertices', self.data['vertices'])
        self._write_normals(zf, lod_name)
        self._write_mat_ids(zf, lod_name)

    def _write_uv_vert(self, zf, lod_name, type_name, data):
        filename = '{}.{}.{}.dat'.format(self.import_id, type_name, lod_name.lower())

        entries = self.data[type_name][lod_name]
        content = struct.pack('I', len(entries))

        for entry in entries:
            length = len(entry)
            content += struct.pack('I', length)
            content += struct.pack('f' * length, *entry)

        zf.writestr(filename, content)

    def _write_normals(self, zf, lod_name):
        filename = '{}.{}.{}.dat'.format(self.import_id, 'normals', lod_name.lower())

        normals = self.data['normals'][lod_name]

        content = struct.pack('I', len(normals))
        for entry in normals:
            
            content += struct.pack('I', len(entry))
            for normal in entry:
                content += struct.pack('f' * 3, *normal)

        zf.writestr(filename, content)

    def _write_mat_ids(self, zf, lod_name):
        filename = '{}.{}.{}.dat'.format(self.import_id, 'materials', lod_name.lower())        
        mat_ids = self.data['materials_per_mesh'][lod_name]

        content = struct.pack('I' * len(mat_ids), *mat_ids)

        zf.writestr(filename, content)

class TextureEncoder(object):
    def __init__(self, textures):
        self.textures = textures

    def write_to_zip(self, zf):
        for tex_id, tex in self.textures.items():
            filename = '{}.tex'.format(tex_id)

            content = struct.pack('I', tex.ix)
            content += struct.pack('I', tex.iy)
            content += struct.pack('?', tex.inversion)
            content += tex.rgb_matrix

            zf.writestr(filename, content)
        
        self.textures = None
