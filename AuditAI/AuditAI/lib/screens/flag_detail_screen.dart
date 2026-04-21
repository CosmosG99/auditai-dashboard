import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';

class FlagDetailScreen extends StatelessWidget {
  final String vendor, amount, reason;
  final bool isCritical;
  final double confidence;

  const FlagDetailScreen({super.key, required this.vendor, required this.amount, required this.isCritical, required this.reason, this.confidence = 0.94});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = isCritical ? AuditTheme.neonMagenta : AuditTheme.alertOrange;
    
    return Scaffold(
      appBar: AppBar(title: const Text('ANOMALY INSIGHTS', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 2, fontSize: 13))),
      extendBodyBehindAppBar: true,
      body: Container(
        decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: isDark ? [const Color(0xFF0F172A), const Color(0xFF0A0F1D)] : [Colors.white, const Color(0xFFF1F5F9)])),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch, 
              children: [
                _buildHeader(context, color),
                const SizedBox(height: 32),
                _buildValueDisplay(color),
                const SizedBox(height: 32),
                _buildChart(isDark, color),
                const SizedBox(height: 32),
                _buildAIStory(isDark, color),
                const SizedBox(height: 40),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(backgroundColor: color, padding: const EdgeInsets.symmetric(vertical: 20)),
                  child: const Text('ACKNOWLEDGE & LOG', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(vendor, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white)),
          Text(isCritical ? 'CRITICAL RISK' : 'MEDIUM RISK', style: TextStyle(color: color, fontWeight: FontWeight.bold, letterSpacing: 1.2, fontSize: 12)),
        ]),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withOpacity(0.3))),
          child: Column(children: [
            Text('${(confidence * 100).toInt()}%', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
            const Text('CONFID', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.white70)),
          ]),
        ),
      ],
    );
  }

  Widget _buildValueDisplay(Color color) {
    return Column(children: [
      Text(amount, style: TextStyle(fontSize: 52, fontWeight: FontWeight.w900, color: color, letterSpacing: -2)),
      const Text('THREAT VALUE DETECTED', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 2, color: AuditTheme.textSlate)),
    ]);
  }

  Widget _buildChart(bool isDark, Color color) {
    return Container(
      height: 180, padding: const EdgeInsets.all(20),
      decoration: AuditTheme.glassDecoration(isDark: isDark),
      child: LineChart(
        LineChartData(
          gridData: const FlGridData(show: false), titlesData: const FlTitlesData(show: false), borderData: FlBorderData(show: false),
          lineBarsData: [
            LineChartBarData(isCurved: true, color: AuditTheme.cyberTeal.withOpacity(0.4), barWidth: 4, dotData: const FlDotData(show: false), spots: const [FlSpot(0, 3), FlSpot(1, 4), FlSpot(2, 3.5), FlSpot(3, 3.8), FlSpot(4, 3.2)]),
            LineChartBarData(isCurved: true, color: color, barWidth: 4, dotData: const FlDotData(show: true), spots: const [FlSpot(0, 3), FlSpot(1, 4), FlSpot(2, 3.5), FlSpot(4, 9)]),
          ],
        ),
      ),
    );
  }

  Widget _buildAIStory(bool isDark, Color color) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: AuditTheme.glassDecoration(isDark: isDark, accentColor: color),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 20), SizedBox(width: 12), Text('AI INVESTIGATION LOG', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.5, fontSize: 13))]),
        const SizedBox(height: 16),
        Text(reason, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white)),
        const SizedBox(height: 8),
        const Text('Pattern suggests forensic inconsistency. Deviation exceeds Gaussian safety limits. Recommended: Itemized Reconciliation.', style: TextStyle(color: AuditTheme.textSlate, height: 1.4, fontSize: 12)),
      ]),
    );
  }
}
