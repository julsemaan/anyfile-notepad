#!/bin/bash

echo "Delay 3 # Always add this!!" > script/drive_inject

while read p; do
  echo "String $p" >> script/drive_inject
  echo "KeyStrPress Return" >> script/drive_inject
  echo "KeyStrRelease Return" >> script/drive_inject
done < $1
