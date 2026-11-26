# Provenance

Every bundled label is either source-attested from a pinned file or a draft. Drafts are original NativeSkill suggestions. They are not copied from a product, and they are not a native-speaker review. The repo license is MIT. Only strings whose upstream license can sit beside MIT are vendored. GPL, AGPL, and extra-restriction licenses are not.

| Source id | Project | Revision | License | What we take |
| --- | --- | --- | --- | --- |
| `ooui` | wikimedia/oojs-ui | `2580161f7d921436502ec6a7547e4c45bff510e7` | MIT | Dialog, navigation, file, and retry buttons |
| `visualeditor` | wikimedia/VisualEditor | `2a036d962beec1499db1bfcc375abbada048a80f` | MIT | Editing menu and find |
| `visualeditor-mediawiki` | wikimedia/mediawiki-extensions-VisualEditor | `a10c727c981195b78b51fc758af53c5747abe1f8` | MIT | Edit, save, upload, publish |
| `uls` | wikimedia/jquery.uls | `b7774c42131677bbbe039f4d76cba3d2a5cd438a` | MIT | Language search |
| `django-admin` | django/django | `d922c68f24e10cab085a6f2200825d3cc29cfd75` | BSD-3-Clause | Sign in, sign out, delete, save, search |
| `django-forms` | django/django | same | BSD-3-Clause | Clear selection, required field |
| `flutter` | flutter/flutter | `ae9b586f34a8443573f82ef57c3bf914a908cbf7` | BSD-3-Clause | Material buttons, including "Invalid format." |
| `aosp` | aosp-mirror/platform_frameworks_base | `1cdfff555f4a21f71ccc978290e2e212e2f8b168` | Apache-2.0 | Allow, deny, share, submit, loading, skip |
| `aosp-settings` | aosp-mirror/platform_packages_apps_Settings | `7c598253ff60f06f8e6fe046f18fd88e9daa72d3` | Apache-2.0 | Archive and restore app buttons |
| `devise-i18n` | tigrish/devise-i18n | `6bc267898c3873b82a7463925160d5dbf85ee04d` | MIT | Sign up, reset password, confirm account, session expired |

Notices are in `skills/nativeskill/licenses/`. Unicode CLDR metadata is under `LICENSE-UNICODE.txt`.

## Left out on purpose

- Telegram for Android was removed. Those strings are GPL-2.0-only and do not belong in this MIT repo. Account and billing lines that only existed there are drafts now.
- Pretix was not imported. The project is AGPL-3.0 with extra commercial terms.
- Hindi Android `skip_button_label` means "not now", so it is not `navigation.skip_step`.
- Hindi Django "This field is required." uses क्षेत्र (region) and is not a form-field error.
- Tamil Settings `archive` is காப்பிடு, which means copy. It is not `item.archive`. The Tamil archive button is a draft: காப்பகப்படுத்து.

A `source-attested` hit means that product shipped those words for that action. It does not mean they are the most natural words for a different app. Read the locale note before you reuse a noun on a button.
