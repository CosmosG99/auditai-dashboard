import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../theme.dart';
import '../../main_navigation.dart';
import '../../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _isLoading = false;

  void _login() async {
    if (_emailCtrl.text.trim().isEmpty || _passCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all fields'), backgroundColor: AuditTheme.alertRed));
      return;
    }

    setState(() => _isLoading = true);

    final result = await AuthService.login(
      email: _emailCtrl.text.trim(),
      password: _passCtrl.text.trim(),
    );

    if (mounted) {
      setState(() => _isLoading = false);
      if (result['success']) {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const MainNavigation()));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message']), backgroundColor: AuditTheme.alertRed, duration: const Duration(seconds: 4)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 60),
              Center(
                child: Container(
                  width: 120, height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(colors: [AuditTheme.goldAccent, AuditTheme.goldLight]),
                    boxShadow: [BoxShadow(color: AuditTheme.goldAccent.withOpacity(0.4), blurRadius: 30, spreadRadius: 5)],
                  ),
                  child: Center(
                    child: Stack(alignment: Alignment.center, children: [
                      Icon(Icons.shield, size: 70, color: AuditTheme.primaryNavy),
                      Positioned(top: 22, child: Icon(Icons.auto_awesome, size: 28, color: Colors.white)),
                    ]),
                  ),
                ),
              ).animate(onPlay: (c) => c.repeat(reverse: true)).shimmer(duration: 3.seconds, color: AuditTheme.goldLight.withOpacity(0.3)),
              const SizedBox(height: 24),
              Text('AUDITAI', textAlign: TextAlign.center, style: Theme.of(context).textTheme.displayLarge?.copyWith(letterSpacing: 6, fontSize: 36)).animate().fade(duration: 800.ms),
              const SizedBox(height: 8),
              Text('Financial Anomaly Intelligence', textAlign: TextAlign.center, style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color, letterSpacing: 2, fontSize: 14)).animate().fade(delay: 200.ms),
              const SizedBox(height: 60),
              Text('Welcome Back', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Theme.of(context).textTheme.displayLarge?.color)).animate().fade(delay: 300.ms),
              const SizedBox(height: 8),
              Text('Sign in to your account', style: TextStyle(fontSize: 16, color: Theme.of(context).textTheme.bodyMedium?.color)).animate().fade(delay: 400.ms),
              const SizedBox(height: 32),
              TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress, decoration: InputDecoration(labelText: 'Work Email', prefixIcon: Icon(Icons.email_outlined, color: Theme.of(context).textTheme.bodyMedium?.color))).animate().fade(delay: 500.ms),
              const SizedBox(height: 16),
              TextField(controller: _passCtrl, obscureText: true, decoration: InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock_outline, color: Theme.of(context).textTheme.bodyMedium?.color))).animate().fade(delay: 600.ms),
              const SizedBox(height: 32),
              _isLoading
                ? const Center(child: CircularProgressIndicator(color: AuditTheme.goldAccent))
                : ElevatedButton(
                    onPressed: _login, 
                    style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 18)),
                    child: const Text('Sign In', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  ).animate().fade(delay: 700.ms).slideY(begin: 0.2),
            ],
          ),
        ),
      ),
    );
  }
}
