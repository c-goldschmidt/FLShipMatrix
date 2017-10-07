from django.core.management.base import BaseCommand
from api.models import ShipModelLOD, Texture


class Command(BaseCommand):
    
    def handle(self, **options):
        for tex in Texture.objects.iterator():
            tex.move_to_static()

        for model in ShipModelLOD.objects.iterator():
            model.move_to_static()
