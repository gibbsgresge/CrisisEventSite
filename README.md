# CrisisEventSite
CS 4624 Capstone Project 



create docker image using:

```docker build -t crisis-full .```

run image using:
```docker run --gpus all -p 5000:5000 -p 3000:3000 -p 27017:27017 crisis-full```
