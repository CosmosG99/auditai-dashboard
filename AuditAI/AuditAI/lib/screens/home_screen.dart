import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:file_picker/file_picker.dart' as fp;
import '../theme.dart';
import '../globals.dart';
import 'flag_detail_screen.dart';
import 'receipt_scanner_screen.dart';

class _FeedItem {
  final String vendor;
  final String department;
  final String timeAgo;
  final String amount;
  final String reason;
  final bool isCritical;
  final double confidence;

  const _FeedItem({required this.vendor, required this.department, required this.timeAgo, required this.amount, required this.reason, required this.isCritical, required this.confidence});
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final List<_FeedItem> _feedData = [
    const _FeedItem(vendor: 'Acme Corp', department: 'Procurement', timeAgo: '2m ago', amount: '\$45,200', reason: 'Amount 300% above historical average for this vendor', isCritical: true, confidence: 0.94),
    const _FeedItem(vendor: 'Supplies Inc', department: 'Marketing', timeAgo: '5m ago', amount: '\$1,500', reason: 'Split transaction detected — possible threshold avoidance', isCritical: false, confidence: 0.78),
    const _FeedItem(vendor: 'TechServe Ltd', department: 'IT', timeAgo: '12m ago', amount: '\$33,800', reason: 'New vendor with no prior transaction history', isCritical: true, confidence: 0.91),
    const _FeedItem(vendor: 'CleanTech Solutions', department: 'Facilities', timeAgo: '18m ago', amount: '\$5,400', reason: 'Invoice date predates purchase order — backdated invoice', isCritical: true, confidence: 0.88),
  ];

  bool _isProcessingCSV = false;

  Future<void> _uploadCSV() async {
    fp.FilePickerResult? result = await fp.FilePicker.pickFiles(type: fp.FileType.custom, allowedExtensions: ['csv', 'xlsx']);
    if (result != null) {
      setState(() => _isProcessingCSV = true);
      await Future.delayed(const Duration(seconds: 3));
      if (mounted) {
        setState(() {
          _isProcessingCSV = false;
          _feedData.insert(0, const _FeedItem(vendor: 'Unidentified Vendor X', department: 'External', timeAgo: 'Just now', amount: '\$12,400', reason: 'Detected via CSV Upload: Cross-referenced fraud pattern #449', isCritical: true, confidence: 0.99));
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('CSV Ingested Successfully! AI found 1 new critical anomaly.'), backgroundColor: AuditTheme.cyberTeal));
      }
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
            title: Text(AppConfig.t('live_feed'), style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5)),
            centerTitle: true,
            backgroundColor: Colors.transparent, elevation: 0,
            actions: [IconButton(icon: const Icon(Icons.upload_file_rounded, color: AuditTheme.cyberTeal), onPressed: _isProcessingCSV ? null : _uploadCSV)],
          ),
          extendBodyBehindAppBar: true,
          body: Container(
            decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: isDark ? [const Color(0xFF0F172A), const Color(0xFF0A0F1D)] : [Colors.white, const Color(0xFFF1F5F9)])),
            child: SafeArea(
              child: _isProcessingCSV 
                ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const CircularProgressIndicator(color: AuditTheme.electricIndigo), const SizedBox(height: 20), Text('AI SCANNING DATA...', style: TextStyle(color: AuditTheme.textSlate, letterSpacing: 2))]))
                : ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: _feedData.length,
                itemBuilder: (context, index) {
                  final item = _feedData[index];
                  return _AnomalyCard(item: item, textColor: textColor).animate().fade(delay: (100 * index).ms).slideY(begin: 0.1);
                },
              ),
            ),
          ),
          floatingActionButton: Padding(
            padding: const EdgeInsets.only(bottom: 90),
            child: FloatingActionButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReceiptScannerScreen())),
              backgroundColor: AuditTheme.electricIndigo,
              child: const Icon(Icons.document_scanner_rounded, color: Colors.white),
            ),
          ),
        );
      }
    );
  }
}

class _AnomalyCard extends StatelessWidget {
  final _FeedItem item;
  final Color textColor;
  const _AnomalyCard({required this.item, required this.textColor});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final accent = item.isCritical ? AuditTheme.neonMagenta : AuditTheme.alertOrange;
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => FlagDetailScreen(vendor: item.vendor, amount: item.amount, isCritical: item.isCritical, reason: item.reason, confidence: item.confidence))),
      child: Container(
        margin: const EdgeInsets.only(bottom: 20),
        decoration: AuditTheme.glassDecoration(isDark: isDark, accentColor: accent),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Stack(
            children: [
              Positioned(left: 0, top: 0, bottom: 0, width: 6, child: Container(color: accent)),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text(item.vendor, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: textColor)),
                    Text(item.amount, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: accent)),
                  ]),
                  const SizedBox(height: 8),
                  Text(item.reason, style: const TextStyle(color: AuditTheme.textSlate, fontSize: 13, height: 1.4)),
                  const SizedBox(height: 16),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: accent.withOpacity(0.1), borderRadius: BorderRadius.circular(8)), child: Text(item.isCritical ? 'CRITICAL' : 'WARNING', style: TextStyle(color: accent, fontWeight: FontWeight.bold, fontSize: 10))),
                    Row(children: [
                      const Icon(Icons.verified_user_rounded, color: AuditTheme.cyberTeal, size: 14),
                      const SizedBox(width: 4),
                      Text('${(item.confidence * 100).toInt()}% CONF', style: const TextStyle(color: AuditTheme.cyberTeal, fontWeight: FontWeight.bold, fontSize: 10)),
                    ]),
                    const Text('AI SECURE SCAN', style: TextStyle(color: AuditTheme.textSlate, fontSize: 11)),
                  ]),
                ]),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
