import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';
import '../globals.dart';
import 'auth/login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: AppConfig.languageNotifier,
      builder: (context, lang, _) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        final textColor = isDark ? Colors.white : Colors.black87;
        
        return Scaffold(
          body: Container(
            decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: isDark ? [const Color(0xFF0F172A), const Color(0xFF0A0F1D)] : [Colors.white, const Color(0xFFF1F5F9)])),
            child: SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    const SizedBox(height: 20),
                    Center(
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(width: 110, height: 110, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AuditTheme.cyberTeal, width: 2))).animate(onPlay: (c) => c.repeat()).rotate(duration: const Duration(seconds: 5)),
                          CircleAvatar(radius: 48, backgroundColor: AuditTheme.electricIndigo, child: Text(AppConfig.userInitials, style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white))),
                        ],
                      ),
                    ).animate().scale(),

                    const SizedBox(height: 20),
                    Text(AppConfig.userName, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: textColor)),
                    Text(AppConfig.userRole.toUpperCase(), style: const TextStyle(fontSize: 12, color: AuditTheme.cyberTeal, fontWeight: FontWeight.bold, letterSpacing: 2)),
                    
                    const SizedBox(height: 48),

                    _buildInfoCard(context, 'Organization', AppConfig.userOrg, Icons.business_rounded, isDark, textColor),
                    const SizedBox(height: 16),
                    _buildInfoCard(context, 'Email Address', AppConfig.userEmail, Icons.alternate_email_rounded, isDark, textColor),
                    
                    const SizedBox(height: 40),

                    _buildActionTile(context, 'Security Settings', Icons.security, AuditTheme.cyberTeal, isDark, textColor),
                    _buildActionTile(context, 'System Preferences', Icons.tune_rounded, AuditTheme.electricIndigo, isDark, textColor),
                    
                    const SizedBox(height: 40),

                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () => Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (route) => false),
                        icon: const Icon(Icons.logout_rounded),
                        label: const Text('TERMINATE SESSION', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AuditTheme.neonMagenta,
                          side: const BorderSide(color: AuditTheme.neonMagenta),
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                    ).animate().fade(delay: 500.ms),
                    const SizedBox(height: 120),
                  ],
                ),
              ),
            ),
          ),
        );
      }
    );
  }

  Widget _buildInfoCard(BuildContext context, String lab, String val, IconData icon, bool isDark, Color textColor) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AuditTheme.glassDecoration(isDark: isDark),
      child: Row(
        children: [
          Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: AuditTheme.electricIndigo.withOpacity(0.1), borderRadius: BorderRadius.circular(12)), child: Icon(icon, color: AuditTheme.electricIndigo, size: 20)),
          const SizedBox(width: 16),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(lab, style: const TextStyle(color: AuditTheme.textSlate, fontSize: 11, fontWeight: FontWeight.bold)),
            Text(val, style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w600)),
          ]),
        ],
      ),
    );
  }

  Widget _buildActionTile(BuildContext context, String title, IconData icon, Color color, bool isDark, Color textColor) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: AuditTheme.glassDecoration(isDark: isDark).copyWith(borderRadius: BorderRadius.circular(16)),
      child: ListTile(
        leading: Icon(icon, color: color, size: 22),
        title: Text(title, style: TextStyle(color: textColor, fontSize: 14, fontWeight: FontWeight.w500)),
        trailing: const Icon(Icons.chevron_right_rounded, color: AuditTheme.textSlate),
        onTap: () {},
      ),
    );
  }
}
