Feature: Testcase 3 

Scenario: receive broadcast and show

   Given loaded project #30887308
    When using Bat2
     And broadcast "TestBroadcast"
    When using Butterfly3
     And when I receive "TestBroadcast"
     And show
    Then costume butterfly3 of sprite Butterfly3 is visible
