import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import '../theme.dart';
import '../globals.dart';
import '../main_navigation.dart';
import 'report_detail_screen.dart';

class Report {
  final String title;
  final String date;
  final String status;
  final String summary;
  final List<Map<String, String>> transactions;
  bool isDownloading = false;

  Report(this.title, this.date, this.status, {this.summary = '', this.transactions = const []});
}

class GlobalReports {
  static List<Report> list = [
    Report('Q3 Financial Review', 'Oct 15, 2026', 'Completed',
      summary: 'Analyzed 847 transactions across 12 vendors. Found 3 duplicate invoices and 1 suspicious payment pattern from Acme Corp totaling \$45,200.',
      transactions: [
        {'vendor': 'Acme Corp', 'amount': '\$45,200', 'type': 'FRAUD', 'detail': 'Amount 300% above historical average'},
        {'vendor': 'Supplies Inc', 'amount': '\$1,500', 'type': 'LEGIT', 'detail': 'Standard monthly order'},
      ]),
    Report('Vendor Risk Assessment', 'Nov 02, 2026', 'In Progress',
      summary: 'Cross-referencing 24 active vendors against compliance databases.',
      transactions: [
        {'vendor': 'Global Trades', 'amount': '\$89,000', 'type': 'FRAUD', 'detail': 'Shell company pattern detected'},
      ]),
  ];
}

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});
  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final _titleController = TextEditingController();
  final _summaryController = TextEditingController();
  String _selectedStatus = 'Completed';

  void _showAddReportDialog() {
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: AuditTheme.surfaceGlass,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Text('CREATE AUDIT LOG', style: TextStyle(color: AuditTheme.cyberTeal, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildField(_titleController, 'Report Name', Icons.edit_document),
              const SizedBox(height: 16),
              _buildField(_summaryController, 'Overview', Icons.info_outline_rounded, lines: 3),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedStatus,
                dropdownColor: AuditTheme.surfaceGlass,
                style: const TextStyle(color: Colors.white),
                decoration: _inputDecoration('Priority Level'),
                items: ['Completed', 'In Progress', 'Flagged'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (val) { if (val != null) setDialogState(() => _selectedStatus = val); },
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('DISCARD', style: TextStyle(color: AuditTheme.textSlate))),
            ElevatedButton(
              onPressed: () {
                if (_titleController.text.isNotEmpty) {
                  setState(() => GlobalReports.list.insert(0, Report(_titleController.text, 'Today', _selectedStatus, summary: _summaryController.text, transactions: [{'vendor': 'Manual Entry', 'amount': '\$0', 'type': 'LEGIT', 'detail': 'Entry Created'}])));
                  _titleController.clear(); _summaryController.clear();
                  Navigator.pop(context);
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: AuditTheme.cyberTeal),
              child: const Text('INITIALIZE', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField(TextEditingController ctrl, String lab, IconData icon, {int lines = 1}) {
    return TextField(
      controller: ctrl, maxLines: lines,
      style: const TextStyle(color: Colors.white),
      decoration: _inputDecoration(lab).copyWith(prefixIcon: Icon(icon, color: AuditTheme.cyberTeal, size: 20)),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label, labelStyle: const TextStyle(color: AuditTheme.textSlate, fontSize: 13),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: AuditTheme.textSlate.withOpacity(0.2))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AuditTheme.cyberTeal)),
    );
  }

  void _downloadPdf(Report report) async {
    setState(() => report.isDownloading = true);
    try {
      final pdf = pw.Document();
      pdf.addPage(pw.MultiPage(build: (pw.Context context) => [
        pw.Header(level: 0, text: 'AUDITAI SECURE REPORT'),
        pw.Paragraph(text: 'ID: ${report.title} | ${report.date}'),
        pw.Paragraph(text: 'SUMMARY: ${report.summary}')
      ]));
      final output = await getApplicationDocumentsDirectory();
      final file = File("${output.path}/${report.title.replaceAll(' ', '_')}.pdf");
      await file.writeAsBytes(await pdf.save());
      if (mounted) {
        setState(() => report.isDownloading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Saved: ${file.path}'), backgroundColor: AuditTheme.cyberTeal));
      }
    } catch (e) {
      if (mounted) setState(() => report.isDownloading = false);
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
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: GlobalReports.list.length,
                itemBuilder: (context, index) {
                  final report = GlobalReports.list[index];
                  Color color = AuditTheme.textSlate;
                  if (report.status == 'Completed') color = AuditTheme.cyberTeal;
                  if (report.status == 'In Progress') color = AuditTheme.alertOrange;
                  if (report.status == 'Flagged') color = AuditTheme.neonMagenta;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: AuditTheme.glassDecoration(isDark: isDark, accentColor: color),
                    child: ListTile(
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ReportDetailScreen(report: report))),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      leading: Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(16)), child: Icon(Icons.analytics_outlined, color: color)),
                      title: Text(report.title, style: TextStyle(fontWeight: FontWeight.w800, color: textColor)),
                      subtitle: Text(report.date, style: const TextStyle(color: AuditTheme.textSlate, fontSize: 12)),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)), child: Text(report.status, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 10))),
                          const SizedBox(width: 8),
                          IconButton(icon: Icon(Icons.picture_as_pdf_rounded, color: AuditTheme.neonMagenta.withOpacity(0.7)), onPressed: () => _downloadPdf(report)),
                        ],
                      ),
                    ),
                  ).animate().fade(delay: (100 * index).ms).slideX(begin: 0.1);
                },
              ),
            ),
          ),
          floatingActionButton: Padding(
            padding: const EdgeInsets.only(bottom: 90),
            child: FloatingActionButton(
              onPressed: _showAddReportDialog,
              backgroundColor: AuditTheme.cyberTeal,
              child: const Icon(Icons.add_rounded, color: Colors.white, size: 30),
            ),
          ),
        );
      }
    );
  }
}
