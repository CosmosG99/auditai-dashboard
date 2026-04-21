# API Keys Configuration

## Overview
Sensitive API keys are now stored in the `.env` file and excluded from git version control for security.

## Setup Instructions

### 1. .env File
The `.env` file contains your sensitive API keys:
- `GOOGLE_GENERATIVE_AI_KEY` - Your Google Generative AI (Gemini) API key

**IMPORTANT:** The `.env` file is listed in `.gitignore` and will NOT be committed to git.

### 2. Configuration File
The API key is referenced in `lib/config/api_keys.dart`:
```dart
class ApiKeys {
  static const String googleGenerativeAiKey = 'YOUR_API_KEY_HERE';
}
```

### 3. Usage in Code
To use the API key in your Flutter code:
```dart
import '../config/api_keys.dart';

// Use it like:
apiKey: ApiKeys.googleGenerativeAiKey
```

## Important Notes

1. **Do NOT commit .env file**: The .env file is already in .gitignore
2. **Keep api_keys.dart secure**: This file currently stores the API key directly (for development). In production, consider using secure storage.
3. **For team collaboration**: Share the .env file content securely (not via git) - perhaps through a secure note or your team's secret management system

## Current API Keys
Your Google Generative AI key is stored in:
- `.env` file (actual key, git-ignored)
- `lib/config/api_keys.dart` (referenced constant)

## Future Improvements
Consider implementing:
- Secure key storage using `flutter_secure_storage` package
- Environment-based configuration (dev, staging, production)
- Integration with flutter_dotenv package for automatic .env loading

## Additional Files Modified
- `lib/screens/ask_auditai_screen.dart` - Now imports and uses `ApiKeys` class
- `.gitignore` - Added `.env` and `.env.local` entries
