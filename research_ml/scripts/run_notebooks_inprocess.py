"""
In-process Jupyter Notebook Runner
Executes code cells, captures stdout and matplotlib plots, and saves fully executed notebooks.
"""

import sys
import io
import base64
import traceback
from pathlib import Path
import nbformat
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

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
    print(f"Executing {nb_name} in-process...", flush=True)

    with open(nb_path, "r", encoding="utf-8") as f:
        nb = nbformat.read(f, as_version=4)

    # Clean local namespace for each notebook
    local_ns = {}
    
    # Custom display function
    def custom_display(*args, **kwargs):
        for arg in args:
            if isinstance(arg, pd.DataFrame):
                print(arg.to_string(), flush=True)
            else:
                print(arg, flush=True)

    local_ns["display"] = custom_display

    exec_count = 1
    for cell in nb.cells:
        if cell.cell_type == "code":
            source = cell.source
            cell.outputs = []
            
            # Setup output capture
            stdout_trap = io.StringIO()
            stderr_trap = io.StringIO()
            old_stdout = sys.stdout
            old_stderr = sys.stderr
            sys.stdout = stdout_trap
            sys.stderr = stderr_trap

            # Track plots
            plots_before = set(plt.get_fignums())

            try:
                exec(source, local_ns)
            except Exception as e:
                print(f"Error in cell execution: {e}", file=stderr_trap)
                traceback.print_exc(file=stderr_trap)
            finally:
                sys.stdout = old_stdout
                sys.stderr = old_stderr

            # 1. Capture stdout
            captured_stdout = stdout_trap.getvalue()
            if captured_stdout:
                cell.outputs.append(nbformat.v4.new_output(
                    output_type="stream",
                    name="stdout",
                    text=captured_stdout
                ))

            # 2. Capture stderr
            captured_stderr = stderr_trap.getvalue()
            if captured_stderr:
                cell.outputs.append(nbformat.v4.new_output(
                    output_type="stream",
                    name="stderr",
                    text=captured_stderr
                ))

            # 3. Capture any generated figures
            plots_after = set(plt.get_fignums())
            new_plots = plots_after - plots_before
            for fig_num in sorted(plots_after):
                fig = plt.figure(fig_num)
                buf = io.BytesIO()
                fig.savefig(buf, format="png", bbox_inches="tight", dpi=100)
                buf.seek(0)
                img_b64 = base64.b64encode(buf.read()).decode("utf-8")
                buf.close()
                plt.close(fig)

                cell.outputs.append(nbformat.v4.new_output(
                    output_type="display_data",
                    data={
                        "image/png": img_b64,
                        "text/plain": "<Figure size ... with ... Axes>"
                    }
                ))

            cell.execution_count = exec_count
            exec_count += 1

    with open(nb_path, "w", encoding="utf-8") as f:
        nbformat.write(nb, f)
    print(f"  [OK] Saved executed {nb_name} with {exec_count-1} executed cells.", flush=True)

print("\nAll target notebooks executed and persisted successfully.", flush=True)
