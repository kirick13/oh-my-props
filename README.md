
# oh-my-props

Validate &amp; transform your props by schema.

## API

### `new OhMyProps(props_description)`

Creates an OhMyProps instance.

```javascript
const propsInstance = new OhMyProps({
    foo: {
        type: String,
        default: 'bar',
    },
    baz: {
        type: Number,
        validator: (value) => Number.isInteger(value),
    },
});
```

Every value of `props_description` is an Object describing a property. Possible options:

| Name | Type | Default value | Description |
| - | - | - | - |
| `type` | `any` | — | Prop of what type you expect.<br>Built-in options: `String`, `Number`, `Boolean`, `Symbol`, `Object` (plain), `Array` and `JSON`. <br> You can define type validators by yourself using `createType` static method. |
| `is_nullable` | `Boolean` | `false` | Set to `true` if you want to allow `null` values on that property. |
| `type_cast` | `Boolean` | `false` | Should OhMyProps cast property's value to defined `type`. <br> It can be used to cast HTTP API parameters from strings or to decode data. |
| `default` | `any` | — | Default value for undefined property. If that option is a `function`, OhMyProps will threat that function as a factory function. <br> **Be careful**: non-primitive defaults (e.g. `Object` or `Array`) must be returned from a factory function. |
| `subvalidator` | `OhMyProps` | — | An OhMyProps instance that will validate a value itself if this is plain `Object` or every element inside `Array`. |
| `validator` | `Function` <br> `Array<Function>` | — | Validator(s) that will be called with property's value. <br> If any validator will return any value but `true`, validation will be failed. |

### Class method `transform(props)`

Transforms an object `props`. Any properties not defined at `new OhMyProps` will be omitted.

Returns a tramsformed object or `null` if transformation or validation has failed.

```javascript
propsInstance.transform({
    foo: 'hello world!',
    baz: 10,
    unknown_property: 42,
});
// => { foo: 'hello world!', baz: 10 }

propsInstance.transform({ baz: 10 });
// => { foo: 'bar', baz: 10 }

propsInstance.transform({
    foo: [ 1, 2, 3 ], // expected String, got Array -> fail
    baz: 12.34,       // validation error: Number.isInteger will return false
});
// => null
```

### Class method `isValid(props)`

Returns `true` if `props` was succesfully transformed and validated.

```javascript
propsInstance.isValid({
    foo: 'hello world!',
    baz: 10,
    unknown_property: 42,
});
// => true
```

### Static method `wrap(props_description, targetFunction)`

Returns a function that will transform and validate properties and pass them to `targetFunction` if they are valid. If they are not, an error will be throwed.

```javascript
const doubleNumber = OhMyProps.wrap(
    {
        num: {
            type: Number,
            type_cast: true,
            validator: (value) => value > 0 && Number.isInteger(value),
        },
    },
    ({ num }) => {
        return num * 2;
    },
);

doubleNumber({ num: 13 });
// => 26

doubleNumber({ num: '10' });
// => 20

doubleNumber({ num: 'hello' });
// => TypeError: Invalid props.

doubleNumber({ num: 1.234 });
// => TypeError: Invalid props.

doubleNumber();
// => TypeError: Invalid props.
```

### Statiс method `createType({ name, transformer, validator })`

Creates a user-defined type with functions that transforms (casts) a value and validates it.

Returns an object that should be passed as `type` to property description.

```javascript
// create a type
const BASE64_BUFFER = OhMyProps.createType({
    name: 'BASE64_BUFFER', // not necessary, but useful for logs
    transformer: (value) => Buffer.from(value, 'base64'),
    validator: (value) => Buffer.isBuffer(value),
});

// use that type at the instance
const anotherPropsInstance = new OhMyProps({
    payload: {
        type: BASE64_BUFFER,
        type_cast: true,
    },
});

// try to cast
anotherPropsInstance.transform({
    payload: 'aGVsbG8gd29ybGQ=',
});
// => { payload: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64> }

// it works with buffers too
anotherPropsInstance.transform({
    payload: Buffer.from([ 0xDE, 0xAD ]),
});
// => { payload: <Buffer de ad> }
```
