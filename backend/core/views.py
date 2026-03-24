from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.db.models import Sum, Count, F
from django.utils import timezone
from .models import (
    User, Client, MeasurementSheet, Category, Product, Sale, SaleItem, 
    Supplier, PurchaseOrder, Notification, WebOrder, WebOrderItem,
    ShippingZone, StoreConfiguration
)
from .serializers import (
    UserSerializer, ClientSerializer, MeasurementSheetSerializer, 
    CategorySerializer, ProductSerializer, SaleSerializer, 
    SaleItemSerializer, PurchaseOrderSerializer, NotificationSerializer, 
    WebOrderSerializer, ShippingZoneSerializer, StoreConfigurationSerializer
)

class IsAdminRole(permissions.BasePermission):
    """
    Permite el acceso solo a usuarios con rol ADMIN.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class StoreConfigurationViewSet(viewsets.ModelViewSet):
    queryset = StoreConfiguration.objects.all()
    serializer_class = StoreConfigurationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StoreConfiguration.objects.filter(pk=1)

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'create', 'destroy']:
            return [IsAdminRole()]
        return [permissions.AllowAny()]

class ShippingZoneViewSet(viewsets.ModelViewSet):
    queryset = ShippingZone.objects.filter(active=True)
    serializer_class = ShippingZoneSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminRole()]
        return [permissions.AllowAny()]

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        Notification.objects.filter(is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

class WebOrderViewSet(viewsets.ModelViewSet):
    queryset = WebOrder.objects.all()
    serializer_class = WebOrderSerializer

    def create(self, request, *args, **kwargs):
        from django.db import transaction
        config = StoreConfiguration.get_solo()
        
        with transaction.atomic():
            client_id = request.data.get('client')
            items_data = request.data.get('items', [])
            shipping_address = request.data.get('shipping_address', '')
            shipping_zone_id = request.data.get('shipping_zone')
            
            # Buscar cliente por user_id ya que el frontend envía el ID del usuario logueado
            client = Client.objects.get(user_id=client_id)
            
            # Lógica de Logística Dinámica
            shipping_cost = Decimal('0.00')
            shipping_zone = None
            
            if shipping_zone_id:
                if not config.shipping_active:
                    return Response(
                        {"error": "Por condiciones climáticas, temporalmente solo aceptamos Recojo en Tienda"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                shipping_zone = ShippingZone.objects.get(id=shipping_zone_id)
                shipping_cost = shipping_zone.base_price
                
                if config.rain_mode_active:
                    shipping_cost += config.rain_surcharge
            
            subtotal = sum(float(item['price_at_order']) * float(item['quantity']) for item in items_data)
            total = Decimal(str(subtotal)) + shipping_cost
            
            order = WebOrder.objects.create(
                client=client, 
                total=total, 
                shipping_address=shipping_address,
                shipping_zone=shipping_zone,
                shipping_cost=shipping_cost,
                order_type='PURCHASE',
                status='PENDING'
            )
            
            for item_data in items_data:
                product = Product.objects.get(id=item_data['product'])
                WebOrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=item_data['quantity'],
                    price_at_order=item_data['price_at_order']
                )
            
            # Crear notificación para el vendedor
            Notification.objects.create(
                title="Nuevo Pedido Web",
                message=f"El cliente {client.first_name} ha realizado un pedido por ${total}.",
                link=f"/admin/orders/{order.id}"
            )
            
            serializer = self.get_serializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'role': user.role,
            'first_name': user.first_name,
            'last_name': user.last_name
        })

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

class MeasurementSheetViewSet(viewsets.ModelViewSet):
    queryset = MeasurementSheet.objects.all()
    serializer_class = MeasurementSheetSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def parse_attributes(self, request):
        """Convierte attributes de string a dict si viene de un FormData"""
        if 'attributes' in request.data and isinstance(request.data['attributes'], str):
            import json
            try:
                # Clonamos para poder modificar
                data = request.data.copy()
                data['attributes'] = json.loads(request.data['attributes'])
                return data
            except:
                pass
        return request.data

    def create(self, request, *args, **kwargs):
        data = self.parse_attributes(request)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        data = self.parse_attributes(request)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer

    def create(self, request, *args, **kwargs):
        # Transacción atómica para evitar ventas incompletas
        from django.db import transaction
        with transaction.atomic():
            client_id = request.data.get('client')
            seller_id = request.data.get('seller')
            items_data = request.data.get('items', [])
            
            client = Client.objects.get(id=client_id)
            seller = User.objects.get(id=seller_id)
            
            total = sum(float(item['price_at_sale']) * float(item['quantity']) for item in items_data)
            
            sale = Sale.objects.create(client=client, seller=seller, total=total)
            
            for item_data in items_data:
                product = Product.objects.get(id=item_data['product'])
                quantity = item_data['quantity']
                # Check stock first
                if product.stock < float(quantity):
                    return Response({'error': f'Stock insuficiente para {product.name}'}, status=status.HTTP_400_BAD_REQUEST)

                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=quantity,
                    price_at_sale=item_data['price_at_sale']
                )
            
            serializer = self.get_serializer(sale)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

class DashboardStatsView(APIView):
    def get(self, request):
        # Ventas físicas + Ventas Web
        pos_sales = Sale.objects.aggregate(Sum('total'))['total__sum'] or 0
        web_sales = WebOrder.objects.filter(status='COMPLETED').aggregate(Sum('total'))['total__sum'] or 0
        total_sales = Decimal(str(pos_sales)) + Decimal(str(web_sales))
        
        active_clients = Client.objects.count()
        critical_stock_count = Product.objects.filter(stock__lte=F('min_stock_alert')).count()
        
        # Órdenes web pendientes de procesar
        ready_orders = WebOrder.objects.filter(status='PENDING').count()
        
        return Response({
            'total_sales': total_sales,
            'active_clients': active_clients,
            'critical_stock': critical_stock_count,
            'ready_orders': ready_orders
        })

class SalesReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Obtener todas las ventas (POS) con detalles
        sales = Sale.objects.select_related('client', 'seller').prefetch_related('pos_items__product').order_by('-date')
        
        report_data = []
        for sale in sales:
            items = []
            for item in sale.pos_items.all():
                items.append({
                    'product': item.product.name,
                    'quantity': item.quantity,
                    'price': item.price_at_sale,
                    'subtotal': float(item.quantity) * float(item.price_at_sale)
                })
            
            report_data.append({
                'id': sale.id,
                'type': 'POS',
                'date': sale.date,
                'client': f"{sale.client.first_name} {sale.client.last_name}",
                'seller': sale.seller.username,
                'total': sale.total,
                'items': items
            })

        # Sumar también órdenes web completadas
        web_orders = WebOrder.objects.filter(status='COMPLETED').select_related('client').prefetch_related('items__product').order_by('-created_at')
        for order in web_orders:
            items = []
            for item in order.items.all():
                items.append({
                    'product': item.product.name,
                    'quantity': item.quantity,
                    'price': item.price_at_order,
                    'subtotal': float(item.quantity) * float(item.price_at_order)
                })
            
            report_data.append({
                'id': order.id,
                'type': 'WEB',
                'date': order.created_at,
                'client': f"{order.client.first_name} {order.client.last_name}",
                'seller': 'Online Store',
                'total': order.total,
                'items': items
            })

        # Ordenar todo por fecha descendente
        report_data.sort(key=lambda x: x['date'], reverse=True)

        return Response(report_data)

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
