import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:convert';
import 'dart:io';
import '../theme.dart';
import '../globals.dart';
import '../services/audit_service.dart';

class TransactionAnalyzerScreen extends StatefulWidget {
  const TransactionAnalyzerScreen({super.key});

  @override
  State<TransactionAnalyzerScreen> createState() => _TransactionAnalyzerScreenState();
}

class _TransactionAnalyzerScreenState extends State<TransactionAnalyzerScreen> {
  TransactionAnalysisResult? _analysisResult;
  bool _isAnalyzing = false;
  XFile? _selectedImage;
  final ImagePicker _picker = ImagePicker();
  
  // Zomato-like loading messages
  final List<String> _loadingMessages = [
    "🔍 Scanning document text...",
    "🛡️  Verifying vendor authenticity...",
    "🕒  Checking for temporal anomalies...",
    "📊  Cross-referencing category amounts...",
    "🤖  Ollama is forensic auditing...",
    "✨  Finalizing risk assessment..."
  ];
  int _messageIndex = 0;
  late Stream<int> _messageStream;

  Future<void> _analyzeTransaction() async {
    if (_selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload a screenshot or document first'), backgroundColor: Colors.orange)
      );
      return;
    }

    setState(() {
      _isAnalyzing = true;
      _messageIndex = 0;
    });

    // Cycle messages every 2 seconds
    _messageStream = Stream.periodic(const Duration(seconds: 2), (i) => (i + 1) % _loadingMessages.length);

