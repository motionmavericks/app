import os
import sys
import json
from collections import defaultdict, Counter
import boto3
from botocore.config import Config


def human_bytes(n: int) -> str:
    units = ["B", "KB", "MB", "GB", "TB", "PB"]
    size = float(n)
    for u in units:
        if size < 1024.0:
            return f"{size:.2f} {u}"
        size /= 1024.0
    return f"{size:.2f} EB"


MASTER_VIDEO = {"mov", "mxf", "mp4", "m4v", "avi", "mkv", "prores"}
RAW_VIDEO = {"braw", "r3d"}
RAW_PHOTO = {"arw", "cr2", "cr3", "nef", "raf", "dng", "gpr"}
IMG_COMP = {"jpg", "jpeg", "png", "hif", "heic", "webp"}
IMG_HIGH = {"tif", "tiff", "exr", "dpx"}
AUDIO = {"wav", "aif", "aiff", "mp3", "flac", "caf", "m4a"}
PROJECT = {"prproj", "aep", "drp"}
SIDECAR = {"xmp", "xml", "cfa", "pek", "srt", "vtt", "luts", "cube"}
DOC = {"pdf", "doc", "docx", "xlsx", "csv", "txt", "md"}
CODE = {"js", "ts", "tsx", "py", "mjs", "map", "json"}
ARCHIVE = {"zip", "rar", "7z", "tar", "gz"}


def ext_group(ext: str) -> str:
    e = ext.lower()
    if e in RAW_VIDEO:
        return "raw_video"
    if e in MASTER_VIDEO:
        return "video"
    if e in RAW_PHOTO:
        return "raw_photo"
    if e in IMG_HIGH:
        return "image_high"
    if e in IMG_COMP:
        return "image"
    if e in AUDIO:
        return "audio"
    if e in PROJECT:
        return "project"
    if e in SIDECAR:
        return "sidecar"
    if e in DOC:
        return "doc"
    if e in CODE:
        return "code"
    if e in ARCHIVE:
        return "archive"
    if e == "_none":
        return "_none"
    return "other"


def summarize_bucket(s3, bucket: str, endpoint: str, max_samples: int = 20):
    paginator = s3.get_paginator("list_objects_v2")
    total_size = 0
    total_count = 0
    max_modified = None
    ext_counter = Counter()
    group_bytes = Counter()
    group_count = Counter()
    top_prefix = defaultdict(lambda: {"count": 0, "bytes": 0})
    depth2 = defaultdict(lambda: defaultdict(lambda: {"count": 0, "bytes": 0}))
    samples = []
    year_hist_bytes = Counter()
    year_hist_count = Counter()

    for page in paginator.paginate(Bucket=bucket):
        contents = page.get("Contents", [])
        total_count += len(contents)
        for obj in contents:
            size = int(obj.get("Size", 0))
            total_size += size
            lm = obj.get("LastModified")
            if lm is not None and (max_modified is None or lm > max_modified):
                max_modified = lm
            key = obj.get("Key", "")
            if not key:
                continue
            # extension grouping
            *_, last = key.split("/")
            ext = last.lower().rsplit(".", 1)[-1] if "." in last else "_none"
            ext_counter[ext] += 1
            g = ext_group(ext)
            group_bytes[g] += size
            group_count[g] += 1
            if lm is not None:
                year = str(lm.year)
                year_hist_bytes[year] += size
                year_hist_count[year] += 1
            # top-level prefix
            top = key.split("/", 1)[0]
            top_prefix[top]["count"] += 1
            top_prefix[top]["bytes"] += size
            # depth-2 breakdown for big tops
            parts = key.split("/")
            if len(parts) >= 2:
                second = parts[1]
                d2 = depth2[top][second]
                d2["count"] += 1
                d2["bytes"] += size
            # sample a few keys only
            if len(samples) < max_samples:
                samples.append({"key": key, "size": size})

    top = [
        {
            "prefix": p,
            "count": v["count"],
            "bytes": v["bytes"],
            "bytes_human": human_bytes(v["bytes"]),
        }
        for p, v in sorted(top_prefix.items(), key=lambda x: x[1]["bytes"], reverse=True)[:20]
    ]

    return {
        "bucket": bucket,
        "endpoint": endpoint,
        "objects": total_count,
        "bytes": total_size,
        "bytes_human": human_bytes(total_size),
        "last_modified": max_modified.isoformat() if max_modified else None,
        "top_prefixes": top,
        "ext_histogram": ext_counter.most_common(50),
        "groups": {
            g: {
                "count": group_count[g],
                "bytes": group_bytes[g],
                "bytes_human": human_bytes(group_bytes[g]),
            }
            for g in sorted(group_bytes.keys(), key=lambda k: group_bytes[k], reverse=True)
        },
        "year_histogram": {
            y: {"count": year_hist_count[y], "bytes": year_hist_bytes[y], "bytes_human": human_bytes(year_hist_bytes[y])}
            for y in sorted(year_hist_bytes.keys())
        },
        "depth2": {
            top: [
                {"second": s, "count": v["count"], "bytes": v["bytes"], "bytes_human": human_bytes(v["bytes"]) }
                for s, v in sorted(d.items(), key=lambda x: x[1]["bytes"], reverse=True)[:20]
            ]
            for top, d in depth2.items()
        },
        "samples": samples,
    }


def main():
    access_key = os.environ.get("AWS_ACCESS_KEY_ID")
    secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
    endpoint = os.environ.get("WASABI_ENDPOINT", "https://s3.wasabisys.com")
    region = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")

    if not access_key or not secret_key:
        print("Missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY in environment", file=sys.stderr)
        sys.exit(2)

    base = boto3.client(
        "s3",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        endpoint_url=endpoint,
        region_name=region,
        config=Config(s3={"addressing_style": "path"}),
    )

    result = {"default_endpoint": endpoint, "buckets": []}

    buckets = base.list_buckets().get("Buckets", [])
    for b in buckets:
        name = b["Name"]
        try:
            loc = base.get_bucket_location(Bucket=name).get("LocationConstraint")
        except Exception:
            loc = None
        # pick correct endpoint for bucket region
        bucket_region = loc or "us-east-1"
        if bucket_region in (None, "us-east-1", "US"):
            ep = "https://s3.wasabisys.com"
        else:
            ep = f"https://s3.{bucket_region}.wasabisys.com"
        s3 = boto3.client(
            "s3",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            endpoint_url=ep,
            region_name=bucket_region,
            config=Config(s3={"addressing_style": "path"}),
        )
        summary = summarize_bucket(s3, name, ep)
        summary["region"] = loc or "us-east-1"
        result["buckets"].append(summary)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
