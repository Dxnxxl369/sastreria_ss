import 'dart:async';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'api.dart';

class NotificationProvider with ChangeNotifier {
  List<dynamic> _notifications = [];
  int _unreadCount = 0;
  Timer? _timer;
  final AudioPlayer _audioPlayer = AudioPlayer();
  int? _lastNotificationId;

  List<dynamic> get notifications => _notifications;
  int get unreadCount => _unreadCount;

  NotificationProvider() {
    _startPolling();
  }

  void _startPolling() {
    _fetchNotifications();
    _timer = Timer.periodic(const Duration(seconds: 3), (timer) {
      _fetchNotifications();
    });
  }

  Future<void> _fetchNotifications() async {
    try {
      final res = await apiService.get('/notifications/');
      final newNotifications = res as List<dynamic>;
      
      final unread = newNotifications.where((n) => n['is_read'] == false).toList();
      _unreadCount = unread.length;

      if (unread.isNotEmpty) {
        final newestId = unread[0]['id'];
        if (_lastNotificationId != null && newestId != _lastNotificationId) {
          _playNotificationSound();
        }
        _lastNotificationId = newestId;
      }
      _notifications = newNotifications;
      notifyListeners();
    } catch (e) {
      print('Error polling notifications: $e');
    }
  }

  Future<void> _playNotificationSound() async {
    try {
      await _audioPlayer.stop(); // Stop current if any
      await _audioPlayer.play(
        UrlSource('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'),
        mode: PlayerMode.lowLatency,
      );
    } catch (e) {
      print('Error playing sound: $e');
    }
  }

  Future<void> markAsRead(int id) async {
    try {
      await apiService.patch('/notifications/$id/', {'is_read': true});
      _fetchNotifications();
    } catch (e) {
      print('Error marking read: $e');
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _audioPlayer.dispose();
    super.dispose();
  }
}