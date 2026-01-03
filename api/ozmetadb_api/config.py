from __future__ import annotations
from pydantic import BaseModel
import os

class Settings(BaseModel):
    data_dir: str = os.environ.get("OZ_CP_DATA_DIR", "../out/control-plane")
    schema_path: str = os.environ.get("OZ_SNAPSHOT_SCHEMA", "../exports/spec/ozmeta.metadata.snapshot.schema.json")
    generator_cmd: str = os.environ.get("OZ_GENERATOR_CMD", "../generator/src/generate_from_snapshot.py")

settings = Settings()
