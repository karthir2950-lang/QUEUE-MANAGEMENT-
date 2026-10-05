from app.database.connection import engine
from app.models.prediction_log import Base

Base.metadata.create_all(bind=engine)
print("PredictionLogs table created.")
