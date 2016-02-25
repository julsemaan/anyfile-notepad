#!/bin/bash
# Creates a macro script for xmacro
# To execute : 
# cat tmp/drive_inject | xmacroplay $DISPLAY

echo "Delay 3 # Always add this!!" > script/drive_inject

while read p; do
  echo "String $p" >> script/drive_inject
  echo "KeyStrPress Return" >> script/drive_inject
  echo "KeyStrRelease Return" >> script/drive_inject
done < $1
