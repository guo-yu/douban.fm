#!/bin/sh

script=`dirname $0`
node $script/cli $1 $2 2>./err.log