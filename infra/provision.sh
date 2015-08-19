#!/bin/bash
set -e

sudo apt-get update
sudo apt-get -y upgrade
sudo apt-get -y install vim nodejs npm nodejs-legacy git
sudo npm install npm -g

sudo mkdir /etc/piksha
sudo mv /home/vagrant/config.json /etc/piksha/
