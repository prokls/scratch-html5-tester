Feature: Testcase 1

Scenario: set variable and check value

   Given loaded project #33581850
    When when green flag clicked
     And set InfoMessage to 99
    Then variable InfoMessage is 99
