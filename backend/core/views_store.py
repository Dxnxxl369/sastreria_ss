from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from .models import Product, Category, WebOrder, WebOrderItem, Client, User
from .serializers_store import StoreProductSerializer, StoreCategorySerializer, WebOrderSerializer

class StorefrontViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoints públicos para el catálogo
    """
    queryset = Product.objects.filter(is_active_web=True)
    serializer_class = StoreProductSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['get'])
    def categories(self, request):
        cats = Category.objects.all()
        serializer = StoreCategorySerializer(cats, many=True)
        return Response(serializer.data)

class CheckoutViewSet(viewsets.ViewSet):
    """
    Lógica de procesamiento de pedidos web
    """
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def create(self, request):
        data = request.data
        cart = data.get('cart', [])
        client_data = data.get('client')
        order_type = data.get('order_type', 'PURCHASE')

        if not cart:
            return Response({"error": "Carrito vacío"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Crear o recuperar cliente
        email = client_data.get('email')
        client, created = Client.objects.get_or_create(
            email=email,
            defaults={
                'first_name': client_data.get('first_name'),
                'last_name': client_data.get('last_name'),
                'phone': client_data.get('phone'),
                'address': client_data.get('address', '')
            }
        )

        # 2. Crear pedido
        order = WebOrder.objects.create(
            client=client,
            order_type=order_type,
            total=data.get('total', 0),
            payment_method=data.get('payment_method', 'CARD'),
            shipping_address=client_data.get('address', ''),
            fitting_date=data.get('fitting_date')
        )

        # 3. Crear items y descontar stock (opcional aquí o en pago)
        for item in cart:
            product = Product.objects.get(id=item['id'])
            WebOrderItem.objects.create(
                order=order,
                product=product,
                quantity=item['quantity'],
                price_at_order=product.sale_price,
                selected_attributes=item.get('selected_attributes', {})
            )

        return Response({
            "message": "Pedido creado con éxito",
            "order_id": order.id
        }, status=status.HTTP_201_CREATED)
