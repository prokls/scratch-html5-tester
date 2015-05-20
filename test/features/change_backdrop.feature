Feature: Testcase 6

Scenario: change backdrop

   Given loaded project #31379248
    When switch backdrop to bedroom1
    Then backdrop bedroom1 is visible

Scenario: change backdrop when sprite clicked
   Given loaded project #63037300
    When using Sprite1
     And when green flag clicked
     And user points to sprite Sprite1
     And user clicks mousebutton
     And switch backdrop to Backdrop3
    Then backdrop Backdrop3 is visible
     And backdrop Backdrop2 is hidden
     And backdrop Backdrop1 is hidden

Scenario: Backdrop2 is hidden after sprite clicked
   Given loaded project #63037300
    When using Sprite1
     And when green flag clicked
     And user points to sprite Sprite1
     And user clicks mousebutton
     And switch backdrop to Backdrop3
    Then backdrop Backdrop3 is hidden
