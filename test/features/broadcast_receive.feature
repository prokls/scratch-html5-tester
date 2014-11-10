Feature: Testcase 3 

Scenario: receive broadcast and show

   Given loaded project #30887308
    When broadcast "TestBroadcast"
    When when I receive "TestBroadcast"
     And show
    Then costume butterfly3 of sprite Butterfly3 is visible
