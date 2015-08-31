module.exports = function (m) {
  return function (namespace, callback) {
    callback(m.exports);
  };
};
