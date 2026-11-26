# Task

Northwind already ships English, Tamil, Arabic, Japanese, and Simplified Chinese. Add German.

Read the existing locale files before you write German. Match their terminology and tone:
- The product name Northwind stays untranslated in every file.
- Dialog Cancel and the subscription stop-renewal action are already different words in every shipped language. Keep them different in German.
- Placeholders {name}, {date}, {amount}, and {count} stay byte-exact.
- Japanese buttons are not polite sentences. Chinese is Simplified. Follow that level of shortness.
- Register German in i18n.js supportedLngs.

Write `outputs/<which>/de.json` and `outputs/<which>/i18n.js` only. Do not modify the existing locale files.
