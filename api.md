## Step 1

Create a login page which include 3 required input field, which are, dali iot pro controller ip, username, password and fire a post api on `http://<dali iot pro controller ip>/auth/login` with json body

```
{
    "username": "<username>",
    "password": "<password>"
}

```

once api response with status code 200, which mean login success and save a response data field on authHeader's value, this value will be a Authorization on header in rest of the api.

## Step 2

create a page that list all dali devices with GET ``http://<dali iot pro controller ip>/api/bmsapi/dali-devices``, below is the example response
```
{
  "deviceList": [
    {
      "guid": "e516322a-d7c1-4d2a-b0a4-5c9e9457cf1c",
      "type": "gear",
      "lightGroupId": 0,
      "title": "EVG A63",
      "port": 0,
      "shortAddress": 63,
      "staticProperties": [
        {
          "property": "oemGtin",
          "text": "1234"
        },
        {
          "property": "nominalInputPower",
          "value": 120,
          "unit": "W"
        },
        {
          "property": "colourRenderingIndex",
          "value": 89
        },
        {
          "property": "colourTemperature",
          "value": 3000,
          "unit": "K"
        },
        {
          "property": "luminaireIdentification",
          "text": "Test Leuchte33"
        },
        {
          "property": "ratedMedianUsefullLifeOfLuminaire",
          "value": 100000,
          "unit": "h"
        }
      ],
      "properties": [
        "lightLevel",
        "gearStatus",
        "lampFailure",
        "driverEnergyConsumption",
        "driverInputPower",
        "driverApparentEnergyConsumption",
        "driverInputApparentPower",
        "loadEnergyConsumption",
        "loadOutputPower",
        "driverOperationTime",
        "mainPowerUpCount",
        "driverInputVoltage",
        "inputFrequency",
        "powerFactor",
        "errorOverall",
        "errorOverallCount",
        "errorUndervoltage",
        "errorUndervoltageCount",
        "errorOvervoltage",
        "errorOvervoltageCount",
        "errorOutputPowerLimit",
        "errorOutputPowerLimitCount",
        "errorThermalDerating",
        "errorThermalDeratingCount",
        "errorThermalShutDown",
        "errorThermalShutDownCount",
        "driverTemperature",
        "outputCurrentPercent",
        "lampOnCountRelativ",
        "lampOnCount",
        "lampOperationTimeRelativ",
        "lampOperationTime",
        "outputVoltage",
        "outputCurrent",
        "errorLamp",
        "errorLampCount",
        "errorLampShortCircuit",
        "errorLampShortCircuitCount",
        "errorLampOpenCircuit",
        "errorLampOpenCircuitCount",
        "errorLampThermalDerating",
        "errorLampThermalDeratingCount",
        "errorLampThermalShutDown",
        "errorLampThermalShutDownCount",
        "lampTemperature",
        "ratedMedianUsefullLifeOfLuminaire",
        "ratedMedianUsefullLifeOfLuminaire",
        "ratedMedianUsefullLifeOfLuminaire"
      ]
    },
    {
      "guid": "72164943-5a77-4429-8ead-68dde5ba5430",
      "type": "gear",
      "lightGroupId": -1,
      "title": "Ballast A00",
      "port": 0,
      "shortAddress": 0,
      "zones": ["Zone 1"],
      "gtin": "4008321371560",
      "serial": "4294706693",
      "properties": ["lightLevel", "gearStatus", "lampFailure"]
    },
    {
      "guid": "72164943-5a77-4429-8ead-68dde5ba5430",
      "type": "gear",
      "lightGroupId": -1,
      "title": "Ballast A00",
      "port": 0,
      "shortAddress": 0,
      "zones": ["Zone 1"],
      "gtin": "4008321371560",
      "serial": "4294706693",
      "properties": ["lightLevel", "gearStatus", "lampFailure"]
    },
    {
      "guid": "6174ae79-b300-4bae-b23e-799d71e22fc4",
      "type": "gear",
      "lightGroupId": -1,
      "title": "Ballast A09",
      "port": 0,
      "shortAddress": 9,
      "zones": ["Zone 1", "Zone 2"],
      "gtin": "4008321371560",
      "serial": "4294772229",
      "properties": ["lightLevel", "gearStatus", "lampFailure"]
    },
    {
      "guid": "5b38bddb-2fe9-4301-b0c9-6a8a019b829b",
      "type": "gear",
      "lightGroupId": -1,
      "title": "Ballast A10",
      "port": 0,
      "shortAddress": 10,
      "gtin": "4008321371560",
      "serial": "4294837765",
      "properties": ["lightLevel", "gearStatus", "lampFailure"]
    }
  ]
}
```
- create a widow height scroll view for list of device.
- create a accordion item list group by zone

## Step 3
implement a pop up card after click each item from device list, and can retrieve data via GET``http://<dali iot pro controller ip>/api/bmsapi/dali-devices/{guid}``, example for devices
```
{
    "guid": "77a4bf85-56b0-460b-96c0-68e248cec0cd",
    "type": "gear",
    "groupId": 0,
    "title": "Ballast B04",
    "port": 1,
    "shortAddress": 4,
    "emergencyLight": false,
    "gtin": "4008321371560",
    "gtinLabel": "OTi DALI 75220...24024 1...4 CH",
    "serial": "4294706693",
    "zone": "Zone 1",
    "zones": ["Zone 1"],
    "properties": ["lightLevel", "gearStatus", "lampFailure", "errorBits"]
}
```

 and other specify data base on the ``properties``, here is the api to get current certain data via ``http://<dali iot pro controller ip>/api/bmsapi/dali-devices/{guid}/property/{property}/active``,
 to get most recent data via ``http://<dali iot pro controller ip>/api/bmsapi/dali-devices/{guid}/property/{property}/last``
  here is the example response 
```
{
    "guid": "182fd8e8-a6db-496d-931f-3d7d81ca36d7",
    "property": "driverInputVoltage",
    "date": "2021.01.27",
    "time": "16:37:19",
    "value": 225.7,
    "unit": "Vrms"
}
```