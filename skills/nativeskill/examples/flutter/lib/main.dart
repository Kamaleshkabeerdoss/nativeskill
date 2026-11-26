import 'package:flutter/material.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    final copy = AppLocalizations.of(context);
    return Column(
      children: [
        Text(copy.signOut),
        Text('Cancel subscription'),
      ],
    );
  }
}
