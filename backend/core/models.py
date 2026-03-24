from django.db import models, transaction
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import MinValueValidator
from django.db.models import F
from decimal import Decimal

# ==========================================
# MÓDULO 1: USUARIOS Y CLIENTES (CRM)
# ==========================================

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Administrador'),
        ('SASTRE', 'Sastre'),
        ('VENDEDOR', 'Vendedor'),
        ('CLIENT', 'Cliente Web'),
    )
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='VENDEDOR')

class Client(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='client_profile')
    code = models.CharField(max_length=50, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    test_date = models.DateField(null=True, blank=True)
    delivery_date = models.DateField(null=True, blank=True)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    deposit = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class MeasurementSheet(models.Model):
    client = models.OneToOneField(Client, on_delete=models.CASCADE, related_name='measurements')
    color = models.CharField(max_length=50, blank=True)
    quantity = models.IntegerField(default=1)
    
    # Saco / Chaleco
    sc_largo = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    entalle = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    espalda = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    hombro = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    manga = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    torax = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    abdomen = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    alto_busto = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    chaleco = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    
    # Pantalón / Falda
    cintura = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    cadera = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    pf_largo = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    entre_pierna = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    muslo = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    rodilla = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    vota_pie = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    caja = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    largo_falda = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    
    # Detalles específicos
    detalle_saco = models.TextField(blank=True)
    detalle_pantalon = models.TextField(blank=True)
    detalle_chaleco = models.TextField(blank=True)
    detalle_falda = models.TextField(blank=True)
    
    modelo_detalle = models.TextField(blank=True) # General
    last_update = models.DateTimeField(auto_now=True)

@receiver(post_save, sender=User)
def create_client_profile(sender, instance, created, **kwargs):
    if created and instance.role == 'CLIENT':
        # Intentar buscar un cliente existente por email para vincularlo
        client = Client.objects.filter(email=instance.email).first()
        
        if client:
            if not client.user:
                client.user = instance
                client.save()
        else:
            client = Client.objects.create(
                user=instance,
                first_name=instance.first_name,
                last_name=instance.last_name,
                email=instance.email,
            )
        
        # Asegurar que tenga hoja de medidas
        if client and not hasattr(client, 'measurements'):
            MeasurementSheet.objects.create(client=client)

@receiver(post_save, sender=Client)
def create_measurement_sheet_for_client(sender, instance, created, **kwargs):
    if created and not hasattr(instance, 'measurements'):
        MeasurementSheet.objects.create(client=instance)

# ==========================================
# MÓDULO 2: INVENTARIO (WMS)
# ==========================================

class Category(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    field_config = models.JSONField(default=dict, blank=True)
    class Meta:
        verbose_name_plural = "Categories"
    def __str__(self): return self.name

class Product(models.Model):
    TYPE_CHOICES = (('RAW', 'Materia Prima'), ('FINISHED', 'Producto Terminado'))
    name = models.CharField(max_length=200, null=True, blank=True)
    sku = models.CharField(max_length=50, unique=True, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=True)
    product_type = models.CharField(max_length=10, choices=TYPE_CHOICES, null=True, blank=True)
    stock = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    unit = models.CharField(max_length=20, null=True, blank=True)
    min_stock_alert = models.DecimalField(max_digits=10, decimal_places=2, default=5.0, null=True, blank=True)
    attributes = models.JSONField(default=dict, blank=True, null=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0, null=True, blank=True)
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0, null=True, blank=True)
    # Web fields
    is_active_web = models.BooleanField(default=True)
    is_for_sale = models.BooleanField(default=False)
    image = models.ImageField(upload_to='products/', null=True, blank=True)

# ==========================================
# MÓDULO 4: LOGÍSTICA Y CONFIGURACIÓN
# ==========================================

class ShippingZone(models.Model):
    name = models.CharField(max_length=100)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} (${self.base_price})"

class StoreConfiguration(models.Model):
    shipping_active = models.BooleanField(default=True)
    rain_mode_active = models.BooleanField(default=False)
    rain_surcharge = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)

    class Meta:
        verbose_name = "Configuración de Tienda"

    def save(self, *args, **kwargs):
        self.pk = 1 # Garantiza que solo haya una fila
        super().save(*args, **kwargs)

    @classmethod
    def get_solo(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

class WebOrder(models.Model):
    TYPES = (('PURCHASE', 'Compra'), ('RESERVATION', 'Reserva'))
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    shipping_zone = models.ForeignKey(ShippingZone, on_delete=models.SET_NULL, null=True, blank=True)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    order_type = models.CharField(max_length=20, choices=TYPES, default='PURCHASE')
    status = models.CharField(max_length=20, default='PENDING')
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    payment_method = models.CharField(max_length=50, blank=True)
    shipping_address = models.TextField(blank=True)
    fitting_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class WebOrderItem(models.Model):
    order = models.ForeignKey(WebOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    price_at_order = models.DecimalField(max_digits=12, decimal_places=2)
    selected_attributes = models.JSONField(default=dict)

@receiver(post_save, sender=WebOrderItem)
def handle_web_stock_deduction(sender, instance, created, **kwargs):
    if created:
        with transaction.atomic():
            Product.objects.filter(id=instance.product.id).update(stock=F('stock') - instance.quantity)
            recipe_items = instance.product.recipe.all()
            for item in recipe_items:
                needed_qty = item.required_quantity * instance.quantity
                Product.objects.filter(id=item.raw_material.id).update(stock=F('stock') - needed_qty)

class Notification(models.Model):
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    link = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ['-created_at']

# (Siguen modelos de Sale, PurchaseOrder, etc. - Manteniéndolos para no romper integridad)
class ProductRecipe(models.Model):
    finished_product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='recipe')
    raw_material = models.ForeignKey(Product, on_delete=models.CASCADE)
    required_quantity = models.DecimalField(max_digits=10, decimal_places=2)

class Sale(models.Model):
    client = models.ForeignKey(Client, on_delete=models.PROTECT)
    seller = models.ForeignKey(User, on_delete=models.PROTECT)
    date = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='pos_items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    price_at_sale = models.DecimalField(max_digits=12, decimal_places=2)

@receiver(post_save, sender=SaleItem)
def handle_stock_deduction(sender, instance, created, **kwargs):
    if created:
        with transaction.atomic():
            Product.objects.filter(id=instance.product.id).update(stock=F('stock') - instance.quantity)
            recipe_items = instance.product.recipe.all()
            for item in recipe_items:
                needed_qty = item.required_quantity * instance.quantity
                Product.objects.filter(id=item.raw_material.id).update(stock=F('stock') - needed_qty)

# ==========================================
# MÓDULO 3: PROVEEDORES Y COMPRAS
# ==========================================

class Supplier(models.Model):
    name = models.CharField(max_length=200)
    contact_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return self.name

class PurchaseOrder(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pendiente'),
        ('RECEIVED', 'Recibido'),
        ('CANCELLED', 'Cancelado'),
    )
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, null=True, blank=True)
    order_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)

class PurchaseItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items', null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cost_at_purchase = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
