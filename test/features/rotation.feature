Feature: Testcase 1

Scenario: rotation

   Given loaded project #33037118
    When green flag clicked
     And turn right 90 degrees
    Then rotation of costume costume1 of sprite Sprite1 is 90
