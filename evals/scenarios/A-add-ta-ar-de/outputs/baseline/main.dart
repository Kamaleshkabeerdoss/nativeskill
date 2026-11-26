import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

class NorthwindApp extends StatefulWidget {
  const NorthwindApp({super.key});

  @override
  State<NorthwindApp> createState() => _NorthwindAppState();
}

class _NorthwindAppState extends State<NorthwindApp> {
  Locale _locale = const Locale('en');

  void _setLocale(Locale locale) {
    setState(() {
      _locale = locale;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Northwind',
      locale: _locale,
      supportedLocales: const [
        Locale('en'),
        Locale('ta'),
        Locale('ar'),
        Locale('de'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: HomeScreen(
        locale: _locale,
        onLocaleChanged: _setLocale,
      ),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({
    super.key,
    required this.locale,
    required this.onLocaleChanged,
  });

  final Locale locale;
  final ValueChanged<Locale> onLocaleChanged;

  static const Map<String, String> _renewTitle = {
    'en': 'Cancel subscription?',
    'ta': 'சந்தாவை ரத்துசெய்யவா?',
    'ar': 'هل تريد إلغاء الاشتراك؟',
    'de': 'Abonnement kündigen?',
  };

  static const Map<String, String> _stopRenewal = {
    'en': 'Cancel',
    'ta': 'புதுப்பிப்பை நிறுத்து',
    'ar': 'إيقاف التجديد',
    'de': 'Kündigen',
  };

  static const Map<String, String> _languageTooltip = {
    'en': 'Language',
    'ta': 'மொழி',
    'ar': 'اللغة',
    'de': 'Sprache',
  };

  static const List<(String, String)> _languages = [
    ('en', 'English'),
    ('ta', 'தமிழ்'),
    ('ar', 'العربية'),
    ('de', 'Deutsch'),
  ];

  String _text(Map<String, String> values) {
    return values[locale.languageCode] ?? values['en']!;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: BackButton(
          onPressed: () {},
        ),
        title: const Text('Northwind'),
        actions: [
          PopupMenuButton<Locale>(
            tooltip: _text(_languageTooltip),
            initialValue: locale,
            onSelected: onLocaleChanged,
            icon: const Icon(Icons.language),
            itemBuilder: (context) {
              return [
                for (final (code, label) in _languages)
                  PopupMenuItem<Locale>(
                    value: Locale(code),
                    child: Row(
                      children: [
                        Expanded(child: Text(label)),
                        if (code == locale.languageCode)
                          const Icon(Icons.check, size: 18),
                      ],
                    ),
                  ),
              ];
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsetsDirectional.only(start: 16, end: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_text(_renewTitle)),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: () {},
              child: Text(_text(_stopRenewal)),
            ),
          ],
        ),
      ),
    );
  }
}
