#!/bin/bash
set -e

sudo mkdir -p /etc/docker
sudo cp /vagrant/files/daemon.json /etc/docker
sudo cp /vagrant/files/subuid /etc/subuid
sudo cp /vagrant/files/subgid /etc/subgid

sudo apt-get update
sudo apt-get -y upgrade
sudo apt-get -y install docker.io python-pip git
sudo pip install docker-compose

sudo usermod -aG docker ubuntu

sudo mkdir /etc/piksha
sudo cp /vagrant/files/config.json /etc/piksha/

mkdir /tmp/cert_gen
openssl genrsa -des3 -passout pass:x -out /tmp/cert_gen/server.pass.key 2048
openssl rsa -passin pass:x -in /tmp/cert_gen/server.pass.key -out /tmp/cert_gen/server.key
rm /tmp/cert_gen/server.pass.key
openssl req -new -key /tmp/cert_gen/server.key -out /tmp/cert_gen/server.csr -subj "/C=AU/ST=NSW/L=Sydney/O=piksha/OU=piksha/CN=piksha"
openssl x509 -req -days 365 -in /tmp/cert_gen/server.csr -signkey /tmp/cert_gen/server.key -out /tmp/cert_gen/server.crt
echo '' > /tmp/cert_gen/server.bundle

sudo mv /tmp/cert_gen/server.* /etc/ssl/certs/
rm -rf /tmp/cert_gen
