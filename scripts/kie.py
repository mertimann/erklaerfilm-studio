#!/usr/bin/env python3
"""Kie.ai API helper: createTask -> poll recordInfo -> return result URLs.
Uses only stdlib (urllib) so no pip installs needed.
"""
import json, sys, time, urllib.request, urllib.error, os

API_KEY = os.environ.get("KIE_API_KEY", "").strip()
BASE = "https://api.kie.ai/api/v1"

def _req(url, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {API_KEY}")
    req.add_header("Content-Type", "application/json")
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            txt = e.read().decode()
            if e.code in (429, 500, 502, 503) and attempt < 4:
                time.sleep(3 * (attempt + 1)); continue
            raise RuntimeError(f"HTTP {e.code}: {txt}")
        except urllib.error.URLError as e:
            if attempt < 4:
                time.sleep(3 * (attempt + 1)); continue
            raise
    raise RuntimeError("request failed after retries")

def create_task(model, inp):
    resp = _req(f"{BASE}/jobs/createTask", "POST", {"model": model, "input": inp})
    if resp.get("code") != 200:
        raise RuntimeError(f"createTask failed: {resp}")
    tid = resp["data"]["taskId"]
    return tid

def poll(task_id, timeout=900, interval=8):
    start = time.time()
    last = None
    while time.time() - start < timeout:
        resp = _req(f"{BASE}/jobs/recordInfo?taskId={task_id}")
        data = resp.get("data", {})
        state = data.get("state")
        if state != last:
            print(f"    [{task_id[:16]}] state={state}", file=sys.stderr); last = state
        if state == "success":
            rj = json.loads(data.get("resultJson") or "{}")
            urls = rj.get("resultUrls") or []
            return urls, data.get("creditsConsumed")
        if state == "fail":
            raise RuntimeError(f"task failed: {data.get('failMsg') or data.get('failCode')}")
        time.sleep(interval)
    raise TimeoutError(f"poll timeout for {task_id}")

def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8"})
    with urllib.request.urlopen(req, timeout=120) as r, open(path, "wb") as f:
        f.write(r.read())
    return path

def run(model, inp, out_path=None, timeout=900):
    """create + poll; optionally download first result url to out_path."""
    tid = create_task(model, inp)
    print(f"    created {tid}", file=sys.stderr)
    urls, credits = poll(tid, timeout=timeout)
    print(f"    done, credits={credits}, urls={len(urls)}", file=sys.stderr)
    if out_path and urls:
        download(urls[0], out_path)
        print(f"    saved {out_path}", file=sys.stderr)
    return {"taskId": tid, "urls": urls, "credits": credits}

if __name__ == "__main__":
    # CLI: kie.py <model> <input_json> [out_path]
    model = sys.argv[1]
    inp = json.loads(sys.argv[2])
    out = sys.argv[3] if len(sys.argv) > 3 else None
    res = run(model, inp, out)
    print(json.dumps(res))
