from django import forms
from django.contrib import admin
from django.db.models import TextField, CharField

from api.models import ShipCategory, Ship, ShipModelLOD, Texture


class ShipCategoryAdmin(admin.ModelAdmin):
    model = ShipCategory

    fields = ('name', 'description', 'parent_category', 'background_image', 'logo' )
    search_fields = ('name', )
    list_filter = ('parent_category', )
    ordering = ('name', )
    list_display = ('name', 'parent_category', 'has_bg', 'has_logo')

admin.site.register(ShipCategory, ShipCategoryAdmin)


class ShipAdminForm(forms.ModelForm):
    class Meta:
        model = Ship
        fields = '__all__'


class ShipAdmin(admin.ModelAdmin):
    form = ShipAdminForm
    list_display = ('name', 'category', 'price', 'mass')
    search_fields = ('name', 'category__name', )


class ShipModelLODAdmin(admin.ModelAdmin):
    model = ShipModelLOD

    fields = ('ship', 'lod_name', )
    search_fields = ('lod_name', )
    ordering = ('ship', 'lod_name', )
    list_display = ('ship', 'lod_name', )


class TextureAdmin(admin.ModelAdmin):
    model = Texture

    fields = ('tex_id', 'ix', 'iy', 'inversion')
    readonly_fields = ('tex_id', 'ix', 'iy')
    search_fields = ('tex_id', )
    ordering = ('tex_id', )
    list_display = ('tex_id', 'ix', 'iy', 'inversion')


admin.site.register(Texture, TextureAdmin)
admin.site.register(ShipModelLOD, ShipModelLODAdmin)
admin.site.register(Ship, ShipAdmin)
