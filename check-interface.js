// module Error
const error = (where, what) => {
    throw new Error(`${where} error in check-interface, ${what}`);
};


// module typeChecker
const typeChecker = (types, val) => {
    let flag = false;
    [...types].forEach(type => {
        if (type === null || type === undefined) {
            flag = flag || val === type;
        } else {
            flag = flag || val.__proto__.constructor === type;
        }
    });
    return flag;
};


// module syntaxChecker
const syntaxChecker = (objIn) => {
    // check whole object
    const obj = objIn;
    if (!typeChecker([Object], obj)) {
        error('Syntax', 'config object must be an object');
        return false;
    }

    // check $type present
    let type = obj.$type;
    if (obj.$template && !type) {
        type = Object;
    }
    if (!type) {
        error('Syntax', '$type must be presented while $template is absent');
        return false;
    }

    // check $type type
    if (typeChecker([Array], type)) {
        types = new Set(type);
    } else {
        types = new Set([type]);
    }

    obj.$type = types;

    if (obj.$template) {
        // check isIterable
        let isObject = false;
        let isIteratable = false;
        types.forEach(type => {
            if (type === Object) {
                isObject = true;
            }
            if ((new type)[Symbol.iterator]) {
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
    if (obj.$default !== undefined && !typeChecker(types, obj.$default)) {
        error('Syntax', '$default and $type unmatched');
        return false;
    }

    return obj;
};


const syntaxRecurseChecker = (obj) => {
    syntaxChecker(obj);
    if (obj.$template) {
        Object.keys(obj.$template).forEach(key => {
            syntaxRecurseChecker(obj.$template[key]);
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
    let result = typeChecker(config.$type, obj);
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
            $type: String,
            $default: 'DefaultName',
            $before() {
                console.log('before!');
            },
            $after() {
                console.log('after!');
            }
        },
        info: {
            $type: Object,
            $template: {
                year: {
                    $type: String,
                    $default: '2018',
                },
                region: {
                    $type: String,
                    $default: 'Shanghai',
                },
            },
        },
        childrens: {
            $type: Array,
            $len: '@para1',
            $default: [],
            $template: {
                name: {
                    $type: String,
                },
                age: {
                    $type: Number,
                },
            },
        },
        parents: {
            $type: Array,
            $len: '@para1',
            $default: [],
            $template: {
                name: {
                    $type: String,
                },
                age: {
                    $type: Number,
                    $before() {
                        console.log('before!');
                    },
                    $after() {
                        console.log('after!');
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
