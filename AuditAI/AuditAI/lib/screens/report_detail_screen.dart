import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';
import 'reports_screen.dart';
import 'dart:io';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';

class ReportDetailScreen extends StatefulWidget {
  final Report report;
  const ReportDetailScreen({super.key, required this.report});
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
        pw.Header(level: 0, text: 'SECURE AUDIT RECORD'),
        pw.Paragraph(text: 'ID: ${widget.report.title}'),
      ]));
      final output = await getApplicationDocumentsDirectory();
      final file = File("${output.path}/${widget.report.title.replaceAll(' ', '_')}.pdf");
      await file.writeAsBytes(await pdf.save());
      if (mounted) {
        setState(() => _isDownloading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Saved: ${file.path}'), backgroundColor: AuditTheme.cyberTeal));
      }
    } catch (e) {
      if (mounted) setState(() => _isDownloading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    Color color = AuditTheme.cyberTeal;
    if (widget.report.status == 'Flagged') color = AuditTheme.neonMagenta;
    if (widget.report.status == 'In Progress') color = AuditTheme.alertOrange;

    return Scaffold(
      appBar: AppBar(title: const Text('REPORT DATA', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 2, fontSize: 13))),
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
                    Text(widget.report.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white), textAlign: TextAlign.center),
                    Text(widget.report.date, style: const TextStyle(color: AuditTheme.textSlate, fontSize: 12)),
                    const SizedBox(height: 16),
                    Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6), decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withOpacity(0.3))), child: Text(widget.report.status, style: TextStyle(color: color, fontWeight: FontWeight.bold, letterSpacing: 1, fontSize: 11))),
                  ]),
                ),
                const SizedBox(height: 32),
                const Text('EXECUTIVE SUMMARY', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AuditTheme.textSlate, letterSpacing: 2)),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: AuditTheme.glassDecoration(isDark: isDark),
                  child: Text(widget.report.summary.isNotEmpty ? widget.report.summary : 'No summary provided.', style: const TextStyle(color: Colors.white, height: 1.6, fontSize: 14)),
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
