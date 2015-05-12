Feature: keypress

Scenario: change Costume of Sprite when key a is pressed

   Given loaded project #61435944
    When using Sprite1
     And when green flag clicked
     And user presses a
     And when a key pressed
    Then costume costume2 of sprite Sprite1 is visible
