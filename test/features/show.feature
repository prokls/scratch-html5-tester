Feature: Check whether costume/sprite is visible after "show" block occured.

  Scenario: show costume of sprite when green flag clicked
      Given loaded project #30552428
       When using Bat2
        And when green flag clicked
        And show
       Then costume bat2-a of sprite Bat2 is visible

  Scenario: any custome of sprite is visible when green flag clicked
      Given loaded project #30552428
       When using Bat2
        And when green flag clicked
        And show
       Then sprite Bat2 is visible

  Scenario: one custome covers the other costume if it is larger and shown after the first one
      Given loaded project #56198296
       When using Sun
        And when green flag clicked
        And show
       Then sprite Sun is visible
        And sprite Sprite1 is hidden

  #Scenario: shown elements will still be shown after a "show" block
  #Scenario: hidden elements will be shown after a "show" block
  #    Given loaded project #000000
  #     When using

