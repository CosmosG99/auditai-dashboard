import 'package:flutter/material.dart';
import 'theme.dart';
import 'globals.dart';
import 'screens/splash_screen.dart';

void main() {
  runApp(const AuditAiApp());
}

class AuditAiApp extends StatelessWidget {
  const AuditAiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: AppConfig.themeNotifier,
      builder: (context, themeMode, _) {
        return MaterialApp(
          title: 'AUDITAI',
          debugShowCheckedModeBanner: false,
          themeMode: themeMode,
          theme: AuditTheme.lightThemeData,
          darkTheme: AuditTheme.themeData,
          home: const SplashScreen(),
        );
      }
    );
  }
}
