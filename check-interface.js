// module Error
const error = (where, what) => {
    throw new Error(`${where} error in check-interface, ${what}`);
};

// module typeChecker
const typeChecker = (() => {
    const isObjectType = (type, obj) => Object.prototype.toString.call(obj) === `[object ${type}]`;
    const isNormalType = (type, obj) => typeof val === type.toLowerCase();
    const is = {
        Number(val) {
            return isObjectType('Number', val) || isNormalType('Number', val);
        },
        String(val) {
            return isObjectType('String', val) || isNormalType('String', val);
        },
        Boolean(val) {
            return isObjectType('Boolean', val) || isNormalType('Boolean', val);
        },
        Undefined(val) {
            return isNormalType('Undefined', val);
        },
        Null(val) {
            return isNormalType('Null', val);
        },
        Symbol(val) {
            return isNormalType('Symbol', val);
        },
        Object(val) {
            return isObjectType('Object', val);
        },
        Iteratable(val) {
            return this.Array(val) || this.Set(val) || this.Map(val);
        },
        Array(val) {
            return isObjectType('Array', val);
        },
        Set() {
            return isObjectType('Set', val);
        },
        Map() {
            return isObjectType('Map', val);
        },
    };
    const typeSet = new Set(Object.keys(is));

    return {
        check(types, val) {
            let flag = false;
            [...types].forEach(type => {
                flag = flag || is[type](val);
            });
            return flag;
        },
        has(type) {
            return typeSet.has(type);
        }
    };
})();



// module syntaxChecker
const syntaxChecker = (objIn) => {
    // check whole object
    const obj = objIn;
    if (!typeChecker.check(['Object'], obj)) {
        error('Syntax', 'config object must be an object');
        return false;
    }

    // check $type present
    let type = obj.$type;
    if (obj.$template && !type) {
        type = 'Object';
    }
    if (!type) {
        error('Syntax', '$type must be presented while $template is absent');
        return false;
    }

    // check $type type
    if (typeChecker.check(['String'], type)) {
        types = new Set([type]);
    } else if (typeChecker.check(['Iteratable'], type)) {
        types = new Set(type);
    } else {
        error('Syntax', 'wrong type of $type');
        return false;
    }
    let toReturn = false;
    types.forEach(type => {
        if (!typeChecker.has(type)) {
            error('Syntax', `unknown $type "${type}"`);
            toReturn = true;
        }
    });
    if (toReturn) {
        return false;
    }

    // reassign $type
    obj.$type = types;


    if (obj.$template) {
        // check $type with $template
        const templatableTypes = new Set(['Object', 'Iteratable', 'Set', 'Map', 'Array']);
        let flag = false;
        types.forEach(type => {
            if (templatableTypes.has(type)) {
                flag = true;
            }
        });
        if (!flag) {
            error('Syntax', `provided $type doesn't support $template`);
            return false;
        }

        // check isIterable
        let isObject = false;
        let isIteratable = false;
        templatableTypes.delete('Object');
        types.forEach(type => {
            if (type === 'Object') {
                isObject = true;
            }
            if (templatableTypes.has(type)) {
                isIteratable = true;
            }
        });
        if (isObject && isIteratable) {
            error('Syntax', 'confusing $type and $template config');
            return;
        }
        obj.$iteratable = isIteratable;
    }


    // check $default
    if (obj.$default !== undefined && !typeChecker.check(types, obj.$default)) {
        error('Syntax', '$default and $type unmatched');
        return false;
    }

    return obj;
};

const syntaxRecurseChecker = (obj) => {
    syntaxChecker(obj);
    if (obj.$template) {
        Object.keys(obj.$template).forEach(key => {
            syntaxChecker(obj.$template[key]);
        })
    }
};


// module check-object
// TODO: param
const checkKeys = (obj, config) => {
    let result = true;
    Object.keys(obj).forEach(key => {
        const subresult = checkObject(obj[key], config[key]);
        result = result && subresult;
    });
    return result;
}

const checkObject = (obj, config) => {
    console.log(config);
    let result = typeChecker.check(config.$type, obj);
    (config.$before || (() => {}))(obj, result);
    if (config.$template) {
        if (config.$iteratable) {
            obj.forEach(objItem => {
                const subresult = checkKeys(objItem, config.$template);
                result = result && subresult;
            });
        } else {
            const subresult = checkKeys(obj, config.$template);
            result = result && subresult;
        }
    }
    if (!result && config.$default) {
        obj = config.$default;
    }
    (config.$after || (() => {}))(obj, result);
};


// module Checker
class Checker {
    constructor(obj) {
        this.config = obj;
        syntaxRecurseChecker(this.config);
    }

    check(val) {
        checkObject(val, this.config);
    }
}



// module test.js
const checker1 = new Checker({
    $template: {
        className: {
            $type: 'String',
            $default: 'DefaultName',
            $before(val) {
                console.log('error!');
            },
        },
        info: {
            $type: 'Object',
            $template: {
                year: {
                    $type: 'String',
                    $default: '2018',
                },
                region: {
                    $type: 'String',
                    $default: 'Shanghai',
                },
            },
        },
        childrens: {
            $type: 'Array',
            $len: '@para1',
            $default: [],
            $template: {
                name: {
                    $type: 'String',
                },
                age: {
                    $type: 'Number',
                },
            },
        },
        parents: {
            $type: 'Array',
            $len: '@para1',
            $default: [],
            $template: {
                name: {
                    $type: 'String',
                },
                age: {
                    $type: 'Number',
                    $before() {
                        console.log('error!');
                    }
                }
            }
        }
    },
});

console.log(checker1);

// console.log(checker1.check({
//     className: 'class 1',
//     childrens: [
//         {
//             name: 'BBG',
//             age: 14,
//         },
//         {
//             name: 'VVJ',
//             age: 64,
//         }
//     ],
//     parents: [
//         {
//             name: 'FFQ',
//             age: 12,
//         },
//         {
//             name: 'SSP',
//             age: 20,
//         }
//     ]
// }));
