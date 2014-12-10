Feature: Clicking

Scenario: show sprite (costume) when green flag clicked

   Given loaded project #35908130
    When using Cat
     And when green flag clicked
     And switch costume to costume1
     And user points to sprite Cat
     And user clicks mousebutton
     And when this sprite clicked
     And switch costume to costume2
    Then costume costume2 of sprite Cat is visible
