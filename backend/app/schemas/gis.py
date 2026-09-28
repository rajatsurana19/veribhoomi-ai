from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class VillageGISFeature(BaseModel):
    type: str = "Feature"
    properties: Dict[str, Any]
    geometry: Dict[str, Any]

class GISFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    name: str = "VeriBhoomi_Sample_Village_Cadastral_Boundaries"
    features: List[VillageGISFeature]
    disclaimer: str = "Sample boundary data for demonstration purposes only"
