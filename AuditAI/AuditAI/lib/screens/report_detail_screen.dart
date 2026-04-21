import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';
import '../services/audit_service.dart';
import 'reports_screen.dart';
import 'dart:io';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';

class ReportDetailScreen extends StatefulWidget {
  final TransactionAnalysisResult result;
  const ReportDetailScreen({super.key, required this.result});
  @override
  State<ReportDetailScreen> createState() => _ReportDetailScreenState();
}

class _ReportDetailScreenState extends State<ReportDetailScreen> {
  bool _isDownloading = false;

  void _downloadPdf() async {
    setState(() => _isDownloading = true);
    try {
      final pdf = pw.Document();
      pdf.addPage(pw.MultiPage(build: (pw.Context context) => [
        pw.Header(level: 0, text: 'AUDITAI FORENSIC RECORD'),
        pw.Divider(),
        pw.Paragraph(text: 'Date: ${widget.result.createdAt?.toString() ?? 'N/A'}'),
        pw.Paragraph(text: 'Vendor: ${widget.result.extractedData['vendor_name']}'),
        pw.Paragraph(text: 'Amount: INR ${widget.result.extractedData['amount_inr']}'),
        pw.Paragraph(text: 'Category: ${widget.result.extractedData['category']}'),
        pw.Divider(),
        pw.Header(level: 1, text: 'Forensic Verdict'),
        pw.Paragraph(text: 'Status: ${widget.result.riskLevel}'),
        pw.Paragraph(text: 'Anomaly Score: ${widget.result.anomalyScore}%'),
        pw.Paragraph(text: 'Reasoning: ${widget.result.reason}'),
        if (widget.result.suspiciousSignals.isNotEmpty) ...[
          pw.Header(level: 2, text: 'Risk Flags'),
          ...widget.result.suspiciousSignals.map((s) => pw.Bullet(text: s)),
        ],
      ]));
      final output = await getApplicationDocumentsDirectory();
      final filename = "Detail_${widget.result.extractedData['vendor_name']}_${DateTime.now().millisecondsSinceEpoch}.pdf";
      final file = File("${output.path}/$filename");
      await file.writeAsBytes(await pdf.save());
      if (mounted) {
        setState(() => _isDownloading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Report Saved: $filename'), backgroundColor: AuditTheme.cyberTeal));
      }
    } catch (e) {
      if (mounted) setState(() => _isDownloading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    Color color = AuditTheme.cyberTeal;
    if (widget.result.status == 'fake') color = AuditTheme.neonMagenta;
    if (widget.result.status == 'potential_false_positive') color = AuditTheme.alertOrange;

    final dateStr = widget.result.createdAt != null ? widget.result.createdAt!.toString().split('.')[0] : 'Unknown';

    return Scaffold(
      appBar: AppBar(title: const Text('FORENSIC RECORD', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 2, fontSize: 13))),
      extendBodyBehindAppBar: true,
      body: Container(
        decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: isDark ? [const Color(0xFF0F172A), const Color(0xFF0A0F1D)] : [Colors.white, const Color(0xFFF1F5F9)])),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: AuditTheme.glassDecoration(isDark: isDark, accentColor: color),
                  child: Column(children: [
                    Icon(Icons.terminal_rounded, size: 48, color: color),
                    const SizedBox(height: 16),
                    Text(widget.result.extractedData['vendor_name']?.toString() ?? 'Unknown', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white), textAlign: TextAlign.center),
                    Text(dateStr, style: const TextStyle(color: AuditTheme.textSlate, fontSize: 12)),
                    const SizedBox(height: 16),
                    Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6), decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withOpacity(0.3))), child: Text(widget.result.status?.toUpperCase() ?? 'UNK', style: TextStyle(color: color, fontWeight: FontWeight.bold, letterSpacing: 1, fontSize: 11))),
                  ]),
                ),
                const SizedBox(height: 32),

                const Text('FORENSIC REASONING', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AuditTheme.textSlate, letterSpacing: 2)),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: AuditTheme.glassDecoration(isDark: isDark),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.result.reason ?? 'No forensic summary provided.', style: const TextStyle(color: Colors.white, height: 1.6, fontSize: 14)),
                      if (widget.result.suspiciousSignals.isNotEmpty) ...[
                        const Divider(height: 32, color: Colors.white12),
                        const Text('RISK FLAGS', style: TextStyle(color: AuditTheme.neonMagenta, fontSize: 10, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        ...widget.result.suspiciousSignals.map((s) => BulletPoint(text: s)),
                      ],
                    ],
                  ),
                ),
                
                const SizedBox(height: 32),
                _isDownloading
                  ? const Center(child: CircularProgressIndicator(color: AuditTheme.cyberTeal))
                  : ElevatedButton.icon(onPressed: _downloadPdf, icon: const Icon(Icons.picture_as_pdf_rounded), label: const Text('GENERATE SECURE PDF', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5))),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class BulletPoint extends StatelessWidget {
  final String text;
  const BulletPoint({super.key, required this.text});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(children: [
        const Icon(Icons.keyboard_arrow_right, color: AuditTheme.neonMagenta, size: 16),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: const TextStyle(color: Colors.white70, fontSize: 13))),
      ]),
    );
  }
}
