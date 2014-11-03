Feature: Testcase 7

Scenario: change size

   Given loaded project #31998154
    When green flag clicked
     When change size by 50
    Then size of costume costume1 of sprite Sprite1 is width:140 height:200
