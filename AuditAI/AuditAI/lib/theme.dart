import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AuditTheme {
  static const Color obsidianBg = Color(0xFF0A0F1D);
  static const Color surfaceGlass = Color(0xFF1E293B);
  static const Color electricIndigo = Color(0xFF6366F1);
  static const Color cyberTeal = Color(0xFF14B8A6);
  static const Color neonMagenta = Color(0xFFF43F5E);
  static const Color alertOrange = Color(0xFFF59E0B);
  static const Color textWhite = Color(0xFFF8FAFC);
  static const Color textSlate = Color(0xFF94A3B8);

  // Legacy colors for compatibility
  static const Color primaryNavy = Color(0xFF0F172A);
  static const Color surfaceDark = Color(0xFF1E293B);
  static const Color surfaceLighter = Color(0xFF334155);
  static const Color goldAccent = Color(0xFFFFD700);
  static const Color goldLight = Color(0xFFFFF8DC);
  static const Color alertRed = Color(0xFFDC2626);
  static const Color approveGreen = Color(0xFF16A34A);
  static const Color watchAmber = Color(0xFFF59E0B);
  static const Color textMuted = Color(0xFF94A3B8);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: obsidianBg,
      primaryColor: electricIndigo,
      colorScheme: const ColorScheme.dark(
        primary: electricIndigo,
        secondary: cyberTeal,
        error: neonMagenta,
        surface: surfaceGlass,
        onSurface: textWhite,
      ),
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
        displayLarge: const TextStyle(color: textWhite, fontWeight: FontWeight.w900),
        displayMedium: const TextStyle(color: textWhite, fontWeight: FontWeight.bold),
        bodyLarge: const TextStyle(color: textWhite),
        bodyMedium: const TextStyle(color: textSlate),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: electricIndigo,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      cardTheme: CardThemeData(
        color: surfaceGlass.withOpacity(0.8),
        elevation: 12,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: const Color(0xFFF1F5F9),
      primaryColor: electricIndigo,
      colorScheme: ColorScheme.light(primary: electricIndigo, secondary: cyberTeal, surface: Colors.white, onSurface: const Color(0xFF1E293B)),
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.light().textTheme),
    );
  }

  static ThemeData get lightThemeData => lightTheme;
  static ThemeData get themeData => darkTheme;

  static BoxDecoration glassDecoration({bool isDark = true, Color? accentColor}) {
    return BoxDecoration(
      color: isDark ? surfaceGlass.withOpacity(0.7) : Colors.white.withOpacity(0.8),
      borderRadius: BorderRadius.circular(24),
      border: Border.all(color: (accentColor ?? textWhite).withOpacity(0.15)),
      boxShadow: [
        BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 20, offset: const Offset(0, 10)),
        if (accentColor != null) BoxShadow(color: accentColor.withOpacity(0.1), blurRadius: 40, spreadRadius: -5),
      ],
    );
  }
}
