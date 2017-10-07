import struct

from django.views.generic.base import View
from django.shortcuts import get_object_or_404
from django.http import HttpResponse

from .utils import JSONResponse, BinaryResponse
from .models import Ship, ShipCategory, ShipModelLOD, Texture


class ShipListView(View):
    def get(self, request, category_id, *args, **kwargs):
        category = get_object_or_404(ShipCategory, id=category_id)
        ships = Ship.objects.filter(category=category)

        return JSONResponse([ship.to_dict() for ship in ships])


class ShipDetailsView(View):
    def get(self, request, ship_id, *args, **kwargs):
        ship = get_object_or_404(Ship, id=ship_id)

        return JSONResponse(ship.to_dict(True))


class ShipModelsView(View):
    def get(self, request, ship_id, lod_name, *args, **kwargs):
        ship = get_object_or_404(Ship, id=ship_id)
        model = get_object_or_404(ShipModelLOD, ship=ship, lod_name=lod_name)

        return BinaryResponse(model.to_binary())


class ShipTexturesView(View):
    def get(self, request, ship_id, tex_id, *args, **kwargs):
        ship = get_object_or_404(Ship, id=ship_id)
        texture = get_object_or_404(Texture, tex_id=tex_id, texture_pack__in=ship.textures.all())
        return BinaryResponse(texture.to_binary())


class CategoryListView(View):
    def get(self, request, *args, **kwargs):
        categories = ShipCategory.get_tree()
        return JSONResponse([cat for cat in categories])


class CategoryDetailView(View):
    def _get_children(self, cat_ids):
        sub_cats = list(
            ShipCategory.objects.filter(parent_category_id__in=cat_ids).values_list('id', flat=True)
        )

        if sub_cats:
            sub_cats += self._get_children(sub_cats)

        return sub_cats

    def _get_ships(self, category_id):
        category = get_object_or_404(ShipCategory, id=category_id)
        
        cat_ids = self._get_children([category_id])
        cat_ids += [category_id]

        cat_dict = category.to_dict()
        cat_dict['ships'] = [ship.to_dict() for ship in Ship.objects.filter(category_id__in=cat_ids)]
        cat_dict['is_leaf'] = len(cat_ids) == 1

        return  JSONResponse(cat_dict)

    def _get_uncategorized_ships(self):
        cat_dict = ShipCategory.get_null_category_dict()
        cat_dict['ships'] = [ship.to_dict() for ship in Ship.objects.filter(category_id__isnull=True)]
        cat_dict['is_leaf'] = True

        return  JSONResponse(cat_dict)

    def get(self, request, category_id=None):
        if category_id == '0' or category_id is None:
            return self._get_uncategorized_ships()
        return self._get_ships(category_id)
