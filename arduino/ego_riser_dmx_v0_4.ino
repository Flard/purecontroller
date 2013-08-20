#include <WebServer.h>

#include "SPI.h"
#include "SD.h"
#include "Ethernet.h"

#include <lib_dmx.h>

// Debug naar serieele poort op 57600 baud
#define DEBUG

byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress ip(192,168,1,40); // IP adres

//******************************
// Defines voor DMX
//******************************
// DMX defines
#define    DMX512     (0)    // (250 kbaud - 2 to 512 channels) Standard USITT DMX-512
#define    DMX1024    (1)    // (500 kbaud - 2 to 1024 channels) Completely non standard - TESTED ok
#define    DMX2048    (2)    // (1000 kbaud - 2 to 2048 channels) called by manufacturers DMX1000K, DMX 4x or DMX 1M ???

#define    EGO_RISER_MAX_DMX (52) // maximaal aantal kanalen gebruikt door een ego-riser

// input pinnen voor dmx offset adres
#define    ADDR_SWITCH_1   (31)
#define    ADDR_SWITCH_2   (33)
#define    ADDR_SWITCH_4   (35)
#define    ADDR_SWITCH_8   (37)
#define    ADDR_SWITCH_16  (39)
#define    ADDR_SWITCH_32  (41)
#define    ADDR_SWITCH_64  (43)
#define    ADDR_SWITCH_128 (45)
#define    ADDR_SWITCH_256 (47)

int dmx_offset_value = 0;

/***********************************
 * Defines voor Webserver
 ***********************************/
#define PREFIX ""
WebServer webserver(PREFIX, 80);

// no-cost stream operator as described at 
// http://sundial.org/arduino/?page_id=119
template<class T>
inline Print &operator <<(Print &obj, T arg)
{ obj.print(arg); return obj; }

void showDefaultPageCmd(WebServer &server, WebServer::ConnectionType type, char *url_tail, bool tail_complete)
{
  File myFile = SD.open("index.htm", FILE_READ);        // open file
  if(myFile){
    server.println("HTTP/1.1 200 OK");
    server.println("Content-Type: text/html");
    server.println();
    server.println();
    int16_t c;
    while ((c = myFile.read()) >= 0) {
      server.print((char)c);
    }
    myFile.close();
  }
  else
  {
    server.println("HTTP/1.1 404 Not Found");
    server.println();
    server.println();
  }
}

void setDmxCmd(WebServer &server, WebServer::ConnectionType type, char *url_tail, bool tail_complete)
{
  if (type != WebServer::POST)
  {
    server.httpFail();
    return;
  }

  //server.httpSuccess(false, "application/json");
  server.httpSuccess("application/json");
  
  bool repeat;
    char name[16], value[16];
    do
    {
      repeat = server.readPOSTparam(name, 16, value, 16);
      int ch = strtoul(name, NULL, 10);
      int val = strtoul(value, NULL, 10);
      
      // controleer kanaal en waarde op grensen, dan doorzetten naar buitenwereld
      if ((ch >= 1) & (ch <=512) & (val >= 0) & (val <= 255)){
        // kaneel / waarde doortikken naar Dmx sendbuffer
        ArduinoDmx2.TxBuffer[ch - 1] = val;
        
  #ifdef DEBUG 
        Serial.print(ch);
        Serial.print(" => ");
        Serial.println(value);
  #endif
      };

    } while (repeat);
    
    server << "{\"success\": true}";
}

void setOffsetCmd(WebServer &server, WebServer::ConnectionType type, char *url_tail, bool tail_complete) 
{
  if (type == WebServer::POST) {
     
    server.httpSuccess("application/json");
  
    bool repeat;
    char name[16], value[16];
    do
    {
      repeat = server.readPOSTparam(name, 16, value, 16);

      Serial.println(name);
      
      if (strcmp(name, "offset") == 0)
        dmx_offset_value = strtoul(value, NULL, 10);
#ifdef DEBUG 
        Serial.print("new offset => ");
        Serial.println(dmx_offset_value);
#endif
      }      
        
    } while (repeat);
    server << "{\"success\": true, \"offset\": " << dmx_offset_value << "}";
    
  } else {
    
    // Gewoon de huidige offset teruggeven
    server.httpSuccess("application/json");
    server << "{\"offset\": " << dmx_offset_value << "}";
    
  }
}

void pingCmd(WebServer &server, WebServer::ConnectionType type, char *url_tail, bool tail_complete) {
  server.httpSuccess("application/json");
  server << "{\"result\": \"pong\"}";
}

