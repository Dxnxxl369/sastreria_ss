import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/cart_provider.dart';
import '../core/api.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Carrito de Venta')),
      body: cart.items.isEmpty
          ? const Center(child: Text('El carrito está vacío'))
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    itemCount: cart.items.length,
                    itemBuilder: (context, index) {
                      final item = cart.items[index];
                      return ListTile(
                        leading: Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            image: DecorationImage(
                              image: NetworkImage(ApiService.getImageUrl(item.product['image'])),
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        title: Text(item.product['name']),
                        subtitle: Text('\$${item.product['sale_price']} x ${item.quantity}'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline),
                              onPressed: () => cart.updateQuantity(item.product, item.quantity - 1),
                            ),
                            Text('${item.quantity}'),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline),
                              onPressed: () => cart.updateQuantity(item.product, item.quantity + 1),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                _buildSummary(context, cart),
              ],
            ),
    );
  }

  Widget _buildSummary(BuildContext context, CartProvider cart) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
      ),
      child: Column(
        children: [
          _ClientSelector(cart: cart),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total:', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              Text('\$${cart.total.toStringAsFixed(2)}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.green)),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: cart.selectedClient == null ? null : () => _finishSale(context, cart),
              child: const Text('Finalizar Venta'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _finishSale(BuildContext context, CartProvider cart) async {
    try {
      final saleData = {
        'client': cart.selectedClient['id'],
        'items': cart.items.map((i) => {
          'product': i.product['id'],
          'quantity': i.quantity,
          'price_at_sale': i.product['sale_price']
        }).toList(),
      };
      await apiService.createSale(saleData);
      cart.clear();
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Venta realizada con éxito')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }
}

class _ClientSelector extends StatelessWidget {
  final CartProvider cart;
  const _ClientSelector({required this.cart});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => _selectClient(context),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.withOpacity(0.3)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const Icon(Icons.person_search, color: Colors.indigo),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                cart.selectedClient != null 
                  ? '${cart.selectedClient['first_name']} ${cart.selectedClient['last_name']}'
                  : 'Seleccionar Cliente',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            const Icon(Icons.chevron_right),
          ],
        ),
      ),
    );
  }

  void _selectClient(BuildContext context) async {
    final clients = await apiService.getClients();
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return ListView.builder(
          itemCount: clients.length,
          itemBuilder: (context, index) {
            final c = clients[index];
            return ListTile(
              title: Text('${c['first_name']} ${c['last_name']}'),
              onTap: () {
                cart.selectClient(c);
                Navigator.pop(context);
              },
            );
          },
        );
      },
    );
  }
}