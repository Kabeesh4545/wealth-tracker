from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.data_source import DataSource, DataRefreshLog
from app.services.data_sources.validators import DataValidationError

class RefreshManager:
    def __init__(self, db: Session):
        self.db = db

    def start_refresh_job(self, source_key: str) -> DataRefreshLog:
        """Finds or registers data source and initializes a DataRefreshLog entry."""
        ds = self.db.query(DataSource).filter(DataSource.source_key == source_key).first()
        if not ds:
            ds = DataSource(
                source_key=source_key,
                name=source_key.replace("_", " ").title(),
                category="general",
                source_type="API"
            )
            self.db.add(ds)
            self.db.commit()
            self.db.refresh(ds)

        log_entry = DataRefreshLog(
            data_source_id=ds.id,
            started_at=datetime.now(),
            status="IN_PROGRESS",
            records_fetched=0,
            records_updated=0,
            records_rejected=0
        )
        self.db.add(log_entry)
        self.db.commit()
        self.db.refresh(log_entry)
        return log_entry

    def complete_refresh_job(
        self,
        log_entry: DataRefreshLog,
        status: str,
        fetched: int = 0,
        updated: int = 0,
        rejected: int = 0,
        error_msg: Optional[str] = None
    ) -> DataRefreshLog:
        """
        Completes refresh job, updates DataSource last_refreshed_at and last_status.
        """
        log_entry.completed_at = datetime.now()
        log_entry.status = status
        log_entry.records_fetched = fetched
        log_entry.records_updated = updated
        log_entry.records_rejected = rejected
        log_entry.error_message = error_msg

        ds = self.db.query(DataSource).filter(DataSource.id == log_entry.data_source_id).first()
        if ds:
            ds.last_refreshed_at = datetime.now()
            ds.last_status = status

        self.db.commit()
        self.db.refresh(log_entry)
        return log_entry
