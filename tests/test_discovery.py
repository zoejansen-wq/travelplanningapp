import datetime as dt
import json
import pathlib
import unittest
import sys
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/"scripts"))
import discover

ROOT=pathlib.Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/"discovery/config.json").read_text())
class DiscoveryTests(unittest.TestCase):
    def test_scope(self):
        self.assertEqual(set(CONFIG["regions"]),{"ibiza","lisbon","sint_maarten","nyc"})
        self.assertLessEqual(CONFIG["policy"]["max_queries_per_region_per_week"],3)
    def test_safe_queries(self):
        q=discover.build_overpass_query(CONFIG["regions"]["lisbon"],CONFIG["strategies"][0],90)
        self.assertIn('natural"="beach',q)
        self.assertIn('out center meta 90',q)
        with self.assertRaises(ValueError):
            discover.build_overpass_query(CONFIG["regions"]["lisbon"],{"key":"bad;drop","value":"beach"},90)
    def test_normalization_and_availability_unknown(self):
        sample=[{"type":"node","id":1,"lat":38.72,"lon":-9.14,"timestamp":"2026-10-21T12:00:00Z",
                 "tags":{"name":"Public viewpoint","opening_hours":"Mo-Fr 10:00-18:00"}}]
        rows=discover.normalize_osm(sample,CONFIG["regions"]["lisbon"],CONFIG["strategies"][1],"2026-10-26T00:00:00Z")
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]["availability_on_travel_date"],"unknown")
        self.assertFalse(rows[0]["publishable"])
    def test_learning_explores(self):
        strategies=CONFIG["strategies"]
        learned={"strategy_stats":{strategies[0]["id"]:{"score":5}}}
        choices={x["id"] for n in range(6) for x in discover.select_strategies(strategies,learned,n)}
        self.assertGreaterEqual(len(choices),7)
    def test_mocked_run(self):
        example={"elements":[{"type":"node","id":123,"lat":38.72,"lon":-9.14,
          "timestamp":"2026-10-20T00:00:00Z","tags":{"name":"Test venue"}}]}
        def fake(url,post=None):return example
        result,learned=discover.run_region("lisbon",CONFIG,{}, {},False,fetch=fake,lookup=lambda n,r:[])
        self.assertEqual(result["publication_status"],"review_only")
        self.assertEqual(len(result["places"]),1)
        self.assertEqual(len(result["collection_attempts"]),3)
        self.assertEqual(len(result["query_proposals"]),18)
        self.assertEqual(learned["iteration"],1)
        self.assertFalse(result["places"][0]["photo_approved"])
    def test_quality_empty(self):
        self.assertEqual(discover.compute_quality([])["score"],0)
if __name__=="__main__": unittest.main()
