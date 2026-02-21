"""Convert UltimateSpecialist → ONNX for mobile/server deployment.

Usage:
    python convert_onnx.py            # FP32 + optional INT8 quantization

Output:
    model_mobile.onnx      (~200 MB FP32)
    model_mobile_int8.onnx (~50 MB INT8, 2-4× faster on CPU)

Fix notes vs previous attempt:
    - PyTorch >=2.5 defaults to the dynamo exporter which silently produces a
      broken 1.7 MB graph for this model.  We force dynamo=False (TorchScript
      tracing) which correctly captures the full ~200 MB ConvNeXt-Small graph.
    - opset_version lowered from 17 → 14 to avoid the Resize adapter bug in
      onnxscript's version converter.
"""

import os, sys, time
import torch
import torch.nn as nn
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from run import UltimateSpecialist, Config

MOBILE_TILE = 224
SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
ONNX_OUT    = os.path.join(SCRIPT_DIR, "model_mobile.onnx")
ONNX_INT8   = os.path.join(SCRIPT_DIR, "model_mobile_int8.onnx")


class MobileWrapper(nn.Module):
    """Simplify I/O for ONNX export: flat tiles (N,C,H,W) instead of (B,N,C,H,W)."""

    def __init__(self, model: UltimateSpecialist):
        super().__init__()
        self.m = model

    def forward(self, tiles: torch.Tensor, meta: torch.Tensor):
        # tiles: (N, C, H, W) — all tiles for one image
        # meta:  (1, 3)       — one-hot rice type [Paddy, White, Brown]
        counts, measures = self.m(tiles.unsqueeze(0), meta)
        return counts, measures  # (1, 9), (1, 6)


def export() -> str:
    print("Loading checkpoint …")
    ckpt = torch.load(Config.CHECKPOINT, map_location="cpu", weights_only=False)
    base = UltimateSpecialist(Config.MODEL_NAME)
    base.load_state_dict(ckpt["model"])
    base.eval()

    model = MobileWrapper(base).eval()

    N = Config.N_TILES  # 48 tiles
    dummy_tiles = torch.randn(N, 3, MOBILE_TILE, MOBILE_TILE)
    dummy_meta = torch.zeros(1, 3)
    dummy_meta[0, 0] = 1.0  # Paddy

    print(f"Exporting ONNX (opset=14, dynamo=False, tile={MOBILE_TILE}×{MOBILE_TILE}) …")
    t0 = time.time()
    with torch.no_grad():
        torch.onnx.export(
            model,
            (dummy_tiles, dummy_meta),
            ONNX_OUT,
            input_names=["tiles", "meta"],
            output_names=["counts", "measures"],
            dynamic_axes={"tiles": {0: "n_tiles"}, "meta": {0: "batch"}},
            opset_version=14,       # 14 = stable; avoids Resize adapter bug in opset 17
            do_constant_folding=True,
            dynamo=False,           # CRITICAL: force TorchScript tracer (not dynamo)
                                    # dynamo default in PyTorch>=2.5 silently produces
                                    # a broken 1.7 MB graph for this model
        )
    elapsed = time.time() - t0
    mb = os.path.getsize(ONNX_OUT) / 1e6
    print(f"  ✓ saved → {ONNX_OUT}  ({mb:.1f} MB, {elapsed:.1f}s)")
    if mb < 50:
        print("  ⚠ WARNING: file is suspiciously small — backbone may not have been captured.")
        print("    Check that checkpoint contains backbone weights.")
    return ONNX_OUT


def verify(path: str):
    try:
        import onnx
        m = onnx.load(path)
        onnx.checker.check_model(m)
        n_params = sum(np.prod(t.dims) for t in m.graph.initializer)
        print(f"ONNX graph check: OK ✓  ({n_params/1e6:.1f}M parameters)")
    except ImportError:
        print("Install onnx to verify: pip install onnx")


def quantize_int8(fp32_path: str = ONNX_OUT, out_path: str = ONNX_INT8) -> str:
    """Apply dynamic INT8 quantization — typically 2-4× faster on CPU."""
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType
    except ImportError:
        print("Install onnxruntime to quantize: pip install onnxruntime")
        return fp32_path

    print("Quantizing to INT8 (dynamic) …")
    t0 = time.time()
    quantize_dynamic(
        fp32_path,
        out_path,
        weight_type=QuantType.QInt8,
    )
    mb = os.path.getsize(out_path) / 1e6
    print(f"  ✓ saved → {out_path}  ({mb:.1f} MB, {time.time()-t0:.1f}s)")
    return out_path


def _run_ort_benchmark(path: str, label: str, runs: int = 5) -> float:
    import onnxruntime as ort
    opts = ort.SessionOptions()
    opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    opts.intra_op_num_threads = 4
    sess = ort.InferenceSession(path, opts, providers=["CPUExecutionProvider"])

    tiles = np.random.randn(Config.N_TILES, 3, MOBILE_TILE, MOBILE_TILE).astype(np.float32)
    meta  = np.array([[1.0, 0.0, 0.0]], dtype=np.float32)

    sess.run(None, {"tiles": tiles, "meta": meta})  # warm-up

    ts = []
    for _ in range(runs):
        t = time.perf_counter()
        sess.run(None, {"tiles": tiles, "meta": meta})
        ts.append(time.perf_counter() - t)

    avg_ms = np.mean(ts) * 1e3
    print(f"{label:<28} avg={avg_ms:.0f}ms  min={np.min(ts)*1e3:.0f}ms")
    return avg_ms


def benchmark(path: str = ONNX_OUT, runs: int = 5) -> float:
    try:
        import onnxruntime  # noqa
    except ImportError:
        print("Install onnxruntime: pip install onnxruntime")
        return 0.0
    return _run_ort_benchmark(path, f"ONNX FP32 (CPU)", runs)


def pytorch_benchmark(runs: int = 5) -> float:
    """Compare PyTorch inference at the same resolution."""
    ckpt = torch.load(Config.CHECKPOINT, map_location="cpu", weights_only=False)
    model = UltimateSpecialist(Config.MODEL_NAME)
    model.load_state_dict(ckpt["model"])
    model.eval()

    N = Config.N_TILES
    tiles = torch.randn(1, N, 3, MOBILE_TILE, MOBILE_TILE)
    meta  = torch.zeros(1, 3)
    meta[0, 0] = 1.0

    with torch.no_grad():
        model(tiles, meta)  # warm-up

    ts = []
    for _ in range(runs):
        t = time.perf_counter()
        with torch.no_grad():
            model(tiles, meta)
        ts.append(time.perf_counter() - t)

    avg_ms = np.mean(ts) * 1e3
    print(f"{'PyTorch FP32 (CPU)':<28} avg={avg_ms:.0f}ms  min={np.min(ts)*1e3:.0f}ms")
    return avg_ms


if __name__ == "__main__":
    fp32_path = export()
    verify(fp32_path)

    # INT8 quantization
    int8_path = quantize_int8(fp32_path)

    print(f"\n── Speed Comparison ({MOBILE_TILE}×{MOBILE_TILE} tiles × {Config.N_TILES}, CPU) ──")
    pt_ms   = pytorch_benchmark()
    fp32_ms = benchmark(fp32_path)
    int8_ms = _run_ort_benchmark(int8_path, "ONNX INT8 (CPU)") if os.path.exists(int8_path) else None

    print()
    if fp32_ms:
        print(f"  ONNX FP32 speedup: {pt_ms/fp32_ms:.2f}×")
    if int8_ms:
        print(f"  ONNX INT8 speedup: {pt_ms/int8_ms:.2f}×  ← use this on server/mobile")
