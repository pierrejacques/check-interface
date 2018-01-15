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
        throw new Error('Syntax Error in check-interface, config Object be an object');
        return false;
    }

    // check $type present
    let type = obj.$type;
    if (obj.$template && !type) {
        type = 'Object';
    }
    if (!type) {
        throw new Error('Syntax Error in check-interface, type must be presented while template is absent');
        return false;
    }

    // check $type type
    if (typeChecker.check(['String'], type)) {
        types = new Set([type]);
    } else if (typeChecker.check(['Iteratable'], type)) {
        types = new Set(type);
    } else {
        throw new Error('Syntax Error in check-interface, wrong type of Attribute "$type"');
        return false;
    }
    let toReturn = false;
    types.forEach(type => {
        if (!typeChecker.has(type)) {
            throw new Error(`Syntax Error in check-interface, unknown type "${type}"`);
            toReturn = true;
        }
    });
    if (toReturn) { return false; }

    // reassign $type
    obj.$type = types;

    // check $type with $template
    if (obj.$template) {
        const templatableTypes = new Set(['Object', 'Iteratable', 'Set', 'Map', 'Array']);
        types.forEach(type => {
            if (!templatableTypes.has(type)) {
                throw new Error(`Syntax Error in check-interface, $type ${type} unsatisfy to the presence of $template`);
                toReturn = true;
            }
        });
        if (toReturn) { return false; }
    }

    // check $default
    if (obj.$default !== undefined && !typeChecker.check(types, obj.$default)) {
        throw new Error(`Syntax Error in check-interface, default and type unmatched`);
        return false;
    }

    return obj;
};




// module Checker
const syntaxRecurseChecker = (obj) => {
    syntaxChecker(obj);
    if (obj.$template) {
        Object.keys(obj.$template).forEach(key => {
            syntaxChecker(obj.$template[key]);
        })
    }
};

class Checker {
    constructor(obj) {
        // TODO: 递归
        this.checkingObject = obj;
        syntaxRecurseChecker(this.checkingObject);
    }

    check(val) {
        // TODO: 递归实现的检查方法
    }
}



// module test.js
const checker1 = new Checker({
    $template: {
        name: {
            $type: 'String',
            $default: 'DefaultName',
            $hook() {
                console.log('emtpy');
            },
        },
        childrens: {
            $type: 'Array',
            $default: [],
            $template: {

            },
        }
    },
});

console.log(checker1.checkingObject.$template);
