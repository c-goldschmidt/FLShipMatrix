import struct
import os

from collections import defaultdict
from django.db import models
from django.conf import settings


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
        upload_to='static/backgrounds/',
        blank=True,
        null=True,
    )

    logo = models.ImageField(
        upload_to='static/logos/',
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

    @staticmethod
    def _get_path(element):
        return '{}{}'.format(settings.FL_PATH_PREFIX, element)

    def to_dict(self, tree=False):
        result = {
            'id': self.id,
            'name': self.name,
            'path': str(self),
            'description': self.description,
            'background': self._get_path(self.background_image) if self.background_image else None,
            'logo': self._get_path(self.logo) if self.logo else None,
        }

        if tree:
            result['parent_id'] = self.parent_category_id
            result['children'] = []

        return result
    
    @staticmethod
    def get_null_category_dict(tree = False):
        result = {
            'id': 0,
            'name': 'Uncathegorized',
            'path': 'Uncathegorized',
            'description': 'Ships that are not yet categorized',
            'background': None,
            'logo': None,
            'children': [],
            'parent_id': None,
        }

        if tree:
            result['parent_id'] = None
            result['children'] = []

        return result

    @staticmethod
    def get_tree():
        nodes_by_id = {node.id: node.to_dict(True) for node in ShipCategory.objects.iterator()}
        root = {
            'children': [],
        }

        sorted_nodes = list(nodes_by_id.values())
        sorted_nodes.sort(key=lambda x: x['path'])

        for node in sorted_nodes:
            if node['parent_id'] is None:
                root['children'].append(node)
            else:
                nodes_by_id[node['parent_id']]['children'].append(node)

        root['children'].append(ShipCategory.get_null_category_dict(True))

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
            'category': self.category.to_dict() if self.category else ShipCategory.get_null_category_dict(),
        }

        if not extended:
            return result_dict

        lods = self.get_lods()

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
            'lods': lods,
            'static_model_paths': {
                lod: '{}static/models/{}.{}.dat'.format(settings.FL_PATH_PREFIX, self.id, lod)
                for lod in lods
            },
            'static_texture_paths': self.get_texture_paths()
        })
        return result_dict

    def get_lods(self):
        return list(ShipModelLOD.objects.filter(ship=self).values_list('lod_name', flat=True))

    def get_texture_paths(self):
        result = {}
        for tex in self.textures.all():
            tex_ids = tex.texture_set.values_list('tex_id', flat=True)
            
            tex_data = {
                tex_id: '{}static/textures/{}.{}.tex'.format(settings.FL_PATH_PREFIX, tex.id, tex_id)
                for tex_id in tex_ids
            }
            result.update(tex_data)
        return result


class ShipModelLOD(models.Model):
    ship = models.ForeignKey(Ship, on_delete=models.CASCADE)
    lod_name = models.CharField(max_length=10)

    class Meta:
        indexes = [
            models.Index(fields=['ship', 'lod_name']),
        ]


class Texture(models.Model):
    tex_id = models.IntegerField()
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
