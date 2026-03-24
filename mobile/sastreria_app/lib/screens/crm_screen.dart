import 'package:flutter/material.dart';
import '../core/api.dart';

class CrmScreen extends StatefulWidget {
  const CrmScreen({super.key});

  @override
  State<CrmScreen> createState() => _CrmScreenState();
}

class _CrmScreenState extends State<CrmScreen> {
  List<dynamic> _clients = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadClients();
  }

  Future<void> _loadClients() async {
    setState(() => _isLoading = true);
    try {
      final clients = await apiService.getClients();
      setState(() {
        _clients = clients;
      });
    } catch (e) {
      print('Error loading clients: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showAddClientModal() {
    final first = TextEditingController();
    final last = TextEditingController();
    final email = TextEditingController();
    final phone = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 24,
            right: 24,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Nuevo Cliente', style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 20)),
              const SizedBox(height: 16),
              TextField(controller: first, decoration: const InputDecoration(labelText: 'Nombre')),
              const SizedBox(height: 12),
              TextField(controller: last, decoration: const InputDecoration(labelText: 'Apellido')),
              const SizedBox(height: 12),
              TextField(controller: email, decoration: const InputDecoration(labelText: 'Email')),
              const SizedBox(height: 12),
              TextField(controller: phone, decoration: const InputDecoration(labelText: 'Teléfono')),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    try {
                      await apiService.createClient({
                        'first_name': first.text,
                        'last_name': last.text,
                        'email': email.text,
                        'phone': phone.text,
                      });
                      Navigator.pop(context);
                      _loadClients();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cliente creado')));
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                    }
                  },
                  child: const Text('Guardar Cliente'),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddClientModal,
        child: const Icon(Icons.add),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadClients,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: _clients.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final client = _clients[index];
                  return Card(
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                        child: Text(
                          client['first_name'][0],
                          style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold),
                        ),
                      ),
                      title: Text('${client['first_name']} ${client['last_name']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(client['email'] ?? client['phone'] ?? 'Sin contacto'),
                      trailing: Text(
                        '\$${client['balance'] ?? '0.00'}',
                        style: TextStyle(
                          color: (client['balance'] != null && double.parse(client['balance'].toString()) > 0) ? Colors.red : Colors.green,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
