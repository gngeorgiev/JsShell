const { times } = require('lodash');

class StringsUtils {
    static intersect(into, str) {
        let intersectString = str;
        let match = into + str; //default
        times(str.length, () => {
            const intersectIndex = into.indexOf(intersectString);
            if (intersectIndex === -1) {
                intersectString = intersectString.substring(0, intersectString.length - 1);
            } else {
                let stringWithoutMatch = into.substring(0, intersectIndex);
                match = stringWithoutMatch + str;
            }
        });

        return match;
    }
}

module.exports = StringsUtils;