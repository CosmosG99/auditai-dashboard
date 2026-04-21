import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';
import 'reports_screen.dart';
import 'dart:io';

class ReceiptScannerScreen extends StatefulWidget {
  const ReceiptScannerScreen({super.key});

  @override
  State<ReceiptScannerScreen> createState() => _ReceiptScannerScreenState();
}

class _ReceiptScannerScreenState extends State<ReceiptScannerScreen> {
  bool _isUploading = false;
  final ImagePicker _picker = ImagePicker();

  void _pickImage(ImageSource source) async {
    final XFile? image = await _picker.pickImage(source: source);
    if (image == null) return;
    
    setState(() => _isUploading = true);
    
    // Simulate some delay for AI analysis
    await Future.delayed(const Duration(seconds: 2));
    
    setState(() => _isUploading = false);
    
    GlobalReports.list.insert(0, Report('Analyzed Receipt', 'Just Now', 'Completed'));
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Document successfully analyzed and saved!'),
          backgroundColor: AuditTheme.approveGreen,
        )
      );
      Navigator.pop(context);
    }
  }

  void _showPickerOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AuditTheme.surfaceDark,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Choose Image Source', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AuditTheme.textWhite)),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildOptionCard(
                      icon: Icons.camera_alt_outlined,
                      label: 'Camera',
                      onTap: () {
                        Navigator.pop(context);
                        _pickImage(ImageSource.camera);
                      },
                    ),
                    _buildOptionCard(
                      icon: Icons.photo_library_outlined,
                      label: 'Gallery',
                      onTap: () {
                        Navigator.pop(context);
                        _pickImage(ImageSource.gallery);
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      }
    );
  }

  Widget _buildOptionCard({required IconData icon, required String label, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 120,
        height: 120,
        decoration: BoxDecoration(
          color: AuditTheme.surfaceLighter,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AuditTheme.goldAccent.withOpacity(0.5)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: AuditTheme.goldAccent),
            const SizedBox(height: 12),
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: AuditTheme.textWhite)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan Document')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.document_scanner_outlined, size: 100, color: AuditTheme.goldAccent).animate().scale(delay: 200.ms),
              const SizedBox(height: 24),
              const Text(
                'Upload or Scan Receipt',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AuditTheme.textWhite),
              ).animate().fade(),
              const SizedBox(height: 16),
              const Text(
                'Automatically analyze and store your documents to your Audit Reports.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AuditTheme.textMuted),
              ).animate().fade(),
              const SizedBox(height: 48),
              _isUploading 
              ? const CircularProgressIndicator(color: AuditTheme.goldAccent)
              : ElevatedButton.icon(
                  onPressed: () => _showPickerOptions(context),
                  icon: const Icon(Icons.add_a_photo),
                  label: const Text('Select Option', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                  ),
                ).animate().slideY(begin: 0.5).fade(),
            ],
          ),
        ),
      ),
    );
  }
}
