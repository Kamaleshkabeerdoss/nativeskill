# Intent catalog

Pick the concept id before you pick a translation. The id is what `lookup.mjs` takes. Two concepts can share an English word and still need different words in the target language.

Lookup:

```sh
node <skill-dir>/scripts/lookup.mjs <locale> <concept-id> [ui-role]
```

Read `preserve` as constraints. If the screen does not do that thing, choose a different id or leave the string uncovered and mark the proposal `draft`.

## Dialogs

### `dialog.cancel_action`

Cancel a pending dialog action.

Where: Secondary dialog button.

- The pending action is abandoned.
- Do not use this concept for cancelling payments or subscriptions.

### `dialog.dismiss`

Close a dialog or sheet.

Where: Secondary button or close icon.

- Dismissal does not imply a change to account or subscription state.

## Navigation

### `navigation.go_back`

Return to the previous screen.

Where: Navigation button.

- The user moves backward in navigation.

### `navigation.continue`

Advance to the next step of the current flow.

Where: Wizard or setup button.

- The step advances without implying submission or payment.

### `navigation.skip_step`

Proceed without completing an optional step.

Where: Setup or onboarding button.

- The user can omit this step.

### `navigation.finish`

Complete the current flow.

Where: Final step button.

- The current task is complete after the action succeeds.

## Forms

### `form.clear_input`

Empty an editable input field.

Where: Clear button or accessible name.

- The current field contents are removed.
- The action does not delete a saved record.

### `form.apply_changes`

Apply changes to the active form or editor.

Where: Editor or form action.

- Match the app's behavior for whether the change is saved permanently.

### `form.save_changes`

Persist changes to the current record or settings.

Where: Form action.

- Changes are stored.
- Savings and downloads are separate concepts.

### `form.save_draft`

Store incomplete work to resume later.

Where: Draft action.

- The item is saved as a draft and remains unpublished.

### `form.discard_changes`

Abandon edits that were not saved.

Where: Confirmation or form action.

- Unsaved edits are lost.
- The existing saved item is kept.

### `form.submit`

Send form data for processing.

Where: Form action.

- The form is sent.
- Approval or success may still be pending.

### `form.required_field`

Tell the user a field must be completed.

Where: Inline validation.

- Completing the indicated field is mandatory.

### `form.invalid_format`

Tell the user the entered value has the wrong format.

Where: Inline validation.

- The issue is with input formatting.
- Retain the example format when given.

## Items

### `item.delete`

Delete an item using the application's deletion behavior.

Where: Item action.

- Use permanent-deletion wording only when irreversibility is established.

### `item.add`

Add an item to the current collection.

Where: Collection action.

- The item becomes part of the current collection.

### `item.edit`

Open an item for changes.

Where: Row or detail action.

- Opening edit mode is distinct from saving changes.

### `item.remove_from_list`

Remove an association from the current list.

Where: Collection or membership action.

- The item can still exist elsewhere.

### `item.delete_permanently`

Permanently delete the underlying item.

Where: Destructive confirmation.

- The item will be deleted.
- The operation is irreversible when the source says so.

### `item.archive`

Move an item out of active use while retaining it.

Where: Row or detail action.

- The item is retained.
- Restoration is possible only when the app supports it.

### `item.restore`

Return a retained item to active use.

Where: Archive or trash action.

- The existing item is recovered.

### `item.undo`

Reverse the most recent eligible operation.

Where: Temporary feedback action.

- The command reverses a specific prior action.

## Content

### `content.cut`

Remove selected content and copy it to the clipboard.

Where: Editing menu.

- Both the removal and clipboard behavior matter.

### `content.paste`

Insert content from the clipboard.

Where: Editing menu.

- The action inserts clipboard content.

### `content.select_all`

Select every item in the applicable scope.

Where: Editing or collection action.

- Preserve the scope of what gets selected.

### `content.find_in_text`

Find text within the current document or text editor.

Where: Find field.

- The search operates within the current content.

### `content.edit_page`

Open the current page in an editor.

Where: Page action.

- The current page becomes editable. Saving is a separate action.

### `content.edit_source`

Open the underlying source representation of the current content for editing.

Where: Editor tab or link.

- This action opens the source editor. It does not mean editing a data provider or source file unless that is the actual object.

### `content.copy`

Copy a value for pasting elsewhere.

Where: Text or link action.

- Copying creates a clipboard copy without removing the source.

### `content.download`

Retrieve a file onto the current device.

Where: File action.

- Data moves from the app to the user's device.

### `content.upload`

Send a local file into the application.

Where: File action.

- Data moves from the user's device into the app.

### `content.share`

Expose this content to recipients or other apps.

Where: Share action.

