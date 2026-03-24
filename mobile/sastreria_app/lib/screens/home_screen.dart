import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/auth_provider.dart';
import '../core/theme_provider.dart';
import 'pos_screen.dart';
import 'crm_screen.dart';
import 'measurement_screen.dart';
import 'inventory_screen.dart';

import '../core/notification_provider.dart';
import '../widgets/notification_list.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  bool _isNotificationsOpen = false;
  late AnimationController _notificationController;
  late Animation<Offset> _notificationOffset;

  @override
  void initState() {
    super.initState();
    _notificationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _notificationOffset = Tween<Offset>(
      begin: const Offset(0, -1),
      end: const Offset(0, 0),
    ).animate(CurvedAnimation(
      parent: _notificationController,
      curve: Curves.easeOutBack,
    ));
  }

  @override
  void dispose() {
    _notificationController.dispose();
    super.dispose();
  }

  void _toggleNotifications() {
    setState(() {
      _isNotificationsOpen = !_isNotificationsOpen;
      if (_isNotificationsOpen) {
        _notificationController.forward();
      } else {
        _notificationController.reverse();
      }
    });
  }

  void _handleNotificationTap(String type, String role) {
    _toggleNotifications();
    
    int targetIndex = -1;
    if (type == 'pos' && (role == 'VENDEDOR' || role == 'ADMIN')) targetIndex = 0;
    if (type == 'crm' && (role == 'VENDEDOR' || role == 'ADMIN')) targetIndex = 1;
    if (type == 'measurements') targetIndex = (role == 'VENDEDOR' || role == 'ADMIN') ? 2 : 0;

    if (targetIndex != -1) {
      setState(() {
        _currentIndex = targetIndex;
      });
    }
  }

  List<Widget> _getScreens(String role) {
    if (role == 'VENDEDOR' || role == 'ADMIN') {
      return const [
        PosScreen(),
        CrmScreen(),
        MeasurementScreen(),
        InventoryScreen(),
      ];
    } else {
      return const [
        MeasurementScreen(),
      ];
    }
  }

  List<BottomNavigationBarItem> _getNavItems(String role) {
    if (role == 'VENDEDOR' || role == 'ADMIN') {
      return const [
        BottomNavigationBarItem(icon: Icon(Icons.shopping_cart), label: 'POS'),
        BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Clientes'),
        BottomNavigationBarItem(icon: Icon(Icons.straighten), label: 'Medidas'),
        BottomNavigationBarItem(icon: Icon(Icons.inventory), label: 'Almacén'),
      ];
    } else {
      return const [
        BottomNavigationBarItem(icon: Icon(Icons.straighten), label: 'Medidas / Trabajo'),
      ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final role = user?['role'] ?? 'VENDEDOR';
    final screens = _getScreens(role);
    final navItems = _getNavItems(role);

    return Scaffold(
      appBar: AppBar(
        title: const Text('EliteTailor', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: Badge(
              label: Text('${context.watch<NotificationProvider>().unreadCount}'),
              isLabelVisible: context.watch<NotificationProvider>().unreadCount > 0,
              child: const Icon(Icons.notifications),
            ),
            onPressed: _toggleNotifications,
          ),
          IconButton(
            icon: Icon(
              context.watch<ThemeProvider>().isDarkMode ? Icons.light_mode : Icons.dark_mode,
            ),
            onPressed: () {
              context.read<ThemeProvider>().toggleTheme();
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              context.read<AuthProvider>().logout();
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          screens[_currentIndex],
          if (_isNotificationsOpen)
            GestureDetector(
              onTap: _toggleNotifications,
              child: Container(
                color: Colors.black26,
                width: double.infinity,
                height: double.infinity,
              ),
            ),
          SlideTransition(
            position: _notificationOffset,
            child: Align(
              alignment: Alignment.topCenter,
              child: NotificationList(
                onNotificationTap: (type) => _handleNotificationTap(type, role),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: navItems.length > 1 ? BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: navItems,
        selectedItemColor: Theme.of(context).primaryColor,
        unselectedItemColor: Colors.grey,
      ) : null,
    );
  }
}
