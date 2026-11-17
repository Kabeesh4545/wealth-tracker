from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.services.data_sources.provenance import DataProvenanceSchema

class BaseDataProvider(ABC):
    """
    Abstract Base Class for Data Providers.
    All data providers must implement fetch_data, validate_data, and get_provenance.
    """

    def __init__(self, source_key: str, name: str, category: str):
        self.source_key = source_key
        self.name = name
        self.category = category

    @abstractmethod
    def fetch_data(self, db: Session, **kwargs) -> Dict[str, Any]:
        """Fetch data from external feed or local benchmark repository."""
        pass

    @abstractmethod
    def validate_data(self, payload: Dict[str, Any]) -> bool:
        """Validate payload data structure and bounds."""
        pass

    @abstractmethod
    def get_provenance(self, payload: Dict[str, Any]) -> DataProvenanceSchema:
        """Construct provenance metadata object."""
        pass
