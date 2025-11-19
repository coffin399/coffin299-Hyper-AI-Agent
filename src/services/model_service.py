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
    def __init__(
        self, 
        model: str, 
        quantization: str, 
        size_gb: float, 
        description: str,
        hf_repo_id: Optional[str] = None,
        hf_filename: Optional[str] = None
    ):
        self.model = model
        self.quantization = quantization
        self.size_gb = size_gb
        self.description = description
        self.hf_repo_id = hf_repo_id
        self.hf_filename = hf_filename


# PCスペック別モデル設定
# Note: Future model names (Qwen3, Gemma3, Phi-4) are mapped to current best equivalents for immediate usability.
MODEL_CONFIGS = {
    "ultraLow": {  # RAM 4GB以下
        "models": [
            ModelConfig(
                "qwen3-0.6b", "Q4_K_M", 0.5, "Qwen3 0.6B - 軽量モデル",
                hf_repo_id="Qwen/Qwen2.5-0.5B-Instruct-GGUF",
                hf_filename="qwen2.5-0.5b-instruct-q4_k_m.gguf"
            ),
        ],
        "description": "RAM 4GB以下向け",
        "min_ram_gb": 0,
    },
    "low": {  # RAM 8GB
        "models": [
            ModelConfig(
                "gemma3-4b", "Q4_K_M", 2.5, "Gemma3 4B - 軽量高性能",
                hf_repo_id="bartowski/gemma-2-2b-it-GGUF", # Using Gemma 2 2B as placeholder
                hf_filename="gemma-2-2b-it-Q4_K_M.gguf"
            ),
            ModelConfig(
                "phi-4-mini", "Q4_K_M", 2.0, "Phi-4 Mini - 軽量",
                hf_repo_id="bartowski/Phi-3.5-mini-instruct-GGUF", # Using Phi 3.5 Mini as placeholder
                hf_filename="Phi-3.5-mini-instruct-Q4_K_M.gguf"
            ),
        ],
        "description": "RAM 8GB向け",
        "min_ram_gb": 8,
    },
    "medium": {  # RAM 16GB
        "models": [
            ModelConfig(
                "qwen3-4b", "Q8_0", 4.0, "Qwen3 4B - 高精度",
                hf_repo_id="Qwen/Qwen2.5-3B-Instruct-GGUF", # Using Qwen 2.5 3B
                hf_filename="qwen2.5-3b-instruct-q8_0.gguf"
            ),
            ModelConfig(
                "gemma3-12b", "Q8_0", 8.0, "Gemma3 12B - 高性能",
                hf_repo_id="bartowski/gemma-2-9b-it-GGUF", # Using Gemma 2 9B
                hf_filename="gemma-2-9b-it-Q8_0.gguf"
            ),
        ],
        "description": "RAM 16GB向け",
        "min_ram_gb": 16,
    },
    "high": {  # RAM 32GB+
        "models": [
            ModelConfig(
                "qwen3-30b", "Q8_0", 20.0, "Qwen3 30B - 最高性能",
                hf_repo_id="Qwen/Qwen2.5-32B-Instruct-GGUF", # Using Qwen 2.5 32B
                hf_filename="qwen2.5-32b-instruct-q8_0.gguf"
            ),
            ModelConfig(
                "gemma3-27b", "Q8_0", 18.0, "Gemma3 27B - 最高性能",
                hf_repo_id="bartowski/gemma-2-27b-it-GGUF",
                hf_filename="gemma-2-27b-it-Q8_0.gguf"
            ),
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
                # Native mode check
                if settings.local_execution_mode == "native":
                    if model.hf_filename:
                        # Check for direct file existence in models_dir
                        model_path = self.models_dir / f"{model.model}-{model.quantization}.gguf"
                        if model_path.exists():
                             models.append({
                                "config_key": config_key,
                                "model": model.model,
                                "quantization": model.quantization,
                                "size_gb": model.size_gb,
                                "description": model.description,
                                "path": str(model_path),
                                "mode": "native"
                            })
                else:
                    # Ollama mode check
                    model_path = self.models_dir / f"{model.model}-{model.quantization}"
                    if model_path.exists():
                        models.append({
                            "config_key": config_key,
                            "model": model.model,
                            "quantization": model.quantization,
                            "size_gb": model.size_gb,
                            "description": model.description,
                            "path": str(model_path),
                            "mode": "ollama"
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

        # Native Mode Handling
        if settings.local_execution_mode == "native":
            if not model_config.hf_repo_id or not model_config.hf_filename:
                 logger.error(f"No HF repo/filename configured for {model}")
                 return False

            target_path = self.models_dir / f"{model}-{quantization}.gguf"
            if target_path.exists():
                logger.info(f"Model already exists: {target_path}")
                return True

            try:
                from huggingface_hub import hf_hub_download
                
                logger.info(f"Starting native download: {model_config.hf_repo_id}/{model_config.hf_filename}")
                if progress_callback:
                    progress_callback(f"Downloading {model_config.hf_filename} from {model_config.hf_repo_id}...")

                # Run in executor to avoid blocking
                loop = asyncio.get_running_loop()
                
                def _download():
                    return hf_hub_download(
                        repo_id=model_config.hf_repo_id,
                        filename=model_config.hf_filename,
                        local_dir=str(self.models_dir),
                        local_dir_use_symlinks=False, # Copy file to local_dir
                    )
                
                downloaded_path = await loop.run_in_executor(None, _download)
                
                # Rename to standard format if needed, but hf_hub_download with local_dir keeps original filename.
                # We want a consistent naming scheme for detection.
                source_path = Path(downloaded_path)
                
                if source_path != target_path:
                    # If the downloaded filename is different from our target, rename it.
                    # Note: hf_hub_download returns the path to the file.
                    # If we used local_dir, it should be in models_dir/filename.
                    # We want it to be models_dir/{model}-{quantization}.gguf
                    source_path.replace(target_path)
                
                logger.info(f"Native model downloaded and saved to: {target_path}")
                return True

            except ImportError:
                logger.error("huggingface_hub not installed.")
                return False
            except Exception as e:
                logger.error(f"Error in native download: {e}")
                return False

        # Ollama Mode (Default)
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
            if settings.local_execution_mode == "native":
                target_path = self.models_dir / f"{model}-{quantization}.gguf"
                if target_path.exists():
                    target_path.unlink()
                    logger.info(f"Native model deleted: {target_path}")
                    return True
                else:
                    logger.warning(f"Model file not found for deletion: {target_path}")
                    return False

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
