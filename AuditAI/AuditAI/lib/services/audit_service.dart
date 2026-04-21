import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_keys.dart';

class TransactionAnalysisResult {
  final String? id;
  final String? riskLevel;
  final int anomalyScore;
  final String? status;
  final String? reason;
  final List<String> suspiciousSignals;
  final Map<String, dynamic> extractedData;
  final String? documentPreview;
  final DateTime? createdAt;

  TransactionAnalysisResult({
    this.id,
    required this.riskLevel,
    required this.anomalyScore,
    required this.status,
    required this.reason,
    required this.suspiciousSignals,
    required this.extractedData,
    this.documentPreview,
    this.createdAt,
  });

  factory TransactionAnalysisResult.fromJson(Map<String, dynamic> json, {String? preview}) {
    final engine = json['fraud_logic_engine'] ?? {};
    final extracted = json['extracted_data'] ?? {};
    
    String rLevel = 'LOW';
    if (engine['status'] == 'fake') rLevel = 'HIGH';
    if (engine['status'] == 'potential_false_positive') rLevel = 'MEDIUM';

    return TransactionAnalysisResult(
      riskLevel: rLevel,
      anomalyScore: (engine['false_positive_score'] ?? 0).toInt(),
      status: engine['status']?.toString(),
      reason: engine['reasoning_summary']?.toString(),
      suspiciousSignals: List<String>.from(engine['risk_flags'] ?? []),
      extractedData: Map<String, dynamic>.from(extracted),
      documentPreview: preview,
      createdAt: DateTime.now(),
    );
  }

  factory TransactionAnalysisResult.fromRawDb(Map<String, dynamic> json) {
    String rLevel = 'LOW';
    if (json['status'] == 'fake') rLevel = 'HIGH';
    if (json['status'] == 'potential_false_positive') rLevel = 'MEDIUM';

    return TransactionAnalysisResult(
      id: json['_id'],
      riskLevel: rLevel,
      anomalyScore: (json['riskScore'] ?? 0).toInt(),
      status: json['status'],
      reason: json['reasoning'],
      suspiciousSignals: List<String>.from(json['riskFlags'] ?? []),
      extractedData: {
        'vendor_name': json['vendorName'],
        'amount_inr': json['amount'],
        'category': json['category'],
      },
      documentPreview: json['documentPreview'],
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
    );
  }
}

class AuditService {
  static const String _baseUrl = ApiKeys.backendUrl;

  /// Autonomous analysis: Just send the file and let AI do everything
  static Future<TransactionAnalysisResult> analyzeDocument(String filePath) async {
    try {
      final url = Uri.parse('$_baseUrl/api/upload-and-analyze');
      var request = http.MultipartRequest('POST', url);
      
      request.files.add(await http.MultipartFile.fromPath('document', filePath));

      final streamedResponse = await request.send().timeout(const Duration(minutes: 5));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final analysis = data['audit_event']?['analysis'] ?? {};
        final preview = data['audit_event']?['document_preview']?.toString();
        return TransactionAnalysisResult.fromJson(analysis, preview: preview);
      } else {
        throw Exception('Analysis failed: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to analyze document: $e');
    }
  }

  /// Analyze a transaction for fraud risk (Legacy - kept for compatibility)
  static Future<TransactionAnalysisResult> analyzeTransaction({
    required String vendor,
    required double amount,
    String? category,
    String? timestamp,
    String? paymentMethod,
  }) async {
    // This is essentially replaced by analyzeDocument, but kept to prevent build breakage
    throw UnimplementedError('Manual analysis is replaced by autonomous document analysis');
  }

  /// Fetch the list of past audit records from the database
  static Future<List<TransactionAnalysisResult>> getAuditHistory() async {
    try {
      final url = Uri.parse('$_baseUrl/api/audit-history');
      final response = await http.get(url).timeout(const Duration(minutes: 2));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => TransactionAnalysisResult.fromRawDb(json)).toList();
      } else {
        throw Exception('Failed to fetch history: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to get audit history: $e');
    }
  }

  /// Ask AuditAI a question about fraud/auditing
  static Future<String> askAuditAi({
    required String message,
    String? context,
  }) async {
    try {
      final url = Uri.parse('$_baseUrl/api/ask-auditai');
      
      final requestBody = {
        'message': message,
        if (context != null) 'context': context,
      };

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(requestBody),
      ).timeout(const Duration(seconds: 120));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['response']?.toString() ?? 'No response from AuditAI';
      } else {
        throw Exception('Failed to get response: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to ask AuditAI: $e');
    }
  }
}
