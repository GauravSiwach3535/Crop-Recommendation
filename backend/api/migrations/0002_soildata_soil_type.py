from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='soildata',
            name='soil_type',
            field=models.CharField(
                choices=[
                    ('Alluvial', 'Alluvial'),
                    ('Black', 'Black'),
                    ('Sandy', 'Sandy'),
                    ('Laterite', 'Laterite'),
                    ('Mountain', 'Mountain'),
                ],
                default='Alluvial',
                max_length=20,
            ),
        ),
    ]