- The actual permissions and audience depend on the flow.

### `content.publish`

Make a draft available to its configured audience.

Where: Editor action.

- Publishing changes visibility.
- Specify public visibility only when the source says so.

## Files

### `file.clear_selection`

Clear the file selected in a file input.

Where: File input or checkbox.

- The file field is cleared.
- Describe record deletion only if the product actually deletes a stored file.

### `file.select`

Open the picker to select a file.

Where: File input action.

- Selecting a file can happen before uploading it.

## Search

### `search.query`

Find items that match a search query.

Where: Field, button, or accessible name.

- The user searches for a match.

### `search.no_results`

Report that nothing matched the current query or filters.

Where: Search empty state.

- No match does not imply there is no data in the app.

### `search.clear_filters`

Remove the filters currently applied.

Where: Results toolbar.

- Clearing filters does not delete content.

## Language picker

### `language.search`

Find a language in the language picker.

Where: Language picker search field.

- The user is searching languages rather than searching all app content.

## Account

### `auth.sign_in`

Start a session for an existing account.

Where: Authentication action.

- The user signs into an existing account.

### `auth.sign_out`

End the current session.

Where: Account menu action.

- The current session ends.
- The account itself is retained.

### `auth.create_account`

Create a new user account.

Where: Registration action.

- A new account is created.

### `auth.change_password`

Update the password through an authenticated account flow.

Where: Account settings action.

- This is a password update through settings.

### `auth.reset_password`

Start or complete password recovery according to the current step.

Where: Account recovery action.

- Match the current recovery step.
- Do not imply a reset has completed if only a link is sent.

### `auth.verify_email`

Verify control of the email address.

Where: Verification action.

- Verification is about the address, not personal identity.

### `auth.resend_code`

Send another verification code.

Where: Verification action.

- A code is sent again.
- Whether the previous code remains valid depends on the app.

### `auth.code_expired`

Report that the verification code is no longer valid.

Where: Verification error.

- Expiry is different from an incorrect code.

### `auth.session_expired`

Report that the current session is no longer valid.

Where: Session error.

- The session ended.
- The account remains available.

## Billing and subscriptions

### `billing.go_to_payment`

Open the payment step without placing a charge yet.

Where: Checkout navigation button.

- The user moves to payment.
- The current action has not charged them.

### `billing.pay_now`

Authorize or submit the payment at the current step.

Where: Checkout action.

- The action submits payment.
- Keep the stated amount and currency.

### `billing.payment_pending`

Tell the user the payment has not reached a final outcome.

Where: Payment status.

- The outcome is pending.
- Do not imply success, failure, or permission to retry.

### `billing.payment_declined`

Tell the user the payment provider declined the payment.

Where: Payment error.

- The payment was declined.
- Give a reason only when the app supplies one.

### `billing.retry_payment`

Try the payment operation again.

Where: Payment recovery action.

- This action starts another attempt.
- Do not imply the previous charge failed unless confirmed.

### `billing.cancel_payment`

Cancel the current payment attempt or payment flow.

Where: Payment action.

- The action concerns the current payment.
- It does not stop later renewals.

### `billing.stop_renewal`

Stop automatic renewal for a subscription.

Where: Subscription settings or confirmation.

- Future automatic renewal stops.
- Use the app's own rules for access and end dates.
- Do not imply immediate termination.

### `billing.end_subscription_now`

End the subscription immediately.

Where: Subscription confirmation.

- The change takes effect now.
- Do not promise a refund.

### `billing.refund_requested`

Report that a refund request has been submitted.

Where: Refund status.

- The request is recorded.
- The payment has not necessarily been refunded.

### `billing.refund_completed`

Report that the refund has been completed.

Where: Refund status.

- Use the actual completion state.
- Keep amount, currency, and payment destination when provided.

### `billing.discount_savings`

Describe the amount or percentage saved on a purchase.

Where: Pricing or offer label.

- Savings refer to money or a discount.
- Keep the amount, percentage, and conditions.

## Permissions

### `permissions.allow_access`

Grant the stated permission.

Where: Permission prompt or toggle.

- Name the resource and scope when the source provides them.

### `permissions.deny_access`

Decline the requested permission.

Where: Permission prompt.

- This action declines access for the specified scope.

## Status

### `status.loading`

Tell the user that content is being retrieved or prepared.

Where: Loading status.

- The result is still in progress.

### `status.retry`

Repeat a failed or interrupted operation.

Where: Recovery action.

- The action repeats the current operation.
- It does not indicate success.

## Records

### `crm.sales_leads`

Name the CRM records for potential customers or organizations.

Where: Navigation or list label.

- Use a noun for the record type.
- Keep leads distinct from existing customer contacts and qualified opportunities.
