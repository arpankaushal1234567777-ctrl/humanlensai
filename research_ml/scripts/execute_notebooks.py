"""
Execute Notebooks in-place to ensure all output cells and plots are preserved.
"""
import sys
from pathlib import Path
import nbformat
from nbclient import NotebookClient

notebooks = [
    "10_face_features.ipynb",
    "11_multimodal_fusion.ipynb",
    "12_threshold_analysis.ipynb",
    "13_bias_analysis.ipynb",
    "14_intervention_evaluation.ipynb",
]

notebooks_dir = Path(__file__).resolve().parent.parent / "notebooks"

for nb_name in notebooks:
    nb_path = notebooks_dir / nb_name
    print(f"Executing {nb_name}...")
    try:
        with open(nb_path, "r", encoding="utf-8") as f:
            nb = nbformat.read(f, as_version=4)

        client = NotebookClient(nb, timeout=300, kernel_name="python3")
        client.execute(cwd=str(notebooks_dir))

        with open(nb_path, "w", encoding="utf-8") as f:
            nbformat.write(nb, f)
        print(f"  --> Successfully executed and saved {nb_name}")
    except Exception as e:
        print(f"  --> Error executing {nb_name}: {e}")
