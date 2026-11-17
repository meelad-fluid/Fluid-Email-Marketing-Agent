-- 120 and 180 days let the dashboard compare 60 and 90 days with the period before (2N minus N).
alter table klaviyo_flow_stats drop constraint klaviyo_flow_stats_timeframe_check;
alter table klaviyo_flow_stats add constraint klaviyo_flow_stats_timeframe_check check (timeframe in ('30d', '60d', '90d', '120d', '180d', '365d'));
