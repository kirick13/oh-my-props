
# oh-my-props

Validate &amp; cast your values by defining simple and readable rules.

## Documentation

Documentation is (will be) available [here](https://ohmyprops.kirick.me)

## Why?

It's really important to receive valid values, but it's not always easy to do that, especially if you have a lot of properties with different types and custom validation functions.

OhMyProps allows you to define rules for your properties and validate them easily.

### User's name validation

Names obviously should be strings, but they also should be not empty and start with a capital letter:

```javascript
import { OhMyPropsValidator } from 'oh-my-props';

const nameValidator = new OhMyPropsValidator({
    type: String,
    validator: (value) => value.length > 0 && value[0].toUpperCase() === value[0],
});
nameValidator.cast('Peter'); // => 'Peter'
nameValidator.cast('peter'); // => OhMyPropsInvalidValueError
nameValidator.cast('');      // => OhMyPropsInvalidValueError
nameValidator.cast(42);      // => OhMyPropsInvalidValueError
```

### Object's properties validation

For example, if you want to validate user, you should have `name` and `age` properties, and `age` should be a positive integer. Also, you can have `newsletter_consent` property, which is `false` by default:

```javascript
import { OhMyPropsValidator } from 'oh-my-props';

const optionsValidator = new OhMyPropsValidator({
    type: Object,
    validator: (value) => Object.keys(value).length > 0,
    entries: {
        name: {
            type: String,
            validator: (value) => value.length > 0 && value[0].toUpperCase() === value[0],
        },
        age: {
            type: Number,
            validator: (value) => Number.isInteger(value) && value > 0,
        },
        newsletter_consent: {
            type: Boolean,
            default: false,
        },
    },
});

optionsValidator.cast({
    name: 'Peter',
    age: 42,
    newsletter_consent: true,
}); // => { name: 'Peter', age: 42, newsletter_consent: true }
optionsValidator.cast({
    name: 'Peter',
    age: 42,
}); // => { name: 'Peter', age: 42, newsletter_consent: false }
optionsValidator.cast({
    name: 'Peter',
}); // => OhMyPropsInvalidValueError (age is missing and no default value were specified in validator)
```

Entries of the `Map` can be validated in the same way.

### Object's values validation

Let's say you have an object, where every value should be a positive integer, but keys should be no longer than 10 characters:

```javascript
import { OhMyPropsValidator } from 'oh-my-props';

const optionsValidator = new OhMyPropsValidator({
    type: Object,
    validator: (value) => Object.keys(value).length > 0,
    keys: {
        type: String,
        validator: (value) => value.length > 0 && value.length <= 10,
    },
    values: {
        type: Number,
        validator: (value) => Number.isInteger(value) && value > 0,
    },
});

optionsValidator.cast({
    foo: 1,
    bar: 2,
}); // => { foo: 1, bar: 2 }
optionsValidator.cast({
    foo: 1,
    bar: -2.345,
}); // => OhMyPropsInvalidValueError: Value $.bar is not valid.
optionsValidator.cast({
    foo: 1,
    toooooooooolongkey: 2,
}); // => OhMyPropsInvalidKeyError: Key toooooooooolongkey of the object itself is not valid.
```

Values of `Array`, `Set` and `Map` can be validated in the same way, but only `Object` and `Map` can validate keys.

### Multiple validators

If you your value can be either a `String` or `Array<String>`, you can use multi-validator:

```javascript
import { OhMyPropsMultiValidator } from 'oh-my-props';

const isName = (value) => value.length > 0 && value[0].toUpperCase() === value[0];

const optionsValidator = new OhMyPropsMultiValidator(
    {
        type: String,
        validator: isName,
    },
    {
        type: Array,
        validator: (value) => value.length > 0,
        entries: {
            type: String,
            validator: isName,
        },
    },
);

optionsValidator.cast('Peter');             // => 'Peter'
optionsValidator.cast([ 'Peter', 'John' ]); // => [ 'Peter', 'John' ]
optionsValidator.cast('');                  // => OhMyPropsInvalidValueError
optionsValidator.cast([ 'Peter', '' ]);     // => OhMyPropsInvalidValueError
optionsValidator.cast([]);                  // => OhMyPropsInvalidValueError (empty array is not allowed)
```
