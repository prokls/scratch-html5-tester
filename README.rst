Scratch-html5-tester
====================

:project:       scratch-html5-tester
:date:          July, Aug 2014
:contributors:  Lukas Prokop, Andreas Schulhofer, Richard Schumi

Install
~~~~~~~

1. Download this repository::

    git clone https://github.com/prokls/scratch-html5-tester.git

2. Download scratch-html5 into `lib/`::

    mkdir scratch-html5-tester/lib
    git clone http://github.com/LLK/scratch-html5.git scratch-html5-tester/lib/scratch-html5

3. Run tests using::

    mocha --reporter spec --timeout 20000 testsuite.js

Cheers!
