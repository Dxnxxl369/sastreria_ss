import 'package:flutter/material.dart';

class CartItem {
  final dynamic product;
  int quantity;

  CartItem({required this.product, this.quantity = 1});

  double get subtotal => double.parse(product['sale_price'].toString()) * quantity;
}

class CartProvider with ChangeNotifier {
  final List<CartItem> _items = [];
  dynamic _selectedClient;

  List<CartItem> get items => _items;
  dynamic get selectedClient => _selectedClient;

  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);
  double get total => _items.fold(0, (sum, item) => sum + item.subtotal);

  void addItem(dynamic product) {
    final index = _items.indexWhere((item) => item.product['id'] == product['id']);
    if (index >= 0) {
      _items[index].quantity++;
    } else {
      _items.add(CartItem(product: product));
    }
    notifyListeners();
  }

  void removeItem(dynamic product) {
    _items.removeWhere((item) => item.product['id'] == product['id']);
    notifyListeners();
  }

  void updateQuantity(dynamic product, int quantity) {
    final index = _items.indexWhere((item) => item.product['id'] == product['id']);
    if (index >= 0) {
      if (quantity <= 0) {
        _items.removeAt(index);
      } else {
        _items[index].quantity = quantity;
      }
      notifyListeners();
    }
  }

  void selectClient(dynamic client) {
    _selectedClient = client;
    notifyListeners();
  }

  void clear() {
    _items.clear();
    _selectedClient = null;
    notifyListeners();
  }
}