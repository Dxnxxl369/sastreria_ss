import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/notification_provider.dart';
import 'package:intl/intl.dart';

class NotificationList extends StatelessWidget {
  final Function(String type)? onNotificationTap;

  const NotificationList({super.key, this.onNotificationTap});

  String _getNotificationType(dynamic n) {
    final title = n['title'].toString().toLowerCase();
    final message = n['message'].toString().toLowerCase();
    
    if (title.contains('venta') || title.contains('pedido') || message.contains('compra')) {
      return 'pos';
    }
    if (title.contains('cliente') || message.contains('registro')) {
      return 'crm';
    }
    if (title.contains('medida') || message.contains('sastre')) {
      return 'measurements';
    }
    return 'none';
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NotificationProvider>();
    final notifications = provider.notifications;

    return Material(
      elevation: 16,
      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
      child: Container(
        width: double.infinity,
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.6),
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Notificaciones', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  if (notifications.isNotEmpty)
                    TextButton(
                      onPressed: () {
                        // Opcional: Marcar todas como leídas
                      },
                      child: const Text('Ver todas'),
                    ),
                ],
              ),
            ),
            const Divider(height: 1),
            Flexible(
              child: notifications.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.all(40.0),
                      child: Column(
                        children: [
                          Icon(Icons.notifications_none, size: 48, color: Colors.grey),
                          SizedBox(height: 12),
                          Text('No tienes notificaciones', style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    )
                  : ListView.separated(
                      shrinkWrap: true,
                      itemCount: notifications.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final n = notifications[index];
                        final date = DateTime.parse(n['created_at']);
                        final isUnread = !n['is_read'];
                        
                        return InkWell(
                          onTap: () {
                            provider.markAsRead(n['id']);
                            if (onNotificationTap != null) {
                              onNotificationTap!(_getNotificationType(n));
                            }
                          },
                          child: Container(
                            color: isUnread ? Colors.indigo.withOpacity(0.05) : null,
                            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                CircleAvatar(
                                  radius: 20,
                                  backgroundColor: isUnread ? Colors.indigo : Colors.grey[200],
                                  child: Icon(
                                    isUnread ? Icons.notifications_active : Icons.notifications_none,
                                    size: 20,
                                    color: isUnread ? Colors.white : Colors.grey,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        n['title'],
                                        style: TextStyle(
                                          fontWeight: isUnread ? FontWeight.bold : FontWeight.normal,
                                          fontSize: 15,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        n['message'],
                                        style: TextStyle(color: Colors.grey[600], fontSize: 13),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        DateFormat('dd MMM, HH:mm').format(date.toLocal()),
                                        style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}