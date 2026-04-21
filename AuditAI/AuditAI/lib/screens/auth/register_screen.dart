import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../theme.dart';
import '../../services/auth_service.dart';
import 'login_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _orgCtrl = TextEditingController();
  final _roleCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  bool _isLoading = false;

  void _register() async {
    if (_nameCtrl.text.trim().isEmpty || _emailCtrl.text.trim().isEmpty || _passCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Name, Email and Password are required'), backgroundColor: AuditTheme.alertRed));
      return;
    }
    if (_passCtrl.text != _confirmPassCtrl.text) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Passwords do not match'), backgroundColor: AuditTheme.alertRed));
      return;
    }

    setState(() => _isLoading = true);

    final result = await AuthService.register(
      name: _nameCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      phone: _phoneCtrl.text.trim(),
      org: _orgCtrl.text.trim(),
      role: _roleCtrl.text.trim(),
      password: _passCtrl.text.trim(),
    );

    if (mounted) {
      setState(() => _isLoading = false);
      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Registration successful! Please login.'), backgroundColor: AuditTheme.approveGreen));
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message']), backgroundColor: AuditTheme.alertRed, duration: const Duration(seconds: 4)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Account'), backgroundColor: Colors.transparent, elevation: 0),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              Center(
                child: Container(
                  width: 80, height: 80,
                  decoration: const BoxDecoration(shape: BoxShape.circle, gradient: LinearGradient(colors: [AuditTheme.goldAccent, AuditTheme.goldLight])),
                  child: const Icon(Icons.person_add, size: 40, color: AuditTheme.primaryNavy),
                ),
              ).animate().scale(),
              const SizedBox(height: 24),
              Text('Join AuditAI', textAlign: TextAlign.center, style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Theme.of(context).textTheme.displayLarge?.color)).animate().fade(),
              const SizedBox(height: 8),
              Text('Create your auditor account', textAlign: TextAlign.center, style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color)).animate().fade(delay: 100.ms),
              const SizedBox(height: 32),
              _field(_nameCtrl, 'Full Name *', Icons.person_outline, 200),
              _field(_emailCtrl, 'Work Email *', Icons.email_outlined, 300, type: TextInputType.emailAddress),
              _field(_phoneCtrl, 'Phone Number', Icons.phone_outlined, 400, type: TextInputType.phone),
              _field(_orgCtrl, 'Organization', Icons.business_outlined, 500),
              _field(_roleCtrl, 'Designation / Role', Icons.badge_outlined, 600),
              _field(_passCtrl, 'Password *', Icons.lock_outline, 700, obscure: true),
              _field(_confirmPassCtrl, 'Confirm Password *', Icons.lock_outline, 800, obscure: true),
              const SizedBox(height: 32),
              _isLoading
                ? const Center(child: CircularProgressIndicator(color: AuditTheme.goldAccent))
                : ElevatedButton(
                    onPressed: _register,
                    style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 18)),
                    child: const Text('Create Account', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  ).animate().fade(delay: 900.ms).slideY(begin: 0.2),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String label, IconData icon, int delayMs, {bool obscure = false, TextInputType type = TextInputType.text}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(controller: ctrl, obscureText: obscure, keyboardType: type, decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon, color: Theme.of(context).textTheme.bodyMedium?.color))).animate().fade(delay: Duration(milliseconds: delayMs)),
    );
  }
}
