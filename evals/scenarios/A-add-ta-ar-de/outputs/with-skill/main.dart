import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart';

const List<Locale> northwindLocales = <Locale>[
  Locale('en'),
  Locale('ta'),
  Locale('ar'),
  Locale('de'),
];

class NorthwindApp extends StatefulWidget {
  const NorthwindApp({super.key});

  @override
  State<NorthwindApp> createState() => _NorthwindAppState();
}

class _NorthwindAppState extends State<NorthwindApp> {
  Locale _locale = const Locale('en');

  void _setLocale(Locale locale) {
    setState(() => _locale = locale);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      onGenerateTitle: (context) => AppLocalizations.of(context).appTitle,
      locale: _locale,
      supportedLocales: northwindLocales,
      localizationsDelegates: const <LocalizationsDelegate<dynamic>>[
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: HomeScreen(onLocaleChanged: _setLocale),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key, required this.onLocaleChanged});

  final ValueChanged<Locale> onLocaleChanged;

  @override
  Widget build(BuildContext context) {
    final AppLocalizations copy = AppLocalizations.of(context);
    final Locale locale = Localizations.localeOf(context);
    final String periodEnd = DateFormat.yMMMd(locale.toString()).format(DateTime(2026, 3, 4));

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: copy.back,
          onPressed: () {},
          icon: Icon(
            IconData(
              Icons.arrow_back.codePoint,
              fontFamily: Icons.arrow_back.fontFamily,
              fontPackage: Icons.arrow_back.fontPackage,
              matchTextDirection: true,
            ),
          ),
        ),
        title: Text(copy.appTitle),
        actions: <Widget>[
          Tooltip(
            message: copy.language,
            child: DropdownButton<Locale>(
              value: locale,
              underline: const SizedBox.shrink(),
              items: <DropdownMenuItem<Locale>>[
                for (final Locale item in northwindLocales)
                  DropdownMenuItem<Locale>(
                    value: item,
                    child: Text(_languageEndonym(item)),
                  ),
              ],
              onChanged: (Locale? next) {
                if (next != null) onLocaleChanged(next);
              },
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsetsDirectional.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            const SizedBox(height: 12),
            Text(copy.renewTitle),
            const SizedBox(height: 12),
            Text(copy.renewBody(periodEnd)),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () {},
                child: Text(copy.stopRenewal),
              ),
            ),
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: TextButton(
                onPressed: () {},
                child: Text(copy.endNow),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _languageEndonym(Locale locale) {
  switch (locale.languageCode) {
    case 'ta':
      return 'தமிழ்';
    case 'ar':
      return 'العربية';
    case 'de':
      return 'Deutsch';
    default:
      return 'English';
  }
}
