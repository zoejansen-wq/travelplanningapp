#!/usr/bin/env python3
"""Read-only collection engine. Produces review data, never changes the website."""
import argparse
import datetime as dt
import html
import json
import math
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[1]
UTC = dt.timezone.utc
USER_AGENT = "DayfolkResearchBot/0.1 (noncommercial research; https://travel.zoejansen.nl/credits.html)"
def iso_now():
    return dt.datetime.now(UTC).isoformat(timespec="seconds")
def parse_date(value):
    if not value: return None
    try: return dt.datetime.fromisoformat(str(value).replace("Z","+00:00")).astimezone(UTC)
    except (ValueError, TypeError): return None
def request_json(url, post=None, timeout=35):
    payload = urllib.parse.urlencode(post).encode() if post is not None else None
    req = urllib.request.Request(url, data=payload,
        headers={"User-Agent": USER_AGENT,"Accept":"application/json",
                 "Content-Type":"application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        if response.status != 200: raise ValueError("HTTP "+str(response.status))
        body = response.read(7_000_001)
        if len(body)>7_000_000: raise ValueError("Response size limit exceeded")
        return json.loads(body)
def clean_text(value):
    return re.sub(r"\s+"," ",html.unescape(re.sub(r"<[^>]*>","",str(value or "")))).strip()
def slug(value):
    return re.sub(r"[^a-z0-9]+","-",str(value or "").casefold()).strip("-")
def stable_id(record):
    return record.get("source_id") or slug(record.get("name"))
def bbox_contains(lat,lon,bbox):
    return bbox[0]<=lat<=bbox[2] and bbox[1]<=lon<=bbox[3]
def build_overpass_query(region,strategy,limit):
    key=strategy["key"]; val=strategy["value"]
    if not re.fullmatch("[a-z_:]+",key) or not re.fullmatch("[a-z_:]+",val):
        raise ValueError("Unsafe OSM tag")
    b=",".join(str(float(x)) for x in region["bbox"])
    return '[out:json][timeout:25][maxsize:5000000];nwr["%s"="%s"](%s);out center meta %d;'%(key,val,b,limit)
def normalize_osm(elements,region,strategy,observed_at):
    result=[]
    for x in elements:
        tags=x.get("tags") or {}
        position=x.get("center") or x
        lat=position.get("lat");lon=position.get("lon")
        if not isinstance(lat,(int,float)) or not isinstance(lon,(int,float)) or not bbox_contains(lat,lon,region["bbox"]):continue
        if not tags.get("name"):continue
        element_id=x.get("id");kind=x.get("type")
        if kind not in ("node","way","relation") or not isinstance(element_id,int):continue
        src="https://www.openstreetmap.org/%s/%s"%(kind,element_id)
        item={
          "source_id":"osm:%s:%s"%(kind,element_id),"name":tags["name"],
          "category":strategy["category"],"region":region["name"],
          "latitude":lat,"longitude":lon,"source_url":src,
          "source_type":"openstreetmap","source_freshness":x.get("timestamp"),
          "observed_at":observed_at,"opening_hours_raw":tags.get("opening_hours"),
          "website":tags.get("website") or tags.get("contact:website"),
          "wikidata":tags.get("wikidata"),"wikimedia_commons":tags.get("wikimedia_commons"),
          "access":tags.get("access"),"seasonal":tags.get("seasonal"),
          "availability_on_travel_date":"unknown",
          "price":None,"photo_approved":False,"publishable":False
        }
        result.append(item)
    return result
def select_strategies(strategies,learned,iteration,maximum=3):
    """Always explore: exploit highest scored, rotate other tags deterministically."""
    if len(strategies)<=maximum:return strategies[:]
    scores=learned.get("strategy_stats",{})
    ranked=sorted(strategies,key=lambda x:(-scores.get(x["id"],{}).get("score",0),x["id"]))
    selection=[ranked[0]]
    rotation=[x for x in strategies if x["id"]!=selection[0]["id"]]
    for offset in range(len(rotation)):
        s=rotation[(iteration*2+offset)%len(rotation)]
        if s not in selection:selection.append(s)
        if len(selection)>=maximum:break
    return selection
def compute_quality(records):
    if not records:return {"records":0,"coordinates_rate":0,"category_rate":0,"schedule_rate":0,"last_source_update":None,"score":0}
    coords=sum(isinstance(x.get("latitude"),(int,float)) and isinstance(x.get("longitude"),(int,float)) for x in records)/len(records)
    category=sum(bool(x.get("category")) for x in records)/len(records)
    schedule=sum(bool(x.get("opening_hours_raw") or x.get("start_local")) for x in records)/len(records)
    updated=[parse_date(x.get("source_freshness")) for x in records]
    updated=[x for x in updated if x]
    recent=sum(x>=dt.datetime.now(UTC)-dt.timedelta(days=90) for x in updated)/len(records)
    score=round(5*(.25*min(len(records)/15,1)+.25*coords+.20*category+.20*schedule+.10*recent),3)
    return {"records":len(records),"coordinates_rate":round(coords,3),"category_rate":round(category,3),
            "schedule_rate":round(schedule,3),"last_source_update":max(updated).isoformat() if updated else None,"score":score}
def update_learning(learning,strategy,quality,success):
    prev=learning.setdefault("strategy_stats",{}).setdefault(strategy,{"runs":0,"successes":0,"score":0})
    n=prev["runs"]+1
    prev["score"]=round((prev["score"]*(n-1)+(quality["score"] if success else 0))/n,3)
    prev["runs"]=n;prev["successes"]+=int(success)
    prev["last_results"]=quality
def commons_candidates(name,region,limit=4):
    # Wikimedia Commons API returns suggestions. License tags and exact-place match need review.
    params={"action":"query","format":"json","generator":"search",
            "gsrnamespace":"6","gsrsearch":name+" "+region["name"],
            "gsrlimit":str(limit),"prop":"imageinfo","iiprop":"url|extmetadata|timestamp"}
    url="https://commons.wikimedia.org/w/api.php?"+urllib.parse.urlencode(params)
    payload=request_json(url)
    result=[]
    for page in (payload.get("query",{}).get("pages",{}) or {}).values():
        file=(page.get("imageinfo") or [{}])[0]
        m=file.get("extmetadata") or {}
        field=lambda key:clean_text((m.get(key) or {}).get("value"))
        license_name=field("LicenseShortName");license_url=field("LicenseUrl")
        artist=field("Artist")
        if not license_name or not artist:continue
        title=page.get("title")
        if not title:continue
        result.append({"file":title,"file_page":"https://commons.wikimedia.org/wiki/"+urllib.parse.quote(title.replace(" ","_"),safe=":/()"),
                       "file_url":file.get("url"),"creator":artist,"license":license_name,
                       "license_url":license_url,"upload_timestamp":file.get("timestamp"),
                       "match_status":"manual_review_required","photo_approved":False})
    return result
def fetch_nyc_events(cfg,now):
    source=cfg["official_event_feeds"]["nyc_parks"]
    if not source["enabled"]:return []
    url=source["url"]+"?"+urllib.parse.urlencode({"$limit":str(source["max_records"])})
    records=request_json(url)
    if not isinstance(records,list):raise ValueError("NYC feed not a record list")
    output=[]
    for x in records:
        name=x.get("eventname") or x.get("event_name") or x.get("title")
        start=x.get("startdate") or x.get("start_date")
        end=x.get("enddate") or x.get("end_date")
        place=x.get("parkname") or x.get("park_name")
        if not name or not start:continue
        output.append({"name":str(name),"venue":place,"park_id":x.get("parkids") or x.get("park_id"),
          "start_local":str(start),"end_local":str(end) if end else None,
          "source_url":source["dataset_url"],"source_type":"nyc_parks_official_dataset",
          "source_freshness":None,"observed_at":now,"availability_on_travel_date":"date_unverified",
          "photo_approved":False,"publishable":False})
    return output
def suggested_search_queries(region,strategies,learned):
    """Generate official-source search proposals; never scrape unrestricted sites."""
    terms = {"beach":"public beaches","walk":"walking routes","nature":"nature trails","culture":"cultural events","food":"local markets","shopping":"craft markets","wellness":"community wellness","nightlife":"local music events","water":"water activities"}
    prefixes = [region["name"]] + region.get("local_terms",[])
    scores = learned.get("strategy_stats",{})
    ranked = sorted(strategies,key=lambda x:-scores.get(x["id"],{}).get("score",0))
    return [{"query":prefix+" "+terms[x["category"]]+" official schedule","category":x["category"],"strategy":x["id"],"status":"query_proposal_not_executed","access":"official_or_open_data_only"} for x in ranked for prefix in prefixes[:3]][:18]

def run_region(region_key,config,previous=None,learning=None,offline=False,fetch=request_json,lookup=commons_candidates):
    region=config["regions"][region_key];policy=config["policy"];now=iso_now()
    previous=previous if isinstance(previous,dict) else {}
    learning=learning if isinstance(learning,dict) else {"iteration":0,"strategy_stats":{}}
    iteration=int(learning.get("iteration",0))
    strategies=select_strategies(config["strategies"],learning,iteration,policy["max_queries_per_region_per_week"])
    existing={x["source_id"]:x for x in previous.get("places",[]) if x.get("source_id")}
    failures=[];executed=[]
    for strategy in strategies:
        query=build_overpass_query(region,strategy,policy["max_records_per_query"])
        try:
            if offline: raise RuntimeError("offline mode: source collection skipped")
            source=fetch(policy["overpass_endpoint"],{"data":query})
            fresh=normalize_osm(source.get("elements",[]),region,strategy,now)
            for item in fresh:
                old=existing.get(item["source_id"])
                if old and old.get("photo_candidates"):item["photo_candidates"]=old["photo_candidates"]
                existing[item["source_id"]]=item
            quality=compute_quality(fresh)
            update_learning(learning,strategy["id"],quality,True)
            executed.append({"strategy":strategy["id"],"count":len(fresh),"metrics":quality,"state":"ok"})
        except Exception as exc:
            failures.append({"strategy":strategy["id"],"reason":str(exc)[:300]})
            update_learning(learning,strategy["id"],compute_quality([]),False)
        time.sleep(0 if offline else policy["request_delay_seconds"])
    learning["iteration"]=iteration+1
    query_proposals=suggested_search_queries(region,config["strategies"],learning)
    places=list(existing.values())
    places.sort(key=lambda x:x["source_id"])
    for item in places[:policy["max_image_lookups_per_region"]]:
        if item.get("photo_candidates"):continue
        try:
            if offline:break
            item["photo_candidates"]=lookup(item["name"],region)
        except Exception as exc:
            failures.append({"photo_for":item["source_id"],"reason":str(exc)[:300]})
        time.sleep(0 if offline else policy["request_delay_seconds"])
    events=list(previous.get("events",[]))
    if region_key=="nyc" and not offline:
        try:events=fetch_nyc_events(config,now)
        except Exception as exc:failures.append({"feed":"nyc_parks","reason":str(exc)[:300]})
    # Never infer an OSM record's open status from a current fetch.
    counts=Counter(p["category"] for p in places)
    result={"schemaVersion":"0.1","region":region_key,"collected_at":now,
            "source":"OpenStreetMap via Overpass + region-allowed official feeds",
            "state":"partial" if failures else "complete","places":places,"events":events,
            "coverage_by_category":dict(counts),"collection_attempts":executed,
            "query_proposals":query_proposals,
            "errors":failures,"quality":compute_quality(places),
            "publication_status":"review_only"}
    return result,learning
def main():
    p=argparse.ArgumentParser()
    p.add_argument("--region",required=True,choices=["ibiza","lisbon","sint_maarten","nyc"])
    p.add_argument("--out",required=True)
    p.add_argument("--learning-out",required=True)
    p.add_argument("--offline",action="store_true")
    args=p.parse_args()
    cfg=json.loads((ROOT/"discovery/config.json").read_text())
    def read(path,default):
        try:return json.loads(path.read_text())
        except (FileNotFoundError,ValueError):return default
    previous=read(ROOT/"data/research"/(args.region+".json"),{})
    learning=read(ROOT/"data/research"/(args.region+"-learning.json"),{})
    output,learned=run_region(args.region,cfg,previous,learning,args.offline)
    for filename,data in [(args.out,output),(args.learning_out,learned)]:
        dest=pathlib.Path(filename);dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_text(json.dumps(data,ensure_ascii=False,indent=2,sort_keys=True)+"\n")
    print(json.dumps({"region":args.region,"places":len(output["places"]),
      "events":len(output["events"]),"errors":len(output["errors"]),"strategies":len(output["collection_attempts"]),
      "score":output["quality"]["score"]}))
    # Fail the job if every primary collector failed, so CI cannot silently call it a successful refresh.
    if not output["collection_attempts"] and not args.offline:sys.exit(1)
if __name__=="__main__": main()
