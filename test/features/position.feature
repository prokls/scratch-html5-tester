Feature: Testcase 9

Scenario: check position

   Given loaded project #30552428
    When using Bat2
     And when green flag clicked
     And show
    Then costume bat2-a of sprite Bat2 is at x:-40 y:-49

Scenario: check position after goto:x,y

   Given loaded project #63322554
    When using Sprite1
     And when green flag clicked
     And go to x:22 y:33
    Then costume Costume1 of sprite Sprite1 is at x:22 y:33
