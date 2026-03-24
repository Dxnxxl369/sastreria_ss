import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String host = '192.168.3.39';
  static const String baseUrl = 'http://$host:8000/api';

  static String getImageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    final cleanPath = path.startsWith('/') ? path : '/$path';
    return 'http://$host:8000$cleanPath';
  }

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Token $token',
    };
  }

  Future<dynamic> post(String endpoint, Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: await _getHeaders(),
      body: jsonEncode(data),
    );
    return _processResponse(response);
  }

  Future<dynamic> get(String endpoint) async {
    final response = await http.get(
      Uri.parse('$baseUrl$endpoint'),
      headers: await _getHeaders(),
    );
    return _processResponse(response);
  }

  Future<dynamic> put(String endpoint, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$baseUrl$endpoint'),
      headers: await _getHeaders(),
      body: jsonEncode(data),
    );
    return _processResponse(response);
  }

  Future<dynamic> patch(String endpoint, Map<String, dynamic> data) async {
    final response = await http.patch(
      Uri.parse('$baseUrl$endpoint'),
      headers: await _getHeaders(),
      body: jsonEncode(data),
    );
    return _processResponse(response);
  }

  dynamic _processResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return jsonDecode(response.body);
    } else {
      throw Exception('Error ${response.statusCode}: ${response.body}');
    }
  }

  // Específicos
  Future<Map<String, dynamic>> login(String username, String password) async {
    return await post('/auth/login/', {'username': username, 'password': password});
  }

  Future<List<dynamic>> getClients() async {
    return await get('/clients/');
  }

  Future<List<dynamic>> getProducts() async {
    return await get('/products/');
  }

  Future<dynamic> createSale(Map<String, dynamic> data) async {
    return await post('/sales/', data);
  }
  
  Future<dynamic> createClient(Map<String, dynamic> data) async {
    return await post('/clients/', data);
  }

  Future<List<dynamic>> getMeasurements() async {
    return await get('/measurements/');
  }

  Future<dynamic> updateMeasurement(int id, Map<String, dynamic> data) async {
    return await put('/measurements/$id/', data);
  }

  Future<List<dynamic>> getCategories() async {
    return await get('/categories/');
  }

  Future<dynamic> createCategory(Map<String, dynamic> data) async {
    return await post('/categories/', data);
  }

  Future<dynamic> updateCategory(int id, Map<String, dynamic> data) async {
    return await put('/categories/$id/', data);
  }

  Future<dynamic> patchCategory(int id, Map<String, dynamic> data) async {
    return await patch('/categories/$id/', data);
  }

  Future<dynamic> updateProduct(int id, Map<String, dynamic> data) async {
    return await put('/products/$id/', data);
  }

  Future<dynamic> patchProduct(int id, Map<String, dynamic> data) async {
    return await patch('/products/$id/', data);
  }
}

final apiService = ApiService();