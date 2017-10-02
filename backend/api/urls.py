from .views import CategoryDetailView, CategoryListView, ShipListView, ShipDetailsView, ShipModelsView, ShipTexturesView
from django.conf.urls import url


category_rx = r'categories/(?P<category_id>\d+)'
ship_rx = r'ships/(?P<ship_id>\d+)'

urlpatterns = [
    url(r'^categories$', CategoryListView.as_view()),
    url(r'^{}$'.format(category_rx), CategoryDetailView.as_view()),
    url(r'^{}/ships$'.format(category_rx), ShipListView.as_view()),
    url(r'^{}$'.format(ship_rx), ShipDetailsView.as_view()),
    url(r'^{}/model/(?P<lod_name>.+)$'.format(ship_rx), ShipModelsView.as_view()),
    url(r'^textures/(?P<tex_id>\d+)$', ShipTexturesView.as_view()),
]