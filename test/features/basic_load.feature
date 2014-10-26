Feature: Testcase 1

Scenario: show sprite (costum) when green flag clicked

   Given loaded project #30552428
    When green flag clicked
     And show
    Then costume bat2-a of sprite Bat2 is visible
