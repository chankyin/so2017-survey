#!/bin/bash
curl -Lo data.zip "https://drive.google.com/uc?export=download&id=0B6ZlG_Eygdj-c1kzcmUxN05VUXM"
unzip data.zip
npm install
node clean.js
