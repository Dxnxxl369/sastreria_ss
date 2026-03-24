import 'package:flutter/material.dart';
import '../core/api.dart';
import 'category_screen.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  List<dynamic> _products = [];
  List<dynamic> _filteredProducts = [];
  List<dynamic> _categories = [];
  bool _isLoading = true;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
    _searchController.addListener(_filterProducts);
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final res = await apiService.getProducts();
      final cats = await apiService.getCategories();
      setState(() {
        _products = res;
        _filteredProducts = res;
        _categories = cats;
      });
    } catch (e) {
      print('Error loading data: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _filterProducts() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filteredProducts = _products.where((p) {
        final name = (p['name'] ?? '').toString().toLowerCase();
        final sku = (p['sku'] ?? '').toString().toLowerCase();
        return name.contains(query) || sku.contains(query);
      }).toList();
    });
  }

  void _showDetailedEdit({dynamic product}) {
    final bool isEdit = product != null;
    final nameC = TextEditingController(text: product?['name']);
    final skuC = TextEditingController(text: product?['sku']);
    final costC = TextEditingController(text: product?['cost_price']?.toString());
    final saleC = TextEditingController(text: product?['sale_price']?.toString());
    final unitC = TextEditingController(text: product?['unit'] ?? 'un');
    
    int? selectedCatId = product != null 
      ? (product['category'] is Map ? product['category']['id'] : product['category'])
      : null;

    Map<String, dynamic> attributes = product != null 
      ? (product['attributes'] is String ? {} : Map<String, dynamic>.from(product['attributes'] ?? {}))
      : {};
    
    if (attributes['variants'] == null) attributes['variants'] = [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final activeCat = _categories.firstWhere((c) => c['id'] == selectedCatId, orElse: () => null);
            final catConfig = activeCat?['field_config'] ?? {};
            final List<dynamic> variants = attributes['variants'];

            double totalStock = variants.isEmpty 
              ? double.tryParse(product?['stock']?.toString() ?? '0') ?? 0
              : variants.fold(0.0, (sum, v) => sum + (double.tryParse(v['stock']?.toString() ?? '0') ?? 0));

            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                left: 24, right: 24, top: 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(isEdit ? 'Editar Producto' : 'Nuevo Producto', style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 20)),
                    const SizedBox(height: 20),
                    
                    // Categoría Selector
                    DropdownButtonFormField<int>(
                      value: selectedCatId,
                      decoration: const InputDecoration(labelText: 'Categoría'),
                      items: _categories.map<DropdownMenuItem<int>>((c) => DropdownMenuItem(value: c['id'] as int, child: Text(c['name']))).toList(),
                      onChanged: (val) {
                        setModalState(() {
                          selectedCatId = val;
                          // Limpiar atributos que no pertenecen a la nueva categoría
                          final newCat = _categories.firstWhere((c) => c['id'] == val);
                          final newConfig = newCat['field_config'] ?? {};
                          final Map<String, dynamic> cleaned = {'variants': attributes['variants'] ?? []};
                          newConfig.keys.forEach((k) {
                            if (!['Usar Costo', 'Usar Venta'].contains(k) && attributes.containsKey(k)) {
                              cleaned[k] = attributes[k];
                            }
                          });
                          attributes = cleaned;
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    
                    TextField(controller: nameC, decoration: const InputDecoration(labelText: 'Nombre')),
                    const SizedBox(height: 12),
                    TextField(controller: skuC, decoration: const InputDecoration(labelText: 'SKU / Código')),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: Colors.grey.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('STOCK TOTAL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                Text(totalStock.toString(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.black)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: TextField(controller: unitC, decoration: const InputDecoration(labelText: 'Unidad'))),
                      ],
                    ),
                    const SizedBox(height: 12),

                    if (catConfig['Usar Costo'] == true)
                      TextField(controller: costC, decoration: const InputDecoration(labelText: 'Costo ($)'), keyboardType: TextInputType.number),
                    if (catConfig['Usar Venta'] == true)
                      const SizedBox(height: 12),
                    if (catConfig['Usar Venta'] == true)
                      TextField(controller: saleC, decoration: const InputDecoration(labelText: 'Precio Venta ($)'), keyboardType: TextInputType.number),

                    // ATRIBUTOS DINÁMICOS
                    const SizedBox(height: 20),
                    const Text('ATRIBUTOS Y VARIANTES', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.indigo)),
                    const Divider(),
                    
                    // Botón Añadir Variante
                    TextButton.icon(
                      onPressed: () {
                        setModalState(() {
                          attributes['variants'].add({'talla': '', 'color': '', 'stock': 0});
                        });
                      },
                      icon: const Icon(Icons.add_box),
                      label: const Text('Añadir Talla/Color (Variante)'),
                    ),

                    // Tabla de Variantes
                    ...attributes['variants'].asMap().entries.map((entry) {
                      int idx = entry.key;
                      Map v = entry.value;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Row(
                          children: [
                            Expanded(child: TextField(
                              decoration: const InputDecoration(hintText: 'Talla', contentPadding: EdgeInsets.symmetric(horizontal: 8)),
                              onChanged: (val) => v['talla'] = val,
                              controller: TextEditingController(text: v['talla']),
                            )),
                            const SizedBox(width: 4),
                            Expanded(child: TextField(
                              decoration: const InputDecoration(hintText: 'Color', contentPadding: EdgeInsets.symmetric(horizontal: 8)),
                              onChanged: (val) => v['color'] = val,
                              controller: TextEditingController(text: v['color']),
                            )),
                            const SizedBox(width: 4),
                            SizedBox(width: 60, child: TextField(
                              decoration: const InputDecoration(hintText: 'Stk', contentPadding: EdgeInsets.symmetric(horizontal: 8)),
                              keyboardType: TextInputType.number,
                              onChanged: (val) => setModalState(() => v['stock'] = double.tryParse(val) ?? 0),
                              controller: TextEditingController(text: v['stock'].toString()),
                            )),
                            IconButton(icon: const Icon(Icons.delete, color: Colors.red, size: 20), onPressed: () => setModalState(() => attributes['variants'].removeAt(idx))),
                          ],
                        ),
                      );
                    }),

                    // Otros campos de la categoría (Dinamicos con tipos)
                    ...catConfig.keys.where((k) => !['Usar Costo', 'Usar Venta'].contains(k)).map((k) {
                      final config = catConfig[k];
                      final isSelect = config is Map && config['type'] == 'select';
                      final List<String> options = (config is Map && config['options'] != null)
                          ? config['options'].toString().split(',').map((e) => e.trim()).toList()
                          : [];

                      return Padding(
                        padding: const EdgeInsets.only(top: 12.0),
                        child: isSelect
                            ? DropdownButtonFormField<String>(
                                value: (attributes[k] != null && options.contains(attributes[k].toString())) ? attributes[k].toString() : null,
                                decoration: InputDecoration(labelText: k),
                                items: options.map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
                                onChanged: (val) => setModalState(() => attributes[k] = val),
                              )
                            : TextField(
                                decoration: InputDecoration(labelText: k),
                                onChanged: (val) => attributes[k] = val,
                                controller: TextEditingController(text: attributes[k]?.toString() ?? ''),
                              ),
                      );
                    }),

                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () async {
                          // LIMPIEZA FINAL antes de enviar
                          final Map<String, dynamic> finalAttributes = {'variants': attributes['variants']};
                          catConfig.keys.forEach((k) {
                            if (!['Usar Costo', 'Usar Venta'].contains(k)) {
                              finalAttributes[k] = attributes[k] ?? '';
                            }
                          });

                          final data = {
                            'name': nameC.text,
                            'sku': skuC.text,
                            'category': selectedCatId,
                            'cost_price': double.tryParse(costC.text) ?? 0,
                            'sale_price': double.tryParse(saleC.text) ?? 0,
                            'stock': totalStock,
                            'unit': unitC.text,
                            'attributes': finalAttributes,
                          };
                          try {
                            if (isEdit) {
                              await apiService.patchProduct(product['id'], data);
                            } else {
                              await apiService.post('/products/', data);
                            }
                            Navigator.pop(context);
                            _loadData();
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Guardado correctamente')));
                          } catch (e) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                          }
                        },
                        child: const Text('GUARDAR PRODUCTO'),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            );
          }
        );
      },
    );
  }

  void _showQuickStockUpdate(dynamic product) {
    final TextEditingController addStockController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Sumar Stock: ${product['name']}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Stock actual: ${product['stock']} ${product['unit'] ?? ''}'),
              const SizedBox(height: 16),
              TextField(
                controller: addStockController,
                keyboardType: TextInputType.number,
                autofocus: true,
                decoration: const InputDecoration(
                  labelText: 'Cantidad a sumar',
                  hintText: 'Ej: 10',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
            ElevatedButton(
              onPressed: () async {
                final double? addVal = double.tryParse(addStockController.text);
                if (addVal != null && addVal > 0) {
                  final newStock = double.parse(product['stock'].toString()) + addVal;
                  try {
                    await apiService.patchProduct(product['id'], {'stock': newStock});
                    Navigator.pop(context);
                    _loadData();
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Stock actualizado')));
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                  }
                }
              },
              child: const Text('Actualizar'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          FloatingActionButton(
            heroTag: 'addProd',
            onPressed: () => _showDetailedEdit(),
            backgroundColor: Colors.indigo,
            child: const Icon(Icons.add, color: Colors.white),
          ),
          const SizedBox(height: 12),
          FloatingActionButton.extended(
            heroTag: 'cats',
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CategoryScreen())).then((_) => _loadData()),
            label: const Text('Categorías'),
            icon: const Icon(Icons.category),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Buscar por nombre o SKU...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Theme.of(context).cardTheme.color,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _loadData,
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _filteredProducts.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final p = _filteredProducts[index];
                        final isLowStock = double.parse(p['stock'].toString()) <= double.parse(p['min_stock_alert']?.toString() ?? '0');
                        final catName = p['category'] is Map ? p['category']['name'] : 'Sin Categoría';
                        
                        return Card(
                          child: ListTile(
                            leading: Container(
                              width: 48, height: 48,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                image: DecorationImage(
                                  image: NetworkImage(ApiService.getImageUrl(p['image'])),
                                  fit: BoxFit.cover,
                                  onError: (_, __) {},
                                ),
                              ),
                              child: p['image'] == null ? const Icon(Icons.inventory_2) : null,
                            ),
                            title: Text(p['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text('CAT: $catName | SKU: ${p['sku']}'),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('${p['stock']} ${p['unit'] ?? ''}', 
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold, 
                                    color: isLowStock ? Colors.red : Colors.indigo,
                                    fontSize: 16
                                  )
                                ),
                                const Icon(Icons.edit, size: 16, color: Colors.grey),
                              ],
                            ),
                            onTap: () => _showDetailedEdit(product: p),
                            onLongPress: () => _showQuickStockUpdate(p),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}