/// <reference path="./../typings/tsd.d.ts" />
/// <reference path="./../app.ts" />
'use strict';
var Util = (function () {
    function Util() {
    }
    /**
     * Takes the subject and pads it with leading zeros based on the target length.
     *
     * @param {number} targetLength  Total length of the padded string.
     * @param {any}    subject       Number to pad with zeros.
     */
    Util.padLeadingZeros = function (targetLength, subject) {
        // build string of all zeros
        var zeros = '';
        for (var index = 0; index < targetLength; index++) {
            zeros = zeros + '0';
        }
        return (zeros + (subject).toString()).slice(-zeros.length);
    };
    return Util;
})();
module.exports = Util;
//# sourceMappingURL=Utils.js.map