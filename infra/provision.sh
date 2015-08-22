#!/bin/bash
set -e

sudo apt-get update
sudo apt-get -y upgrade
sudo apt-get -y install vim nodejs npm nodejs-legacy git memcached
sudo npm install npm -g

sudo mkdir /etc/piksha
sudo mv /home/vagrant/config.json /etc/piksha/

openssl genrsa -des3 -passout pass:x -out server.pass.key 2048
openssl rsa -passin pass:x -in server.pass.key -out server.key
rm server.pass.key
openssl req -new -key server.key -out server.csr -subj "/C=AU/ST=NSW/L=Sydney/O=piksha/OU=piksha/CN=piksha"
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

sudo mv /home/vagrant/server.* /etc/ssl/certs/
