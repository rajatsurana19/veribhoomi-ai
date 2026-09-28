from abc import ABC, abstractmethod
from typing import Dict, Any

class LRMSAdapter(ABC):
    """
    Abstract Integration Adapter for State LRMS / DILRMP Cadastral Registries.
    Enables zero-friction pluggability for actual NIC / State LRMS SOAP/REST systems.
    """

    @abstractmethod
    def push_record(self, document_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Pushes a verified and officer-approved land record to the external government registry.
        """
        pass

    @abstractmethod
    def get_record(self, external_id: str) -> Dict[str, Any]:
        """
        Retrieves committed record status from external government registry.
        """
        pass
