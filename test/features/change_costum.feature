Feature: 100 Green Bottles

Scenario: change costume

   Given loaded project #30873380
    When switch costume to bat2-b
    Then costume bat2-b of sprite Bat2 is visible
