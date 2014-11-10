Feature: Testcase 4

Scenario: next costume

   Given loaded project #31378250
    When next costume
    When next costume
    When next costume
    Then costume bat1-b of sprite Bat2 is visible
