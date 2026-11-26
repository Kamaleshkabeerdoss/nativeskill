import 'package:flutter/material.dart';

class NorthwindApp extends StatelessWidget {
  const NorthwindApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Northwind',
      locale: const Locale('en'),
      supportedLocales: const [Locale('en')],
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {},
        ),
        title: const Text('Northwind'),
      ),
      body: Padding(
        padding: const EdgeInsets.only(left: 16, right: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Cancel subscription'),
            const SizedBox(height: 12),
            FilledButton(onPressed: () {}, child: const Text('Cancel')),
          ],
        ),
      ),
    );
  }
}
