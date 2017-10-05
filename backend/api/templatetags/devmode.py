from django import template
from django.conf import settings

register = template.Library()

# settings value
@register.simple_tag
def devmode():
    return settings.IS_DEV_MODE
