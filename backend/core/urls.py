from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomAuthToken, UserViewSet, ClientViewSet, MeasurementSheetViewSet,
    CategoryViewSet, ProductViewSet, SaleViewSet, DashboardStatsView, PurchaseOrderViewSet,
    NotificationViewSet, WebOrderViewSet, ShippingZoneViewSet, StoreConfigurationViewSet,
    SalesReportView
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'measurements', MeasurementSheetViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'sales', SaleViewSet)
router.register(r'purchases', PurchaseOrderViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'web-orders', WebOrderViewSet)
router.register(r'shipping-zones', ShippingZoneViewSet)
router.register(r'store-config', StoreConfigurationViewSet)

urlpatterns = [
    path('auth/login/', CustomAuthToken.as_view(), name='auth_login'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('sales-report/', SalesReportView.as_view(), name='sales_report'),
    path('', include(router.urls)),
]