void doDmx() {
  if(dmx_offset_value == 0)
         {
           digitalWrite(13, HIGH);
           //geen adres gezet ==> ga nu vanaf ethernet port naar dmx out sturen (via call vanaf websocket).
         }
         else
         {
         digitalWrite(13, LOW);
         // we gaan dmx-offset doen en doortikken naar de dmx out      
//          dmx_offset_value = (int(digitalRead(ADDR_SWITCH_1)==LOW) * 1) + 
//                             (int(digitalRead(ADDR_SWITCH_2)==LOW) * 2) +  
//                             (int(digitalRead(ADDR_SWITCH_4)==LOW) * 4) +  
//                             (int(digitalRead(ADDR_SWITCH_8)==LOW) * 8) +  
//                             (int(digitalRead(ADDR_SWITCH_16)==LOW) * 16) +  
//                             (int(digitalRead(ADDR_SWITCH_32)==LOW) * 32) +  
//                             (int(digitalRead(ADDR_SWITCH_64)==LOW) * 64) +  
//                             (int(digitalRead(ADDR_SWITCH_128)==LOW) * 128) +  
//                             (int(digitalRead(ADDR_SWITCH_256)==LOW) * 256) - 1;
           // tik 52 ontvangen dmx kanalen memory door naar output dmx geheugen incl. offset                  
           for(int i=0;i<EGO_RISER_MAX_DMX;i++)  //buffers 0 indexed (0-511)
            {
                ArduinoDmx2.TxBuffer[i] = ArduinoDmx1.RxBuffer[i+dmx_offset_value];
            }
         }    
}

void setup() {
  #ifdef DEBUG  
    Serial.begin(57600);
  #endif    

// init SD card
    Serial.println("Initializing SD card...");
    if (!SD.begin(4)) {
      #ifdef DEBUG 
        Serial.println("ERROR - SD card initialization failed!");
      #endif
        return;    // init failed
    }
    
    #ifdef DEBUG 
      Serial.println("SUCCESS - SD card initialized.");
    #endif
    
    // hebben we een index.htm file?
    if (!SD.exists("index.htm")) {
      #ifdef DEBUG 
        Serial.println("ERROR - Can't find index.htm file!");
      #endif
      return;  // zonder index stopt de wereld
    }
    #ifdef DEBUG 
    Serial.println("SUCCESS - Found index.htm file.");
    #endif
    
  Ethernet.begin(mac, ip);
  webserver.begin();
  webserver.addCommand("set", &setDmxCmd);
  webserver.addCommand("offset", &setOffsetCmd);
  webserver.addCommand("ping", &pingCmd);  
  webserver.setDefaultCommand(&showDefaultPageCmd);

  #ifdef DEBUG 
    Serial.println("Ready and waiting...");
  #endif

  delay(100); // Ethernet even wat adem geven   
  
  // INIT DMX library
  ArduinoDmx1.set_control_pin(24);   // Arduino selectie pin for MAX485 input/output schakelen
  ArduinoDmx2.set_control_pin(26);   // Arduino selectie pin for MAX485 input/output schakelen
  
  ArduinoDmx1.set_rx_address(1);    // zet rx start adres
  ArduinoDmx2.set_tx_address(1);    // zet tx start adres
  
  ArduinoDmx1.set_rx_channels(512);
  ArduinoDmx2.set_tx_channels(512);
  
  // New parameter needed: DMX Mode
  ArduinoDmx1.init_rx(DMX512);    // start universe 1 als rx, standard DMX 512
  ArduinoDmx2.init_tx(DMX512);    // start universe 2 als tx, standard DMX 512
  
  // ledje op board
  pinMode(13, OUTPUT);
  
  // dmx offset adress inputs activeren
  pinMode(ADDR_SWITCH_1, INPUT);
  pinMode(ADDR_SWITCH_2, INPUT);
  pinMode(ADDR_SWITCH_4, INPUT);
  pinMode(ADDR_SWITCH_8, INPUT);
  pinMode(ADDR_SWITCH_16, INPUT);
  pinMode(ADDR_SWITCH_32, INPUT);
  pinMode(ADDR_SWITCH_64, INPUT);
  pinMode(ADDR_SWITCH_128, INPUT);
  pinMode(ADDR_SWITCH_256, INPUT);
  
  // zet interne pull-up weerstand aan voor de inputs
  digitalWrite(ADDR_SWITCH_1, HIGH);
  digitalWrite(ADDR_SWITCH_2, HIGH);
  digitalWrite(ADDR_SWITCH_4, HIGH);
  digitalWrite(ADDR_SWITCH_8, HIGH);
  digitalWrite(ADDR_SWITCH_16, HIGH);
  digitalWrite(ADDR_SWITCH_32, HIGH);
  digitalWrite(ADDR_SWITCH_64, HIGH);
  digitalWrite(ADDR_SWITCH_128, HIGH);
  digitalWrite(ADDR_SWITCH_256, HIGH);  

}

void loop() 
{  
  // process incoming connections one at a time forever
  webserver.processConnection();
  
  // Do some DMX stuff
  doDmx();
}
  
