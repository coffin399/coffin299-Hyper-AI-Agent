from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Dict, List, Optional
import subprocess
import platform

from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class ModelConfig:
    def __init__(self, model: str, quantization: str, size_gb: float, description: str):
        self.model = model
        self.quantization = quantization
        self.size_gb = size_gb
        self.description = description


# PCスペック別モデル設定
MODEL_CONFIGS = {
    "ultraLow": {  # RAM 4GB以下
        "models": [
            ModelConfig("qwen3-0.6b", "Q4_K_M", 0.5, "Qwen3 0.6B - 軽量モデル"),
        ],
        "description": "RAM 4GB以下向け",
        "min_ram_gb": 0,
    },
    "low": {  # RAM 8GB
        "models": [
            ModelConfig("gemma3-4b", "Q4_K_M", 2.5, "Gemma3 4B - 軽量高性能"),
            ModelConfig("phi-4-mini", "Q4_K_M", 2.0, "Phi-4 Mini - 軽量"),
        ],
        "description": "RAM 8GB向け",
        "min_ram_gb": 8,
    },
    "medium": {  # RAM 16GB
        "models": [
            ModelConfig("qwen3-4b", "Q8_0", 4.0, "Qwen3 4B - 高精度"),
            ModelConfig("gemma3-12b", "Q8_0", 8.0, "Gemma3 12B - 高性能"),
        ],
        "description": "RAM 16GB向け",
        "min_ram_gb": 16,
    },
    "high": {  # RAM 32GB+
        "models": [
            ModelConfig("qwen3-30b", "Q8_0", 20.0, "Qwen3 30B - 最高性能"),
            ModelConfig("gemma3-27b", "Q8_0", 18.0, "Gemma3 27B - 最高性能"),
        ],
        "description": "RAM 32GB以上向け",
        "min_ram_gb": 32,
    },
}


class ModelService:
    """ローカルモデルのダウンロードと管理"""

    def __init__(self) -> None:
        self.models_dir = Path(settings.data_dir) / "models"
        self.models_dir.mkdir(parents=True, exist_ok=True)

    def get_available_configs(self) -> Dict[str, Dict]:
        """利用可能なモデル設定を取得"""
        return MODEL_CONFIGS

    def get_downloaded_models(self) -> List[Dict]:
        """ダウンロード済みモデル一覧を取得"""
        models = []
        for config_key, config_data in MODEL_CONFIGS.items():
            for model in config_data["models"]:
                model_path = self.models_dir / f"{model.model}-{model.quantization}"
                if model_path.exists():
                    models.append({
                        "config_key": config_key,
                        "model": model.model,
                        "quantization": model.quantization,
                        "size_gb": model.size_gb,
                        "description": model.description,
                        "path": str(model_path),
                    })
        return models

    async def download_model(self, model: str, quantization: str, progress_callback=None) -> bool:
        """モデルをダウンロード"""
        model_config = None
        for config_data in MODEL_CONFIGS.values():
            for m in config_data["models"]:
                if m.model == model and m.quantization == quantization:
                    model_config = m
                    break
            if model_config:
                break

        if not model_config:
            raise ValueError(f"Model {model} with quantization {quantization} not found")

        model_path = self.models_dir / f"{model}-{quantization}"
        if model_path.exists():
            logger.info(f"Model already exists: {model_path}")
            return True

        try:
            # Ollamaを使用してモデルをダウンロード
            cmd = ["ollama", "pull", f"{model}:{quantization}"]
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                if progress_callback:
                    progress_callback(line.decode().strip())

            return_code = await process.wait()
            if return_code == 0:
                # モデルパスを作成
                model_path.mkdir(parents=True, exist_ok=True)
                logger.info(f"Model downloaded successfully: {model}")
                return True
            else:
                error = await process.stderr.read()
                logger.error(f"Failed to download model: {error.decode()}")
                return False

        except Exception as e:
            logger.error(f"Error downloading model: {e}")
            return False

    async def delete_model(self, model: str, quantization: str) -> bool:
        """モデルを削除"""
        try:
            cmd = ["ollama", "rm", f"{model}:{quantization}"]
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            return_code = await process.wait()

            if return_code == 0:
                # ローカルパスも削除
                model_path = self.models_dir / f"{model}-{quantization}"
                if model_path.exists():
                    model_path.rmdir()
                logger.info(f"Model deleted successfully: {model}")
                return True
            else:
                error = await process.stderr.read()
                logger.error(f"Failed to delete model: {error.decode()}")
                return False

        except Exception as e:
            logger.error(f"Error deleting model: {e}")
            return False

    def get_system_info(self) -> Dict:
        """システム情報を取得"""
        try:
            if platform.system() == "Windows":
                import psutil
                ram_gb = psutil.virtual_memory().total / (1024**3)
            else:
                import os
                with open('/proc/meminfo', 'r') as f:
                    for line in f:
                        if line.startswith('MemTotal:'):
                            ram_kb = int(line.split()[1])
                            ram_gb = ram_kb / (1024**2)
                            break
                    else:
                        ram_gb = 0
        except Exception:
            ram_gb = 0

        return {
            "platform": platform.system(),
            "ram_gb": round(ram_gb, 1),
            "recommended_config": self._get_recommended_config(ram_gb),
        }

    def _get_recommended_config(self, ram_gb: float) -> str:
        """RAM容量から推奨設定を取得"""
        if ram_gb >= 32:
            return "high"
        elif ram_gb >= 16:
            return "medium"
        elif ram_gb >= 8:
            return "low"
        else:
            return "ultraLow"


model_service = ModelService()
