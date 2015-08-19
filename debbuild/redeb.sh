#!/usr/bin/fakeroot bash

# IMPORTANT
# Protect agaisnt mispelling a var and rm -rf /
set -u
set -e

SRC=`mktemp -d`
DIST=`mktemp -d`
SYSROOT=${SRC}/sysroot
APPROOT=${SYSROOT}/opt/piksha
DEBIAN=${SRC}/DEBIAN
VERSION=`node -e 'console.log(require("../package.json").version);'`


cp -r deb-src/* ${SRC}/
mkdir -p ${APPROOT}

cp ../index.js ${APPROOT}/
cp ../npm-shrinkwrap.json ${APPROOT}/
cp ../package.json ${APPROOT}/
cp ../README.md ${APPROOT}/
cp ../LICENSE ${APPROOT}/

find ${SRC}/ -type d -exec chmod 0755 {} \;
find ${SRC}/ -type f -exec chmod go-w {} \;
chown -R root:root ${SRC}/

let SIZE=`du -s ${SYSROOT} | sed s'/\s\+.*//'`+8
pushd ${SYSROOT}/
tar czf ${DIST}/data.tar.gz [a-z]*
popd
sed s"/SIZE/${SIZE}/" -i ${DEBIAN}/control
sed s"/VERSION/${VERSION}/" -i ${DEBIAN}/control
pushd ${DEBIAN}
tar czf ${DIST}/control.tar.gz *
popd

pushd ${DIST}/
echo 2.0 > ./debian-binary

find ${DIST}/ -type d -exec chmod 0755 {} \;
find ${DIST}/ -type f -exec chmod go-w {} \;
chown -R root:root ${DIST}/
ar r ${DIST}/piksha-1.deb debian-binary control.tar.gz data.tar.gz
popd
rsync -a ${DIST}/piksha-1.deb ./
