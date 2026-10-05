# DATA DICTIONARY

## Apollo Hospitals Dataset (Processed)
| Column | Type | Meaning | Source | Transformation | Used for AI? | Used for analytics? |
|--------|------|---------|--------|----------------|--------------|---------------------|
| appointment_hour | Int | Hour of appointment | Raw | None | Yes | Yes |
| day_of_week | String | Day of week | Raw | Mapped from appointment_day_of_week | Yes | Yes |
| specialty | String | Department | Raw | None | Yes | Yes |
| appointment_type | String | Type of visit | Raw | None | No | Yes |
| wait_time_minutes | Float | Wait time | Raw | Filtered Nulls for AI | Yes (Target) | Yes |
| consultation_duration_min | Float | Service time | Raw | Mapped to average_service_time | Yes | Yes |
| no_show | String | No show flag | Raw | None | Yes | Yes |
| is_weekend | Int | Weekend flag | Derived | Calculated from day_of_week | Yes | Yes |

## Unified AI Training Schema (smartqueue_ai_training.csv)
| Column | Type | Meaning | Source |
|--------|------|---------|--------|
| sector | String | Operational sector (HEALTHCARE) | Fixed |
| source_dataset | String | Origin of data (APOLLO) | Fixed |
| service_type | String | Specific service/specialty | Apollo.specialty |
| average_service_time | Float | Duration of service | Apollo.consultation_duration_min |
| actual_wait_minutes | Float | Target variable | Apollo.wait_time_minutes |
| people_ahead | Int | Approximated queue length | Derived / Random placeholder |
| queue_size | Int | Approximated total queue | Derived / Random placeholder |
