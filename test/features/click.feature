Feature: Clicking

Scenario: change Costume of Sprite when Sprite clicked

   Given loaded project #58744126
    When using Sprite1
     And when green flag clicked
     And user points to sprite Sprite1
     And user clicks mousebutton
     And when this sprite clicked
     And switch costume1 to costume2
    Then costume costume2 of sprite Sprite1 is visible
