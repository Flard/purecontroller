PureController
==============

Running
-------
Make sure the Arduino is connected to your network. Next, point your browser to:
http://192.168.1.40/

Prepare for iPad
----------------
* Create a file index-compiled.html
* Compile css and replace `<link>` in `<head>` with `<style>...</style>`
* Compile js and replace `<script>` in `<head>` with compiled source


Prepare for Arduino
-------------------
Replace the default Arduino library:
`hardware\arduino\avr\cores\arduino\HardwareSerial.cpp`
(aanmaken van interrupts voor Serial port 1 & 2 eruit; ivm dat deze door dmx lib gebruikt worden)

Replace in DMX-library:
dmx_lib.h
(remove UART0 and UART3 defines)