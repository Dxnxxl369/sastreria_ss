import 'package:flutter/material.dart';
import '../core/api.dart';

class MeasurementScreen extends StatefulWidget {
  const MeasurementScreen({super.key});

  @override
  State<MeasurementScreen> createState() => _MeasurementScreenState();
}

class _MeasurementScreenState extends State<MeasurementScreen> {
  List<dynamic> _measurements = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMeasurements();
  }

  Future<void> _loadMeasurements() async {
    setState(() => _isLoading = true);
    try {
      final measurements = await apiService.getMeasurements();
      final webOrders = await apiService.get('/web-orders/');
      
      // Filtrar: Solo clientes que tengan órdenes pendientes de tipo 'PURCHASE' o que tengan medidas reales
      // En una sastrería real, filtraríamos por órdenes que incluyan 'Saco', 'Traje', etc.
      setState(() {
        _measurements = measurements.where((m) {
          final hasOrder = webOrders.any((o) => o['client'] == m['client'] && o['status'] != 'COMPLETED');
          // Si el cliente tiene alguna medida mayor a 0 en campos clave, asumimos que es un trabajo de sastrería
          final isTailorWork = double.parse(m['sc_largo'].toString()) > 0 || double.parse(m['cintura'].toString()) > 0;
          return hasOrder || isTailorWork;
        }).toList();
      });
    } catch (e) {
      print('Error loading measurements: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Widget _getGarmentIcon(dynamic m) {
    if (double.parse(m['sc_largo'].toString()) > 0) return const Icon(Icons.accessibility_new, color: Colors.white);
    if (double.parse(m['pf_largo'].toString()) > 0) return const Icon(Icons.checkroom, color: Colors.white);
    return const Icon(Icons.straighten, color: Colors.white);
  }

  void _showMeasurementDetails(dynamic measurement) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.5,
          maxChildSize: 0.9,
          builder: (_, controller) {
            return Container(
              padding: const EdgeInsets.all(24.0),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: ListView(
                controller: controller,
                children: [
                  Text('Medidas: ${measurement['client_name'] ?? 'Cliente #${measurement['client']}'}', 
                    style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 22)),
                  const Divider(height: 32),
                  _buildSection('Saco / Chaleco', [
                    'Largo Saco: ${measurement['sc_largo']}',
                    'Entalle: ${measurement['entalle']}',
                    'Espalda: ${measurement['espalda']}',
                    'Hombro: ${measurement['hombro']}',
                    'Manga: ${measurement['manga']}',
                    'Tórax: ${measurement['torax']}',
                    'Abdomen: ${measurement['abdomen']}',
                  ]),
                  const SizedBox(height: 16),
                  _buildSection('Pantalón', [
                    'Cintura: ${measurement['cintura']}',
                    'Cadera: ${measurement['cadera']}',
                    'Largo Pantalón: ${measurement['pf_largo']}',
                    'Entre Pierna: ${measurement['entre_pierna']}',
                    'Muslo: ${measurement['muslo']}',
                    'Rodilla: ${measurement['rodilla']}',
                    'Vota Pie: ${measurement['vota_pie']}',
                  ]),
                  const SizedBox(height: 16),
                  _buildSection('Detalles', [
                    'Detalle Saco: ${measurement['detalle_saco'] ?? ''}',
                    'Detalle Pantalón: ${measurement['detalle_pantalon'] ?? ''}',
                  ]),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildSection(String title, List<String> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.indigo)),
        const SizedBox(height: 8),
        ...items.map((item) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 4.0),
          child: Text(item, style: const TextStyle(fontSize: 16)),
        )),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadMeasurements,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: _measurements.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final m = _measurements[index];
                  return Card(
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Colors.indigo,
                        child: _getGarmentIcon(m),
                      ),
                      title: Text(m['client_name'] ?? 'Cliente #${m['client']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('Actualizado: ${m['last_update'] != null ? m['last_update'].toString().substring(0, 10) : 'N/A'}'),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                      onTap: () => _showMeasurementDetails(m),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
