-- The dashboard's ranges are 30, 60 and 90 days, so flows get a 60-day window too.
alter table klaviyo_flow_stats drop constraint klaviyo_flow_stats_timeframe_check;
alter table klaviyo_flow_stats add constraint klaviyo_flow_stats_timeframe_check check (timeframe in ('30d', '60d', '90d', '365d'));
