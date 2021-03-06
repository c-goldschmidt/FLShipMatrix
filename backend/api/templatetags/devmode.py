from django import template
from django.conf import settings

register = template.Library()

# settings value
@register.simple_tag
def setting(setting_name):
    return getattr(settings, setting_name, '')
