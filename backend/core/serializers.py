from rest_framework import serializers
from .models import User, Client, MeasurementSheet, Category, Product, Sale, SaleItem, Supplier, PurchaseOrder, PurchaseItem, Notification, WebOrder, WebOrderItem, ShippingZone, StoreConfiguration

# --- CRM ---
class MeasurementSheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeasurementSheet
        fields = '__all__'

class ClientSerializer(serializers.ModelSerializer):
    measurements = MeasurementSheetSerializer(required=False)
    class Meta:
        model = Client
        fields = '__all__'
    
    def create(self, validated_data):
        measurements_data = validated_data.pop('measurements', None)
        client = Client.objects.create(**validated_data)
        if measurements_data:
            MeasurementSheet.objects.create(client=client, **measurements_data)
        else:
            MeasurementSheet.objects.create(client=client)
        return client

    def update(self, instance, validated_data):
        measurements_data = validated_data.pop('measurements', None)
        instance = super().update(instance, validated_data)
        if measurements_data:
            m_instance = instance.measurements
            for attr, value in measurements_data.items():
                setattr(m_instance, attr, value)
            m_instance.save()
        return instance

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name', 'password')
        
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

# --- INVENTORY ---
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'category', 'product_type', 'stock', 'unit', 'min_stock_alert', 'attributes', 'cost_price', 'sale_price', 'is_active_web', 'is_for_sale', 'image']

    def to_internal_value(self, data):
        # Clonar para mutar (QueryDict a Dict común)
        if hasattr(data, 'dict'):
            new_data = data.dict()
        else:
            new_data = data.copy() if hasattr(data, 'copy') else dict(data)

        # Limpieza HCI: FormData envía strings. Convertir 'null'/'undefined'/'' a None
        # para que DRF no falle al validar ForeignKeys o Números.
        for key in list(new_data.keys()):
            val = new_data[key]
            if val in ['null', 'undefined', '']:
                new_data[key] = None
            # Booleans en FormData vienen como "true"/"false" strings
            elif val == 'true': new_data[key] = True
            elif val == 'false': new_data[key] = False

        # Manejar attributes si viene como string (común en FormData)
        import json
        if 'attributes' in new_data and isinstance(new_data['attributes'], str):
            try:
                new_data['attributes'] = json.loads(new_data['attributes'])
            except (ValueError, TypeError):
                pass
        
        return super().to_internal_value(new_data)

# --- SALES ---
class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    class Meta:
        model = SaleItem
        fields = '__all__'

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    client_name = serializers.ReadOnlyField(source='client.__str__')
    
    class Meta:
        model = Sale
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class WebOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    class Meta:
        model = WebOrderItem
        fields = '__all__'

class WebOrderSerializer(serializers.ModelSerializer):
    items = WebOrderItemSerializer(many=True, read_only=True)
    client_name = serializers.ReadOnlyField(source='client.__str__')
    shipping_zone_name = serializers.ReadOnlyField(source='shipping_zone.name')
    class Meta:
        model = WebOrder
        fields = '__all__'

class ShippingZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingZone
        fields = '__all__'

class StoreConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreConfiguration
        fields = '__all__'

# --- PURCHASES ---
class PurchaseItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseItem
        fields = '__all__'

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True, read_only=True)
    class Meta:
        model = PurchaseOrder
        fields = '__all__'
