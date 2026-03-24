from rest_framework import serializers
from .models import Product, Category, WebOrder, WebOrderItem, Client, User

class StoreCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class StoreProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'category_name', 'sale_price', 'image', 'attributes']

class WebOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebOrderItem
        fields = '__all__'

class WebOrderSerializer(serializers.ModelSerializer):
    items = WebOrderItemSerializer(many=True, read_only=True)
    class Meta:
        model = WebOrder
        fields = '__all__'
