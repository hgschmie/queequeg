# QUEEQUEG - A Singularity Web hook debugger

Receives Singularity webhook notifications and prints them on the console.

## Setup

```bash
make setup
```

## Usage

Check the environment variables at the top of the Makefile. Make sure that they match your Singularity installation.

* PORT - local port on which queequeg will listen (default: 3000).
* HOST - hostname that queequeg will use (default: localhost).
* SINGULARITY_PORT - port used for the singularity framework to register callbacks with (default: 7099).
* SINGULARITY_HOST - hostname used for the singularity framework to register callbacks with (default: localhost).
* SINGULARITY_BASE - location of the singularity API. This is usually '/singularity' but in some special cases it may be e.g. '/'.

Then start the server:

```bash
make server
```

## Legal blurb

(C) 2014 Henning Schmiedehausen

Licensed under the terms of the Apache Software License V2.





