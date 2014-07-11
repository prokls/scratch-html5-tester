Feature: 100 Green Bottles

Scenario: Should fall from the wall

   Given loaded project #42
   When 1 green bottle accidentally falls
   Then there are 99 green bottles standing on the wall
