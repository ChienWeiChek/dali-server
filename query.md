# each device total_energy_consumption

```
SELECT last("value_num") AS "total_energy_consumption"
FROM "dali_devices"."monthly"."dali_property"
WHERE "property" = 'driverEnergyConsumption'
GROUP BY "title"
```

# check data collect by device
```
SELECT count("value_num") AS "data_point_count"
FROM "dali_devices"."monthly"."dali_property"
GROUP BY "title", "property"
```

influx bucket delete --name dali_devices --org dali
influx bucket create --name dali_devices --org dali --retention 0