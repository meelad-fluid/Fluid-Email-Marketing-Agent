-- /fluid klaviyo-drafts and /fluid shopify-discounts are logged as outcome 'setting'.
alter table slack_audit drop constraint if exists slack_audit_outcome_check;
alter table slack_audit add constraint slack_audit_outcome_check check (outcome in ('ran','refused_user','refused_channel','refused_request','blocked_output','error','linked','unlinked','setting'));
