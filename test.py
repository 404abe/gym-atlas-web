tempChange = [1 -2 1]

maxTemp = 0;
currentTemp = 0

for n in tempChange:
    if currentTemp + tempChange[n] > maxTemp:
        maxTemp = currentTemp
return maxTemp