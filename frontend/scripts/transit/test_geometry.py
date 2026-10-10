import unittest
from network_geometry import section, matches, select_rule, active

def way(id, coordinates, **tags):
    return {'type':'Feature','properties':{'osmId':id,'name':'Test Line','operator':'Test Railway','railway':'rail',**tags},'geometry':{'type':'LineString','coordinates':coordinates}}

class GeometryTests(unittest.TestCase):
    def test_verified_branch_projection_joins_source_tracks_without_emitting_a_bridge(self):
        tracks=[way(14,[[139,35],[139.03,35]]),way(15,[[139.015,35.005],[139.015,35.00005]])]
        stops=[{'tags':{'name':'A'},'at':[139,35]},{'tags':{'name':'B'},'at':[139.015,35.005]}]
        with self.assertRaisesRegex(ValueError,'不連通'):
            section(tracks,stops,'A','B')
        selected=section(tracks,stops,'A','B',projected_join_meters=12)
        self.assertEqual({f['properties']['osmId'] for f in selected},{14,15})
        for feature in selected:
            self.assertTrue(all(abs(y-35)<1e-8 if feature['properties']['osmId']==14 else abs(x-139.015)<1e-8 for x,y in feature['geometry']['coordinates']))
        tracks[1]['geometry']['coordinates'][-1]=[139.015,35.0005]
        with self.assertRaisesRegex(ValueError,'不連通'):
            section(tracks,stops,'A','B',projected_join_meters=12)

    def test_only_explicit_passenger_loops_survive_the_siding_filter(self):
        self.assertTrue(active({'service':'siding','passenger_lines':'1','railway':'rail'}))
        self.assertFalse(active({'service':'siding','railway':'rail'}))
        self.assertFalse(active({'service':'yard','passenger_lines':'1','railway':'rail'}))
        self.assertFalse(active({'service':'siding','passenger_lines':'1','usage':'freight'}))

    def test_station_anchor_handles_parallel_platforms_without_drawing_a_connector(self):
        tracks=[way(11,[[139,35],[139.03,35]]),way(12,[[139.009,35.0001],[139.011,35.0001]])]
        stops=[{'tags':{'name':'A'},'at':[139,35]},{'tags':{'name':'B'},'at':[139.01,35.0001]}]
        selected=section(tracks,stops,'A','B')
        self.assertIn(11,[f['properties']['osmId'] for f in selected])
        for feature in selected:
            self.assertTrue(all(abs(y-(35 if feature['properties']['osmId']==11 else 35.0001))<1e-8 for x,y in feature['geometry']['coordinates']))
        distant=[tracks[0],way(13,[[139.009,35.002],[139.011,35.002]])]
        stops[1]['at']=[139.01,35.002]
        with self.assertRaisesRegex(ValueError,'不連通'):
            section(distant,stops,'A','B')

    def test_disconnected_source_tracks_never_get_a_straight_line(self):
        tracks=[way(1,[[139,35],[139.01,35]]),way(2,[[139.02,35],[139.03,35]])]
        stops=[{'tags':{'name':'A'},'at':[139,35]},{'tags':{'name':'B'},'at':[139.03,35]}]
        with self.assertRaisesRegex(ValueError,'不連通'):
            section(tracks,stops,'A','B')

    def test_manual_endpoint_must_be_near_the_actual_route(self):
        tracks=[way(1,[[139,35],[139.01,35]])]
        with self.assertRaisesRegex(ValueError,'不在指定路線'):
            section(tracks,[],{'name':'outside','at':[140,35]},{'name':'on track','at':[139.01,35]})

    def test_raw_operator_and_alias_survive_display_name_translation(self):
        track=way(3,[[139,35],[139.01,35]],name='JR Hohi Line',rawName='JR豊肥線',rawOperator='九州旅客鉄道',operator='JR Kyushu')
        self.assertTrue(matches(track,{'name':'豊肥本線','operator':'九州旅客鉄道'}))
        self.assertFalse(matches(track,{'name':'山陽新幹線'}))

    def test_operator_line_spacing_does_not_drop_the_official_corridor(self):
        track=way(4,[[139,35],[139.01,35]],name='南海 高野線')
        self.assertTrue(matches(track,{'name':'南海高野線'}))

    def test_jr_corporate_abbreviation_preserves_operator_boundaries(self):
        track=way(5,[[133.8,34.4],[133.8,34.5]],operator='JR四国',name='JR本四備讃線')
        self.assertTrue(matches(track,{'operator':'四国旅客鉄道'}))
        self.assertFalse(matches(track,{'operator':'西日本旅客鉄道'}))
        private=way(6,[[139,35],[139.01,35]],operator='西日本鉄道',name='天神大牟田線')
        self.assertFalse(matches(private,{'operator':'西日本旅客鉄道'}))

    def test_takayama_main_line_alias_does_not_drop_the_older_name(self):
        track=way(7,[[137,35],[137.01,35]],name='JR高山線',operator='東海旅客鉄道')
        self.assertTrue(matches(track,{'name':'高山本線','operator':'旅客鉄道'}))

    def test_named_tunnel_keeps_source_coordinates_and_same_operator(self):
        a=way(8,[[121,25],[121.01,25]],name='縱貫線',rawName='縱貫線')
        tunnel=way(9,[[121.01,25],[121.015,25.001],[121.02,25]],name='竹子嶺隧道',rawName='竹子嶺隧道')
        b=way(10,[[121.02,25],[121.03,25]],name='縱貫線',rawName='縱貫線')
        stops=[{'tags':{'name':'A'},'at':[121,25]},{'tags':{'name':'B'},'at':[121.03,25]}]
        rule={'sections':[{'selector':{'name':'縱貫線','operator':'Test Railway','railway':'rail'},'from':'A','to':'B'}]}
        selected,issues=select_rule(rule,[a,tunnel,b],stops)
        self.assertEqual(issues,[])
        self.assertIn(9,[f['properties']['osmId'] for f in selected])
        tunnel['properties']['operator']='Other Railway'
        # Keep each network immutable while cached section paths refer to it.
        selected,issues=select_rule(rule,[a,dict(tunnel,properties=dict(tunnel['properties'])),b],stops)
        self.assertEqual(selected,[])
        self.assertTrue(any('不連通' in issue for issue in issues))

if __name__=='__main__':unittest.main()
