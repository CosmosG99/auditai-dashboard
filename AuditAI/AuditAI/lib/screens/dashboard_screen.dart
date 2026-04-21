import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../theme.dart';
import '../../globals.dart';
import '../services/audit_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<TransactionAnalysisResult> _history = [];
  bool _isLoading = true;
  String _totalSaved = "₹0";
  int _riskCount = 0;
  double _integrityScore = 98.0;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final history = await AuditService.getAuditHistory();
      double saved = 0;
      int risks = 0;
      
      for (var item in history) {
        if (item.status == 'fake') {
          saved += (item.extractedData['amount_inr'] ?? 0);
          risks++;
        } else if (item.status == 'potential_false_positive') {
          risks++;
        }
      }

      // Calculate integrity score (Proper vs Total)
      double score = 100.0;
      if (history.isNotEmpty) {
        int proper = history.where((i) => i.status == 'proper').length;
        score = (proper / history.length) * 100;
      }

      setState(() {
        _history = history;
        _riskCount = risks;
        _totalSaved = "₹${saved > 1000 ? '${(saved / 1000).toStringAsFixed(1)}K' : saved.toStringAsFixed(0)}";
        _integrityScore = score;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: AppConfig.languageNotifier,
      builder: (context, lang, _) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        final textColor = isDark ? Colors.white : Colors.black87;
        final name = AppConfig.userName.isNotEmpty ? AppConfig.userName.split(' ').first : 'Auditor';

        if (_isLoading) {
          return Center(child: CircularProgressIndicator(color: AuditTheme.electricIndigo));
        }

        return Scaffold(
          body: Container(
            width: double.infinity,
            height: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark 
                    ? [const Color(0xFF0F172A), const Color(0xFF0A0F1D), const Color(0xFF020617)] 
                    : [Colors.white, const Color(0xFFF1F5F9)],
                begin: Alignment.topLeft, end: Alignment.bottomRight,
              ),
            ),
            child: SafeArea(
              child: RefreshIndicator(
                onRefresh: _fetchStats,
                color: AuditTheme.electricIndigo,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeader(context, isDark, lang, textColor),
                      const SizedBox(height: 32),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(AppConfig.t('welcome'), style: const TextStyle(fontSize: 14, color: AuditTheme.textSlate, letterSpacing: 1.2)),
                            Text(name, style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: textColor, height: 1.1)),
                          ]),
                          _buildLivePulse(isDark),
                        ],
                      ).animate().fade().slideX(begin: -0.1),

                      const SizedBox(height: 40),
                      _buildSecurityScoreCard(context, isDark, textColor),
                      
                      const SizedBox(height: 32),

                      Text(AppConfig.t('core_metrics'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AuditTheme.textSlate, letterSpacing: 2)),
                      const SizedBox(height: 16),
                      GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: 2,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        childAspectRatio: 1.1,
                        children: [
                          _buildMetricCard(context, AppConfig.t('total_audits'), _history.length.toString(), Icons.analytics_rounded, AuditTheme.electricIndigo, isDark, textColor),
                          _buildMetricCard(context, AppConfig.t('risk_items'), _riskCount.toString(), Icons.gpp_maybe_rounded, AuditTheme.neonMagenta, isDark, textColor),
                          _buildMetricCard(context, AppConfig.t('capital_saved'), _totalSaved, Icons.security_rounded, AuditTheme.cyberTeal, isDark, textColor),
                          _buildMetricCard(context, AppConfig.t('ai_accuracy'), '99.8%', Icons.bolt_rounded, AuditTheme.alertOrange, isDark, textColor),
                        ],
                      ).animate().fade(delay: 200.ms).slideY(begin: 0.1),

                      const SizedBox(height: 32),

                      Text('FORENSIC LANDSCAPE', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AuditTheme.textSlate, letterSpacing: 2)),
                      const SizedBox(height: 16),
                      _buildTrendChart(context, isDark),

                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      }
    );
  }

  Widget _buildHeader(BuildContext context, bool isDark, String lang, Color textColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Container(
          padding: const EdgeInsets.all(2),
          decoration: const BoxDecoration(shape: BoxShape.circle, gradient: LinearGradient(colors: [AuditTheme.electricIndigo, AuditTheme.cyberTeal])),
          child: CircleAvatar(radius: 22, backgroundColor: isDark ? AuditTheme.obsidianBg : Colors.white, child: Text(AppConfig.userInitials, style: const TextStyle(fontWeight: FontWeight.bold, color: AuditTheme.electricIndigo))),
        ),
        Row(children: [
          DropdownButton<String>(
            value: lang, dropdownColor: isDark ? AuditTheme.surfaceGlass : Colors.white,
            icon: const Icon(Icons.language, color: AuditTheme.cyberTeal, size: 20), underline: const SizedBox(),
            items: ['English', 'Hindi', 'Marathi', 'Konkani'].map((l) => DropdownMenuItem(value: l, child: Text(l, style: TextStyle(color: textColor, fontSize: 13)))).toList(),
            onChanged: (val) { if (val != null) AppConfig.languageNotifier.value = val; },
          ),
          const SizedBox(width: 8),
          ValueListenableBuilder<ThemeMode>(
            valueListenable: AppConfig.themeNotifier,
            builder: (context, mode, _) => IconButton(
              onPressed: () => AppConfig.themeNotifier.value = mode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark,
              icon: Icon(mode == ThemeMode.dark ? Icons.light_mode_rounded : Icons.dark_mode_rounded, color: AuditTheme.alertOrange),
            ),
          ),
        ]),
      ],
    );
  }

  Widget _buildLivePulse(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: AuditTheme.cyberTeal.withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: AuditTheme.cyberTeal.withOpacity(0.3))),
      child: Row(children: [
        Container(width: 8, height: 8, decoration: const BoxDecoration(color: AuditTheme.cyberTeal, shape: BoxShape.circle)).animate(onPlay: (c) => c.repeat()).scale(begin: const Offset(1, 1), end: const Offset(1.5, 1.5), duration: const Duration(seconds: 1)).then().scale(begin: const Offset(1.5, 1.5), end: const Offset(1, 1)),
        const SizedBox(width: 8),
        const Text('LIVE ENGINE', style: TextStyle(color: AuditTheme.cyberTeal, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
      ]),
    );
  }

  Widget _buildSecurityScoreCard(BuildContext context, bool isDark, Color textColor) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: AuditTheme.glassDecoration(isDark: isDark, accentColor: AuditTheme.electricIndigo),
      child: Stack(
        children: [
          Positioned(right: -20, top: -20, child: Icon(Icons.shield_rounded, size: 120, color: AuditTheme.electricIndigo.withOpacity(0.1))),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(AppConfig.t('system_integrity').toUpperCase(), style: const TextStyle(color: AuditTheme.cyberTeal, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.5)),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(_integrityScore.toStringAsFixed(0), style: TextStyle(fontSize: 64, fontWeight: FontWeight.w900, color: textColor)),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12, left: 4),
                    child: Text('/100', style: const TextStyle(fontSize: 18, color: AuditTheme.textSlate, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                height: 6, width: 200,
                decoration: BoxDecoration(color: AuditTheme.textSlate.withOpacity(0.2), borderRadius: BorderRadius.circular(3)),
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft, widthFactor: _integrityScore / 100,
                  child: Container(decoration: BoxDecoration(gradient: const LinearGradient(colors: [AuditTheme.electricIndigo, AuditTheme.cyberTeal]), borderRadius: BorderRadius.circular(3))),
                ),
              ),
              const SizedBox(height: 16),
              Text(_integrityScore > 80 ? 'Optimized & Secure. Monitoring real-time telemetry.' : 'Alert: Low integrity score due to detected anomalies.', style: const TextStyle(color: AuditTheme.textSlate, fontSize: 13)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard(BuildContext context, String title, String value, IconData icon, Color color, bool isDark, Color textColor) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AuditTheme.glassDecoration(isDark: isDark, accentColor: color),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 24),
          ),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: textColor)),
            Text(title, style: const TextStyle(fontSize: 11, color: AuditTheme.textSlate, fontWeight: FontWeight.w500)),
          ]),
        ],
      ),
    );
  }

  Widget _buildTrendChart(BuildContext context, bool isDark) {
    List<FlSpot> spots = [];
    if (_history.isEmpty) {
       spots = [const FlSpot(0, 0), const FlSpot(1, 0)];
    } else {
       // Take last 7 audits
       final recent = _history.take(7).toList().reversed.toList();
       for(int i=0; i<recent.length; i++) {
         spots.add(FlSpot(i.toDouble(), recent[i].anomalyScore.toDouble() / 10)); // Scale to 0-10
       }
    }

    return Container(
      height: 200, width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: AuditTheme.glassDecoration(isDark: isDark),
      child: LineChart(
        LineChartData(
          gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (v) => FlLine(color: AuditTheme.textSlate.withOpacity(0.05), strokeWidth: 1)),
          titlesData: const FlTitlesData(show: false),
          borderData: FlBorderData(show: false),
          lineBarsData: [
            LineChartBarData(
              isCurved: true, color: AuditTheme.cyberTeal, barWidth: 4, isStrokeCapRound: true, dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(show: true, gradient: LinearGradient(colors: [AuditTheme.cyberTeal.withOpacity(0.2), AuditTheme.cyberTeal.withOpacity(0)])),
              spots: spots,
            ),
          ],
        ),
      ),
    );
  }
}
