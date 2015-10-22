var lodash = require('lodash');

function Face() {

}
Face.buildFace = function (idAndDimensions) {
    return lodash.cloneDeep(idAndDimensions)
};

module.exports = Face;