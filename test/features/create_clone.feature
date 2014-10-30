Feature: Testcase 5

Scenario: create clone and change costume

   Given loaded project #31378606
    When I start as a clone
    When switch costume to bat1-a
    Then costume bat1-a of sprite Bat2 is visible
