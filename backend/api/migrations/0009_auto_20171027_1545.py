# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2017-10-27 15:45
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_auto_20171007_1244'),
    ]

    operations = [
        migrations.AddField(
            model_name='texture',
            name='has_bump',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='texture',
            name='has_light',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='texture',
            name='has_meta',
            field=models.BooleanField(default=False),
        ),
    ]
