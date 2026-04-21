import 'package:flutter/material.dart';

class AppConfig {
  static final themeNotifier = ValueNotifier<ThemeMode>(ThemeMode.dark);
  static final languageNotifier = ValueNotifier<String>('English');
  
  static String userName = '';
  static String userEmail = '';
  static String userOrg = '';
  static String userRole = '';

  static const String apiBaseUrl = 'http://127.0.0.1:5000/api';

  static String get userInitials {
    if (userName.isEmpty) return 'U';
    final parts = userName.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return parts[0][0].toUpperCase();
  }

  static final Map<String, Map<String, String>> translations = {
    'English': {
      'welcome': 'Welcome back,',
      'core_metrics': 'CORE METRICS',
      'total_audits': 'Total Audits',
      'risk_items': 'Risk Items',
      'capital_saved': 'Capital Saved',
      'ai_accuracy': 'AI Accuracy',
      'threat_landscape': 'THREAT LANDSCAPE',
      'system_integrity': 'SYSTEM INTEGRITY',
      'live_feed': 'LiveAudit Feed',
      'ask_ai': 'Ask AI',
      'reports': 'Audit Reports',
      'profile': 'Profile',
      'home': 'Dashboard',
    },
    'Hindi': {
      'welcome': 'वापसी पर स्वागत है,',
      'core_metrics': 'मुख्य मेट्रिक्स',
      'total_audits': 'कुल ऑडिट',
      'risk_items': 'जोखिम आइटम',
      'capital_saved': 'बचत पूंजी',
      'ai_accuracy': 'AI सटीकता',
      'threat_landscape': 'खतरा परिदृश्य',
      'system_integrity': 'सिस्टम अखंडता',
      'live_feed': 'लाइव फ़ीड',
      'ask_ai': 'एआई से पूछें',
      'reports': 'ऑडिट रिपोर्ट',
      'profile': 'प्रोफ़ाइल',
      'home': 'डैशबोर्ड',
    },
    'Marathi': {
      'welcome': 'परत स्वागत आहे,',
      'core_metrics': 'मुख्य मेट्रिक्स',
      'total_audits': 'एकूण ऑडिट',
      'risk_items': 'जोखिम घटक',
      'capital_saved': 'बचत भांडवल',
      'ai_accuracy': 'AI अचूकता',
      'threat_landscape': 'धोका परिस्थिती',
      'system_integrity': 'सिस्टम अखंडता',
      'live_feed': 'लाइव फीड',
      'ask_ai': 'AI ला विचारा',
      'reports': 'ऑडिट अहवाल',
      'profile': 'प्रोफाइल',
      'home': 'डॅशबोर्ड',
    },
    'Konkani': {
      'welcome': 'येवकार परतून,',
      'core_metrics': 'मुखेल मेट्रिक्स',
      'total_audits': 'सगळीं ऑडिटां',
      'risk_items': 'धोक्याचे आयटम',
      'capital_saved': 'बचत केल्लो मुद्दल',
      'ai_accuracy': 'AI अचूकता',
      'threat_landscape': 'धोक्याचें चित्र',
      'system_integrity': 'सिस्टम अखंडता',
      'live_feed': 'लाइव फिड',
      'ask_ai': 'AI क विचार',
      'reports': 'ऑडिट रिपोट',
      'profile': 'प्रोफायल',
      'home': 'डॅशबोर्ड',
    }
  };

  static String t(String key) {
    return translations[languageNotifier.value]?[key] ?? translations['English']![key]!;
  }
}
