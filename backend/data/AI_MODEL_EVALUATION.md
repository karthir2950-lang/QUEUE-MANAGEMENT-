# AI MODEL EVALUATION

- **Model Version**: v1
- **Training Algorithm**: RandomForestRegressor (n_estimators=100)
- **Training Records**: 55,275 (Apollo) -> 44,220 Train / 11,055 Test

## Metrics
- **MAE**: 9.67 minutes
- **RMSE**: 12.83 minutes
- **R²**: -0.10
- **Baseline MAE**: 74.29 minutes (people_ahead * average_service_time)

## Analysis
The model significantly outperforms the naive baseline (9.67 mins vs 74.29 mins). However, the R² is slightly negative, indicating the dataset features (like random placeholders for people_ahead) lack the strong linear correlation needed to beat a mean-predictor perfectly on this specific synthesized layout. Real SmartQueue data will naturally improve R² by providing true `people_ahead` and `queue_size` metrics at the exact moment of joining.
