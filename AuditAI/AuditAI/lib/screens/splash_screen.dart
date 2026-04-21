import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';
import 'auth/login_screen.dart';
import 'auth/register_screen.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              // Unique shield + sparkle logo
              Center(
                child: Container(
                  width: 140, height: 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(colors: [AuditTheme.goldAccent, AuditTheme.goldLight]),
                    boxShadow: [BoxShadow(color: AuditTheme.goldAccent.withOpacity(0.4), blurRadius: 40, spreadRadius: 8)],
                  ),
                  child: Center(
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Icon(Icons.shield, size: 80, color: AuditTheme.primaryNavy),
                        Positioned(top: 24, child: Icon(Icons.auto_awesome, size: 32, color: Colors.white)),
                      ],
                    ),
                  ),
                ),
              ).animate(onPlay: (c) => c.repeat(reverse: true)).shimmer(duration: 2.seconds, color: AuditTheme.goldLight.withOpacity(0.3)),
              
              const SizedBox(height: 32),
              Text('AUDITAI', textAlign: TextAlign.center, style: Theme.of(context).textTheme.displayLarge?.copyWith(letterSpacing: 6, fontSize: 44))
              .animate().fade(duration: 800.ms).slideY(begin: 0.5, end: 0),
              
              const SizedBox(height: 12),
              Text('Financial Anomaly Intelligence', textAlign: TextAlign.center, style: TextStyle(color: AuditTheme.goldAccent, letterSpacing: 2, fontSize: 15))
              .animate().fade(delay: 400.ms),
              
              const Spacer(),
              ElevatedButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())), 
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 18)),
                child: const Text('Sign In', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())), 
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AuditTheme.goldAccent),
                  padding: const EdgeInsets.symmetric(vertical: 18),
                ),
                child: const Text('Create Account', style: TextStyle(fontSize: 18, color: AuditTheme.goldAccent)),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
