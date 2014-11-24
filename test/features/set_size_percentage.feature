Feature: Testcase 1

Scenario: set size

   Given loaded project #33027646
    When using Sprite1
     And when green flag clicked
     And set size to 150
    Then costume costume1 of sprite Sprite1 has size 150 percent
