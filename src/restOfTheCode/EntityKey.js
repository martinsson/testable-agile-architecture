var lodash = require('lodash');

function EntityKey() {
    return {
        append: function (property, value) {
            var newPath = [this.directory(), property, value].join("/");
            return EntityKey.fromPath(newPath);
        },
        directory: function () {
            return "/some/path";
        }

    }

}

EntityKey.fromPath = function (path) {
    return EntityKey();
};

module.exports = EntityKey;