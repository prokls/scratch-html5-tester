Feature: Clicking

Scenario: change Costume of Sprite when Sprite clicked

   Given loaded project #60497322
    When using Sprite1
     And when green flag clicked
     And user points to sprite Sprite1
     And user clicks mousebutton
     And when this sprite clicked
     And switch costume to costume2
     And make screenshot 'click'
    Then costume costume2 of sprite Sprite1 is visible
