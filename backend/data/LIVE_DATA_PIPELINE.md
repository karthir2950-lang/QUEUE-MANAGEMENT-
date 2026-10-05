# LIVE DATA PIPELINE

## Purpose
Public datasets are NOT a replacement for live SmartQueue data. This pipeline collects first-party operational data to continuously improve AI models.

## Events Tracked
- `appointment_created`
- `check_in`
- `queue_joined`
- `token_called`
- `service_started`
- `service_completed`
- `cancelled`
- `no_show`

## Feature Snapshotting
When a user joins the queue (`queue_joined`), the system must snapshot:
- `people_ahead_at_join`
- `queue_size_at_join`
- `active_staff_at_join`
- `active_counters_at_join`

When a service is completed (`service_completed`), the system must calculate and store:
- `actual_wait_minutes`
- `service_duration_minutes`

This historical queue snapshot table acts as the ground-truth for future ML training.
