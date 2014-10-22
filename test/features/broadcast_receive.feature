Feature: Testcase 3 

Scenario: Broadcast receive and show

   Given loaded project #30887308
    When broadcast "TestBroadcast"
    When I receive "TestBroadcast"
     And show
    Then costume butterfly3 of sprite Butterfly3 is visible
