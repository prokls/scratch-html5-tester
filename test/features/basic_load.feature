Feature: 100 Green Bottles

Scenario: Should fall from the wall

   Given loaded project #30552428
    When green flag clicked
     And show
    Then costume bat2-a of sprite Bat2 is visible