    try {
      final result = await AuditService.analyzeDocument(_selectedImage!.path);

      setState(() {
        _analysisResult = result;
        _isAnalyzing = false;
      });

    } catch (e) {
      setState(() => _isAnalyzing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red)
      );
    }
  }

  Color _getRiskColor(String? riskLevel) {
    switch (riskLevel?.toUpperCase()) {
      case 'HIGH': return Colors.red;
      case 'MEDIUM': return Colors.orange;
      case 'LOW': return Colors.green;
      default: return Colors.grey;
    }
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    setState(() => _selectedImage = image);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Stack(
      children: [
        Scaffold(
          appBar: AppBar(
            title: const Text('Forensic Analyzer', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1)),
            centerTitle: true,
            backgroundColor: Colors.transparent,
            elevation: 0,
          ),
          extendBodyBehindAppBar: true,
          body: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: isDark
                    ? [const Color(0xFF0F172A), const Color(0xFF0A0F1D)]
                    : [Colors.white, const Color(0xFFF1F5F9)]
              ),
            ),
            child: SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Autonomous Audit', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black87)),
                    const SizedBox(height: 8),
                    Text('Upload a physical receipt or digital invoice and let AuditAI extract the truth.', style: TextStyle(fontSize: 14, color: isDark ? Colors.white70 : Colors.black54)),
                    const SizedBox(height: 32),

                    // Receipt Image Upload Area
                    GestureDetector(
                      onTap: _pickImage,
                      child: Container(
                        height: 180,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          border: Border.all(color: AuditTheme.electricIndigo, width: 2, style: BorderStyle.solid),
                          borderRadius: BorderRadius.circular(16),
                          color: AuditTheme.electricIndigo.withOpacity(0.05),
                        ),
                        child: _selectedImage == null 
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.cloud_upload, size: 48, color: AuditTheme.electricIndigo),
                                  const SizedBox(height: 12),
                                  const Text('Tap to upload receipt/bill', style: TextStyle(color: AuditTheme.electricIndigo, fontWeight: FontWeight.w700)),
                                ],
                              ),
                            )
                          : ClipRRect(
                              borderRadius: BorderRadius.circular(14),
                              child: Image.file(File(_selectedImage!.path), fit: BoxFit.cover),
                            ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    if (_selectedImage != null)
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isAnalyzing ? null : _analyzeTransaction,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AuditTheme.electricIndigo,
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 4,
                          ),
                          child: const Text('Perform Forensic Audit', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white)),
                        ),
                      ),

                    const SizedBox(height: 40),

                    // Analysis Results
                    if (_analysisResult != null) _buildAnalysisResult(isDark),
                  ],
                ),
              ),
            ),
          ),
        ),
        
        // Zomato-style Loading Overlay
        if (_isAnalyzing) _buildLoadingOverlay(isDark),
      ],
    );
  }

  Widget _buildLoadingOverlay(bool isDark) {
    return Container(
      color: (isDark ? const Color(0xFF0F172A) : Colors.white).withOpacity(0.95),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(
              width: 100,
              height: 100,
              child: CircularProgressIndicator(color: AuditTheme.electricIndigo, strokeWidth: 8),
            ).animate(onPlay: (controller) => controller.repeat()).rotate(duration: 2.seconds),
            const SizedBox(height: 40),
            StreamBuilder<int>(
              stream: _messageStream,
              builder: (context, snapshot) {
                final index = snapshot.data ?? 0;
                return Text(
                  _loadingMessages[index],
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87),
                ).animate(key: ValueKey(index)).fadeIn().slideY(begin: 0.2);
              }
            ),
            const SizedBox(height: 20),
            const Text('This usually takes 10-20 seconds...', style: TextStyle(color: AuditTheme.textSlate, fontSize: 12)),
          ],
        ),
      ),
    ).animate().fadeIn();
  }

  Future<void> _submitFeedback(String feedback) async {
    if (_analysisResult?.id == null) return;
    try {
      await AuditService.submitFeedback(_analysisResult!.id!, feedback);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Verification updated: ${feedback.replaceAll('_', ' ').toUpperCase()}'),
          backgroundColor: feedback == 'true_scam' ? AuditTheme.neonMagenta : AuditTheme.cyberTeal
        )
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Feedback failed: $e')));
    }
  }

  Widget _buildAnalysisResult(bool isDark) {
    final result = _analysisResult!;
    final riskColor = _getRiskColor(result.riskLevel);
    final extData = result.extractedData;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. Original Document Preview
        if (result.documentPreview != null) ...[
          Text('ORIGINAL DOCUMENT', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AuditTheme.textSlate, letterSpacing: 1.2)),
          const SizedBox(height: 12),
          Container(
            height: 200,
            width: double.infinity,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.memory(
                base64Decode(result.documentPreview!.split(',')[1]),
                fit: BoxFit.cover,
              ),
            ),
          ).animate().fadeIn(),
          const SizedBox(height: 32),
        ],

        // 2. Extracted Meta-Data Card
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: isDark ? Colors.white.withOpacity(0.05) : Colors.white,
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('AI-EXTRACTED DATA', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AuditTheme.electricIndigo, letterSpacing: 1.5)),
              const SizedBox(height: 16),
              _buildExtractedRow('Vendor', extData['vendor_name']?.toString() ?? 'Unknown', Icons.store),
              _buildExtractedRow('Amount', '₹${extData['amount_inr']?.toString() ?? '0.00'}', Icons.currency_rupee),
              _buildExtractedRow('Category', extData['category']?.toString() ?? 'Others', Icons.category),
              _buildExtractedRow('Timestamp', extData['transaction_timestamp']?.toString() ?? 'Now', Icons.schedule),
            ],
          ),
        ).animate().fadeIn().moveY(begin: 20),
        
        const SizedBox(height: 24),

        // 3. Double Score Section (Forensic & False Positive)
        Row(
          children: [
            Expanded(child: _buildScoreSquare('RISK SCORE', '${result.anomalyScore}%', riskColor)),
            const SizedBox(width: 16),
            Expanded(child: _buildScoreSquare('FALSE POSITIVE', '${result.falsePositiveScore}%', Colors.blue)),
          ],
        ).animate().fadeIn(delay: 100.ms).moveY(begin: 20),

        const SizedBox(height: 24),

        // 4. USER FEEDBACK Section (NEW)
        Container(
          padding: const EdgeInsets.all(16),
          decoration: AuditTheme.glassDecoration(isDark: isDark, accentColor: Colors.white24),
          child: Column(
            children: [
              const Text('VERIFY AI ACCURACY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AuditTheme.textSlate, letterSpacing: 1.5)),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _submitFeedback('true_scam'),
                      icon: const Icon(Icons.gavel_rounded, size: 16),
                      label: const Text('TRUE SCAM', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11)),
                      style: OutlinedButton.styleFrom(foregroundColor: AuditTheme.neonMagenta, side: const BorderSide(color: AuditTheme.neonMagenta)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _submitFeedback('false_positive'),
                      icon: const Icon(Icons.verified_user_rounded, size: 16),
                      label: const Text('FALSE POSITIVE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11)),
                      style: OutlinedButton.styleFrom(foregroundColor: AuditTheme.cyberTeal, side: const BorderSide(color: AuditTheme.cyberTeal)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ).animate().fadeIn(delay: 150.ms).moveY(begin: 20),

        const SizedBox(height: 24),

        // 5. Forensic Assessment Card
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: riskColor, width: 2),
            color: riskColor.withOpacity(0.05),
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.security, color: riskColor, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('VERDICT', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: riskColor, letterSpacing: 1.2)),
                        Text(result.riskLevel ?? 'UNKNOWN', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: riskColor)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text('Forensic Summary', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black87)),
              const SizedBox(height: 8),
              Text(result.reason ?? 'No summary provided', style: TextStyle(fontSize: 13, color: isDark ? Colors.white70 : Colors.black54, height: 1.4)),

              if (result.suspiciousSignals.isNotEmpty) ...[
                const SizedBox(height: 20),
                Text('Risk Flags Detected', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black87)),
                const SizedBox(height: 12),
                ...result.suspiciousSignals.map((signal) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Icon(Icons.warning_amber_rounded, size: 18, color: riskColor),
                      const SizedBox(width: 10),
                      Expanded(child: Text(signal, style: TextStyle(fontSize: 13, color: isDark ? Colors.white70 : Colors.black54, fontWeight: FontWeight.w600))),
                    ],
                  ),
                )),
              ],
            ],
          ),
        ).animate().fadeIn(delay: 200.ms).moveY(begin: 20),
      ],
    );
  }

  Widget _buildScoreSquare(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: color, letterSpacing: 1)),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: color)),
        ],
      ),
    );
  }

  Widget _buildExtractedRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AuditTheme.textSlate),
          const SizedBox(width: 8),
          Text('$label:', style: const TextStyle(fontSize: 13, color: AuditTheme.textSlate, fontWeight: FontWeight.w600)),
          const SizedBox(width: 8),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700), textAlign: TextAlign.right)),
        ],
      ),
    );
  }
}
