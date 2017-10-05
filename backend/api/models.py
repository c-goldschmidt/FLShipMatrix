import struct

from collections import defaultdict
from django.db import models


class ShipCategory(models.Model):
    name = models.CharField(max_length=64)
    description = models.TextField(
        blank=True,
        null=True,
    )
    parent_category = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )

    background_image = models.ImageField(
        upload_to='backgrounds/',
        blank=True,
        null=True,
    )

    logo = models.ImageField(
        upload_to='logos/',
        blank=True,
        null=True,
    )

    class Meta:
        verbose_name = "Ship category"
        verbose_name_plural = "Ship categories"
        indexes = [
            models.Index(fields=['parent_category']),
        ]
        ordering = ['parent_category_id', 'name']

    def to_dict(self, tree=False):
        result = {
            'id': self.id,
            'name': self.name,
            'path': str(self),
            'description': self.description,
            'background': '/static/' + self.background_image.url if self.background_image else None,
            'logo': '/static/' + self.logo.url if self.logo else None,
        }

        if tree:
            result['parent_id'] = self.parent_category_id
            result['children'] = []

        return result
    
    @staticmethod
    def get_tree():
        nodes_by_id = {node.id: node.to_dict(True) for node in ShipCategory.objects.iterator()}
        root = {
            'name': 'root',
            'description': 'the root node',
            'children': []
        }

        for node in nodes_by_id.values():
            if node['parent_id'] is None:
                root['children'].append(node)
            else:
                nodes_by_id[node['parent_id']]['children'].append(node)

        return root['children']
    
    def has_bg(self):
        return True if self.background_image else False

    def has_logo(self):
        return True if self.logo else False

    def __str__(self):
        if self.parent_category:
            return str(self.parent_category) + ' > ' + self.name
        return self.name

    def __unicode__(self):
        return self.name


class TexturePack(models.Model):
    pack_id = models.IntegerField()

    def __str__(self):
        return 'TexturePack {}'.format(self.pack_id)


class Ship(models.Model):
    name = models.CharField(max_length=64)
    infocard = models.TextField()
    price = models.BigIntegerField()
    category = models.ForeignKey(
        ShipCategory,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    
    textures = models.ManyToManyField(TexturePack)

    # full info
    max_bats = models.IntegerField()
    max_bots = models.IntegerField()
    hitpoints = models.BigIntegerField()
    hold_size = models.IntegerField()
    weapon_angle =  models.IntegerField()
    mass = models.FloatField()

    torgue_x = models.FloatField()
    torgue_y = models.FloatField()
    torgue_z = models.FloatField()

    drag_x = models.FloatField()
    drag_y = models.FloatField()
    drag_z = models.FloatField()

    inertia_x = models.FloatField()
    inertia_y = models.FloatField()
    inertia_z = models.FloatField()

    nudge = models.FloatField()
    strafe = models.IntegerField()
    strafe_power = models.IntegerField()
    linear_drag = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=['category']),
        ]

    def to_dict(self, extended=False):
        result_dict = {
            'id': self.id,
            'name': self.name,
            'price': self.price,
            'category': self.category.to_dict() if self.category else None,
        }

        if not extended:
            return result_dict

        result_dict.update({
            'infocard': self.infocard,
            'max_bats': self.max_bats,
            'max_bots': self.max_bots,
            'hitpoints': self.hitpoints,
            'hold_size': self.hold_size,
            'weapon_angle': self.weapon_angle,
            'mass': self.mass,
            'torgue_x': self.torgue_x,
            'torgue_y': self.torgue_y,
            'torgue_z': self.torgue_z,
            'drag_x': self.drag_x,
            'drag_y': self.drag_y,
            'drag_z': self.drag_z,
            'inertia_y': self.inertia_y,
            'inertia_x': self.inertia_x,
            'inertia_z': self.inertia_z,
            'nudge': self.nudge,
            'strafe': self.strafe,
            'strafe_power': self.strafe_power,
            'lods': list(ShipModelLOD.objects.filter(
                ship=self).values_list('lod_name', flat=True)),
        })
        return result_dict


class ShipModelLOD(models.Model):
    ship = models.ForeignKey(Ship, on_delete=models.CASCADE)
    lod_name = models.CharField(max_length=10)

    vertices = models.BinaryField()
    normals = models.BinaryField()
    uvs = models.BinaryField()
    materials = models.BinaryField()

    class Meta:
        indexes = [
            models.Index(fields=['ship', 'lod_name']),
        ]

    def to_binary(self):
        data = struct.pack('I', len(self.vertices))
        data += struct.pack('I', len(self.normals))
        data += struct.pack('I', len(self.uvs))
        data += struct.pack('I', len(self.materials))

        data += self.vertices
        data += self.normals
        data += self.uvs
        data += self.materials

        return data


class Texture(models.Model):
    tex_id = models.IntegerField()
    ix = models.IntegerField()
    iy = models.IntegerField()
    inversion = models.BooleanField()
    texture = models.BinaryField()
    texture_pack = models.ForeignKey(
        TexturePack, 
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )

    class Meta:
        indexes = [
            models.Index(fields=['tex_id']),
        ]

    def to_binary(self):
        data = struct.pack('I', self.ix)
        data += struct.pack('I', self.iy)
        data += struct.pack('I', 1 if self.inversion else 0)
        data += self.texture

        return data