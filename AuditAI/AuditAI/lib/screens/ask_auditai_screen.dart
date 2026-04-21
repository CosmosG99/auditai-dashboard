import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';
import '../globals.dart';
import '../services/audit_service.dart';

class AskAuditAiScreen extends StatefulWidget {
  const AskAuditAiScreen({super.key});
  @override
  State<AskAuditAiScreen> createState() => _AskAuditAiScreenState();
}

class _AskAuditAiScreenState extends State<AskAuditAiScreen> {
  final TextEditingController _controller = TextEditingController();
  final List<_Message> _messages = [];
  bool _isLoading = false;
  final ScrollController _scrollController = ScrollController();
  String _conversationContext = '';

  @override
  void initState() {
    super.initState();
    _messages.add(_Message("Secure link established. AuditAI is standing by.", false));
  }

  void _sendMessage() async {
    String text = _controller.text.trim();
    if (text.isEmpty) return;
    _controller.clear();
    if (mounted) setState(() { _messages.add(_Message(text, true)); _isLoading = true; });
    _scrollToBottom();
    
    try {
      final response = await AuditService.askAuditAi(
        message: text,
        context: _conversationContext,
      );
      
      if (mounted) setState(() { 
        _messages.add(_Message(response, false)); 
        _conversationContext += 'User: $text\nAssistant: $response\n';
        _isLoading = false; 
      });
    } catch (e) {
      if (mounted) setState(() { 
        _messages.add(_Message("Error: ${e.toString()}\n\nMake sure backend is running at 192.168.1.112:5000 and Ollama is running locally", false)); 
        _isLoading = false; 
      });
    }
    _scrollToBottom();
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 300), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(_scrollController.position.maxScrollExtent, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: AppConfig.languageNotifier,
      builder: (context, lang, _) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return Scaffold(
          appBar: AppBar(
            title: const Text('AUDIT.AI INTELLIGENCE', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 2, fontSize: 16)),
            centerTitle: true, backgroundColor: Colors.transparent, elevation: 0,
          ),
          extendBodyBehindAppBar: true,
          body: Container(
            decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: isDark ? [const Color(0xFF0F172A), const Color(0xFF0A0F1D)] : [Colors.white, const Color(0xFFF1F5F9)])),
            child: Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(20, 100, 20, 20),
                    itemCount: _messages.length,
                    itemBuilder: (context, i) => _buildMessageBubble(_messages[i]),
                  ),
                ),
                if (_isLoading) Padding(padding: const EdgeInsets.all(8), child: const CircularProgressIndicator(color: AuditTheme.cyberTeal, strokeWidth: 2).animate().fade()),
                _buildInputArea(isDark),
              ],
            ),
          ),
        );
      }
    );
  }

  Widget _buildInputArea(bool isDark) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 110),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: AuditTheme.glassDecoration(isDark: isDark, accentColor: AuditTheme.electricIndigo).copyWith(borderRadius: BorderRadius.circular(30)),
      child: Row(
        children: [
          Expanded(child: TextField(controller: _controller, style: const TextStyle(color: Colors.white, fontSize: 14), decoration: const InputDecoration(hintText: 'Command AuditAI...', hintStyle: TextStyle(color: AuditTheme.textSlate), border: InputBorder.none))),
          IconButton(onPressed: _sendMessage, icon: const Icon(Icons.bolt_rounded, color: AuditTheme.cyberTeal)),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(_Message msg) {
    final align = msg.isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start;
    final color = msg.isUser ? AuditTheme.electricIndigo : AuditTheme.surfaceGlass.withOpacity(0.9);
    return Column(
      crossAxisAlignment: align,
      children: [
        Container(
          margin: const EdgeInsets.symmetric(vertical: 8),
          padding: const EdgeInsets.all(16),
          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(16), border: Border.all(color: msg.isUser ? Colors.transparent : AuditTheme.electricIndigo.withOpacity(0.2))),
          child: Text(msg.text, style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.4)),
        ).animate().scale(begin: const Offset(0.95, 0.95)).fade(),
        if (!msg.isUser) const Padding(padding: const EdgeInsets.only(left: 4), child: Text('SECURE LINK ENCRYPTED', style: TextStyle(color: AuditTheme.cyberTeal, fontSize: 8, fontWeight: FontWeight.bold))),
      ],
    );
  }
}

class _Message {
  final String text;
  final bool isUser;
  _Message(this.text, this.isUser);
}
