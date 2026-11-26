# RTL UI review

- Use the locale profile's script to determine base direction. Set document or screen language and direction at the correct scope. Use the project platform's equivalents on native apps.
- On the web, isolate dynamic text of unknown direction with `bdi` or an appropriate `dir="auto"` wrapper. Check order IDs, emails, URLs, phone numbers, and brand names inside surrounding RTL text. Avoid embedding direction control characters into translations when markup can do the job.
- Use logical layout properties and mirror icons with directional meaning. Test forms, table navigation, keyboard order, and clipped text.
- Keep the project's locale-aware number, date, and currency formatting. Test plural messages with actual values, including Arabic's different cardinal forms.
- Verify script-specific rendering. `Mong`, for example, has vertical layout requirements that a bidirectional base-direction value alone cannot represent.

[W3C structural RTL markup](https://www.w3.org/International/questions/qa-html-dir) · [Unicode locale data](https://cldr.unicode.org/)
