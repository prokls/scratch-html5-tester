Feature: Testcase 1

Scenario: rotation

   Given loaded project #33037118
    When when green flag clicked
     And turn right 90 degrees
    Then costume costume1 of sprite Sprite1 is rotated by 90 degrees
