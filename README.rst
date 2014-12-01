Scratch-html5-tester
====================

:project:       scratch-html5-tester
:date:          July, Aug 2014
:contributors:  Lukas Prokop, Andreas Schulhofer, Richard Schumi, Marc Schober, Christof Rabensteiner

Download resources locally
~~~~~~~~~~~~~~~~~~~~~~~~~~

You can also download resources locally such that an internet connection must not be established while running the testsuite.
Download resources of one particular project by using its project ID like::

   node fetchproject.js 10000160

Install
~~~~~~~

1. Download this repository::

    git clone https://github.com/prokls/scratch-html5-tester.git

2. Download scratch-html5 into `lib/`::

    git clone http://github.com/LLK/scratch-html5.git scratch-html5-tester/lib/scratch-html5

3. Install dependencies::

    cd scratch-html5-tester.git && npm install

4. Run tests using::

    mocha --reporter spec --timeout 20000 testsuite.js

Cheers!
