#!/bin/bash

while true; do
	$1
	inotifywait -e close_write `find . -name '*\.js'`
done
