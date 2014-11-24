Feature: Testcase 7

Scenario: change size

   Given loaded project #32463768
    When using Sprite1
     And when green flag clicked
     And change size by 50
    Then costume costume1 of sprite Sprite1 has size width:95 height:111
