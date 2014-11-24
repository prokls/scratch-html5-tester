Feature: Testcase 1

Scenario: show sprite (costume) when green flag clicked

   Given loaded project #35908130
    When using Cat
     And when green flag clicked
     And switch costume to costume1
    Then costume costume1 of sprite Cat is visible
