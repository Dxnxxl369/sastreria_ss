import 'package:flutter/material.dart';
import '../core/api.dart';

class CategoryScreen extends StatefulWidget {
  const CategoryScreen({super.key});

  @override
  State<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends State<CategoryScreen> {
  List<dynamic> _categories = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    setState(() => _isLoading = true);
    try {
      final res = await apiService.getCategories();
      setState(() => _categories = res);
    } catch (e) {
      print('Error: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showCategoryForm({dynamic category}) {
    final nameC = TextEditingController(text: category?['name']);
    final descC = TextEditingController(text: category?['description']);
    // Map of fields: {field_name: label}
    Map<String, dynamic> fieldConfig = Map<String, dynamic>.from(category?['field_config'] ?? {});
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
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
                    Text(
                      category == null ? 'Nueva Categoría' : 'Editar Categoría',
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 20),
                    ),
                    const SizedBox(height: 20),
                    TextField(controller: nameC, decoration: const InputDecoration(labelText: 'Nombre')),
                    const SizedBox(height: 12),
                    TextField(controller: descC, decoration: const InputDecoration(labelText: 'Descripción')),
                    const SizedBox(height: 20),
                    const Text('Atributos / Campos Personalizados', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    ...fieldConfig.keys.map((key) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(key),
                      trailing: IconButton(
                        icon: const Icon(Icons.remove_circle_outline, color: Colors.red),
                        onPressed: () {
                          setModalState(() => fieldConfig.remove(key));
                        },
                      ),
                    )),
                    TextButton.icon(
                      onPressed: () => _addField(context, (newField) {
                        setModalState(() => fieldConfig[newField] = 'text');
                      }),
                      icon: const Icon(Icons.add),
                      label: const Text('Agregar Campo'),
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () async {
                          final data = {
                            'name': nameC.text,
                            'description': descC.text,
                            'field_config': fieldConfig,
                          };
                          try {
                            if (category == null) {
                              await apiService.createCategory(data);
                            } else {
                              await apiService.patchCategory(category['id'], data);
                            }
                            Navigator.pop(context);
                            _loadCategories();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(category == null ? 'Creada' : 'Actualizada'))
                            );
                          } catch (e) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                          }
                        },
                        child: Text(category == null ? 'Crear Categoría' : 'Guardar Cambios'),
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

  void _addField(BuildContext context, Function(String) onAdd) {
    final fieldC = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Nuevo Campo'),
        content: TextField(controller: fieldC, decoration: const InputDecoration(hintText: 'Nombre del campo (ej: Color, Tela)')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          TextButton(onPressed: () {
            if (fieldC.text.isNotEmpty) {
              onAdd(fieldC.text);
              Navigator.pop(context);
            }
          }, child: const Text('Agregar')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Gestionar Categorías')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCategoryForm(),
        child: const Icon(Icons.add),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final c = _categories[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    title: Text(c['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('${c['description'] ?? 'Sin descripción'}\nCampos: ${c['field_config']?.keys.join(', ') ?? 'Ninguno'}'),
                    isThreeLine: true,
                    trailing: const Icon(Icons.edit, size: 20),
                    onTap: () => _showCategoryForm(category: c),
                  ),
                );
              },
            ),
    );
  }
}