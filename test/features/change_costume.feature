Feature: Testcase 2

Scenario: change costume

   Given loaded project #30873380
    When using Bat2
     And switch costume to bat2-b
    Then costume bat2-b of sprite Bat2 is visible
