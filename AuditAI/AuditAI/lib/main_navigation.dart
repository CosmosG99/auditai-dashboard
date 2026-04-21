import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';
import 'screens/dashboard_screen.dart';
import 'screens/home_screen.dart';
import 'screens/ask_auditai_screen.dart';
import 'screens/reports_screen.dart';
import 'screens/profile_screen.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});
  @override
  State<MainNavigation> createState() => MainNavigationState();
}

class MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const HomeScreen(),
    const AskAuditAiScreen(),
    const ReportsScreen(),
    const ProfileScreen(),
  ];

  void setIndex(int index) => setState(() => _currentIndex = index);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      extendBody: true,
      body: _screens[_currentIndex].animate(key: ValueKey(_currentIndex)).fade(duration: 400.ms),
      bottomNavigationBar: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        height: 72,
        decoration: AuditTheme.glassDecoration(isDark: isDark, accentColor: AuditTheme.electricIndigo).copyWith(
          borderRadius: BorderRadius.circular(30),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildNavItem(0, Icons.grid_view_rounded, 'Dashboard'),
            _buildNavItem(1, Icons.sensors_rounded, 'Feed'),
            _buildNavItem(2, Icons.auto_awesome_rounded, 'Ask AI'),
            _buildNavItem(3, Icons.insert_chart_outlined_rounded, 'Reports'),
            _buildNavItem(4, Icons.person_rounded, 'Profile'),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _currentIndex == index;
    final color = isSelected ? AuditTheme.cyberTeal : AuditTheme.textSlate;
    
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedContainer(
            duration: 300.ms,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? AuditTheme.cyberTeal.withOpacity(0.1) : Colors.transparent,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(icon, color: color, size: 26),
          ),
          if (isSelected) 
            const SizedBox(height: 4),
          if (isSelected)
            Container(width: 4, height: 4, decoration: const BoxDecoration(color: AuditTheme.cyberTeal, shape: BoxShape.circle)).animate().scale(),
        ],
      ),
    );
  }
}
