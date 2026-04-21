import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import '../theme.dart';
import '../globals.dart';
import '../main_navigation.dart';
import '../services/audit_service.dart';
import 'report_detail_screen.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});
  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  List<TransactionAnalysisResult> _history = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    try {
      final history = await AuditService.getAuditHistory();
      setState(() {
        _history = history;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _downloadPdf(TransactionAnalysisResult result) async {
    try {
      final pdf = pw.Document();
      pdf.addPage(pw.MultiPage(build: (pw.Context context) => [
        pw.Header(level: 0, text: 'AUDITAI FORENSIC REPORT'),
        pw.Divider(),
        pw.Paragraph(text: 'Date: ${result.createdAt?.toString() ?? 'N/A'}'),
        pw.Paragraph(text: 'Vendor: ${result.extractedData['vendor_name']}'),
        pw.Paragraph(text: 'Amount: INR ${result.extractedData['amount_inr']}'),
        pw.Paragraph(text: 'Category: ${result.extractedData['category']}'),
        pw.Divider(),
        pw.Header(level: 1, text: 'Forensic Verdict'),
        pw.Paragraph(text: 'Status: ${result.riskLevel}'),
        pw.Paragraph(text: 'Anomaly Score: ${result.anomalyScore}%'),
        pw.Paragraph(text: 'Reasoning: ${result.reason}'),
        if (result.suspiciousSignals.isNotEmpty) ...[
          pw.Header(level: 2, text: 'Risk Flags'),
          ...result.suspiciousSignals.map((s) => pw.Bullet(text: s)),
        ],
      ]));
      final output = await getApplicationDocumentsDirectory();
      final filename = "Audit_${result.extractedData['vendor_name']}_${DateTime.now().millisecondsSinceEpoch}.pdf";
      final file = File("${output.path}/$filename");
      await file.writeAsBytes(await pdf.save());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Report Saved: $filename'), 
          backgroundColor: AuditTheme.cyberTeal,
          action: SnackBarAction(label: 'OK', textColor: Colors.white, onPressed: () {}),
        ));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to generate PDF: $e'), backgroundColor: Colors.red));
    }
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: AppConfig.languageNotifier,
      builder: (context, lang, _) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        final textColor = isDark ? Colors.white : Colors.black87;

        return Scaffold(
          appBar: AppBar(
            title: Text(AppConfig.t('reports'), style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5)), 
            centerTitle: true, backgroundColor: Colors.transparent, elevation: 0,
            leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new_rounded), onPressed: () => context.findAncestorStateOfType<MainNavigationState>()?.setIndex(0)),
          ),
          extendBodyBehindAppBar: true,
          body: Container(
            decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: isDark ? [const Color(0xFF0F172A), const Color(0xFF0A0F1D)] : [Colors.white, const Color(0xFFF1F5F9)])),
            child: SafeArea(
              child: _isLoading 
                ? const Center(child: CircularProgressIndicator(color: AuditTheme.cyberTeal))
                : RefreshIndicator(
                    onRefresh: _fetchHistory,
                    color: AuditTheme.cyberTeal,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(20),
                      itemCount: _history.length,
                      itemBuilder: (context, index) {
                        final result = _history[index];
                        Color color = AuditTheme.cyberTeal;
                        if (result.status == 'proper') color = AuditTheme.cyberTeal;
                        if (result.status == 'fake') color = AuditTheme.neonMagenta;
                        if (result.status == 'potential_false_positive') color = AuditTheme.alertOrange;

                        return InkWell(
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ReportDetailScreen(result: result))),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 20),
                            padding: const EdgeInsets.all(20),
                            decoration: AuditTheme.glassDecoration(isDark: isDark, accentColor: color),
                            child: Row(
                              children: [
                                // Left Icon
                                Container(
                                  padding: const EdgeInsets.all(12), 
                                  decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(16)), 
                                  child: Icon(Icons.analytics_outlined, color: color)
                                ),
                                const SizedBox(width: 16),
                                
                                // Center Info (Expanded so it doesn't squeeze text)
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        result.extractedData['vendor_name']?.toString() ?? 'Unknown', 
                                        style: TextStyle(fontWeight: FontWeight.w800, color: textColor, fontSize: 16),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        result.createdAt != null ? result.createdAt!.toString().split(' ')[0] : 'Unknown Date', 
                                        style: const TextStyle(color: AuditTheme.textSlate, fontSize: 12),
                                      ),
                                      const SizedBox(height: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), 
                                        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)), 
                                        child: Text(
                                          result.status?.toUpperCase() ?? 'UNK', 
                                          style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 9, letterSpacing: 0.5)
                                        )
                                      ),
                                    ],
                                  ),
                                ),
                                
                                // Right Action
                                IconButton(
                                  icon: Icon(Icons.picture_as_pdf_rounded, color: AuditTheme.neonMagenta.withOpacity(0.7)), 
                                  onPressed: () => _downloadPdf(result)
                                ),
                              ],
                            ),
                          ),
                        ).animate().fade(delay: (100 * index).ms).slideX(begin: 0.1);
                      },
                    ),
                  ),
            ),
          ),
        );
      }
    );
  }
}
