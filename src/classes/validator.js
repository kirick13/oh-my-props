
import OhMyPropsEntries         from './entries.js';
import {
	OhMyPropsValueError,
	OhMyPropsInvalidValueError,
	OhMyPropsMissingValueError,
	OhMyPropsInvalidKeyError  } from './errors.js';
import OhMyPropsType            from './type.js';
import OhMyPropsValues          from './values.js';

import { hasOwnProperty }       from '../utils.js';

function convert_validators(value, property) {
	if (typeof value === 'function') {
		return [{
			fn: value,
		}];
	}

	if (Array.isArray(value)) {
		const result = [];

		for (const fn of value) {
			if (typeof value !== 'function') {
				throw new TypeError(`Property "${property}" must be a function or an array of functions, ${typeof fn} found inside.`);
			}

			result.push({ fn });
		}

		return result;
	}

	if (undefined !== value) {
		throw new TypeError(`Property "${property}" must be a function or an array of functions, ${typeof value} given.`);
	}

	return [];
}

export default class OhMyPropsValidator extends OhMyPropsType {
	#type;
	#type_original;
	#type_cast = false;
	#is_optional = false;
	#default;
	#main_runners = [];
	#after_runners = [];
	#deep_keys;
	#deep_values;
	#deep_entries;

	constructor(schema) {
		super(
			`Validator[${Math.random().toString(36).slice(2)}]`,
			null,
			(value) => this.#cast(value),
		);

		this.#type = new OhMyPropsType(schema.type);
		this.#type_original = schema.type;

		if (hasOwnProperty(schema, 'cast')) {
			if (typeof schema.cast !== 'boolean') {
				throw new TypeError('Property "cast" must be a boolean.');
			}

			this.#type_cast = schema.cast;
		}
		if (this.#type_cast === true && this.#type.is_castable !== true) {
			throw new TypeError(`Type ${this.#type.name} does not support casting.`);
		}

		if (hasOwnProperty(schema, 'optional')) {
			if (typeof schema.optional !== 'boolean') {
				throw new TypeError('Property "optional" must be a boolean.');
			}

			this.#is_optional = schema.optional;
		}

		if (hasOwnProperty(schema, 'default')) {
			this.#default = schema.default;
		}

		// user-defined validators
		this.#main_runners.push(
			...convert_validators(
				schema.validator,
				'validator',
			),
			...convert_validators(
				schema.valueValidator,
				'valueValidator',
			),
		);

		// deep
		if (hasOwnProperty(schema, 'keys')) {
			if (
				this.#type_original === Object
				|| this.#type_original === Map
			) {
				this.#deep_keys = new OhMyPropsValues(schema.keys);
			}
			else {
				throw new TypeError(`Property "keys" is allowed only on Object and Map, ${this.#type_original} given.`);
			}
		}
		if (hasOwnProperty(schema, 'values')) {
			if (
				this.#type_original === Array
				|| this.#type_original === Object
				|| this.#type_original === Set
				|| this.#type_original === Map
			) {
				this.#deep_values = new OhMyPropsValues(schema.values);
			}
			else {
				throw new TypeError(`Property "values" is allowed only on Array and Set, ${this.#type_original} given.`);
			}
		}
		if (hasOwnProperty(schema, 'entries')) {
			if (
				this.#type_original === Object
				|| this.#type_original === Map
			) {
				this.#deep_entries = new OhMyPropsEntries(schema.entries);
			}
			else {
				throw new TypeError(`Property "entries" is allowed only on Object and Map, ${this.#type_original} given.`);
			}
		}

		// user-defined content validators
		this.#after_runners.push(
			...convert_validators(
				schema.contentValidator,
				'contentValidator',
			),
		);
	}

	// TODO: remove eslint suppression
	// eslint-disable-next-line complexity
	#cast(value) {
		if (
			undefined === value
			&& undefined !== this.#default
		) {
			value = this.#default;
			if (typeof value === 'function') {
				value = value();
			}
		}

		if (undefined === value) {
			value = null;
		}

		if (value === null) {
			if (this.#is_optional !== true) {
				throw new OhMyPropsMissingValueError(value);
			}
		}
		else {
			// test/cast to given type
			if (this.#type_cast) {
				value = this.#type.cast(value);
			}
			else if (this.#type.test(value) !== true) {
				throw new OhMyPropsInvalidValueError(value);
			}

			// run custom test/cast functions
			for (const { fn } of this.#main_runners) {
				if (fn(value) !== true) {
					throw new OhMyPropsInvalidValueError(value);
				}
			}

			// run deep
			if (this.#deep_keys) {
				try {
					if (this.#type_original === Object) {
						const keys = Object.keys(value);

						for (const [ index, key_new ] of this.#deep_keys.cast(keys).entries()) {
							const key_old = keys[index];

							// eslint-disable-next-line max-depth
							if (key_new !== key_old) {
								value[key_new] = value[key_old];
								delete value[key_old];
							}
						}
					}
					else if (this.#type_original === Map) {
						const keys = [ ...value.keys() ];

						for (const [ index, key_new ] of this.#deep_keys.cast(keys).entries()) {
							const key_old = keys[index];

							// eslint-disable-next-line max-depth
							if (key_new !== key_old) {
								value.set(
									key_new,
									value.get(key_old),
								);
								value.delete(key_old);
							}
						}
					}
				}
				catch (error) {
					if (error instanceof OhMyPropsValueError) {
						throw new OhMyPropsInvalidKeyError(error);
					}

					throw error;
				}
			}

			if (this.#deep_values) {
				let keys;

				try {
					switch (this.#type_original) {
						case Array:
							value = this.#deep_values.cast(value);
							break;
						case Object: {
							keys = Object.keys(value);

							const values = [];
							for (const key of keys) {
								values.push(value[key]);
							}

							const value_new = this.#deep_values.cast(values);
							for (const key of keys) {
								value[key] = value_new.shift();
							}
						} break;
						case Set:
							value = new Set(
								this.#deep_values.cast(value),
							);
							break;
						case Map: {
							keys = [ ...value.keys() ];

							const values = [];
							for (const key of keys) {
								values.push(value.get(key));
							}

							const value_new = this.#deep_values.cast(values);
							for (const [ index, key ] of keys.entries()) {
								value.set(
									key,
									value_new[index],
								);
							}
						} break;
						// no default
					}
				}
				catch (error) {
					if (error instanceof OhMyPropsValueError) {
						switch (this.#type_original) {
							case Array:
								error.addKey(error.index);
								break;
							case Object:
							case Map:
								error.addKey(
									keys[error.index],
								);
								break;
							// no default
						}

						delete error.index;
					}

					throw error;
				}
			}

			if (this.#deep_entries) {
				if (this.#type_original === Object) {
					value = Object.fromEntries(
						this.#deep_entries.cast(
							Object.entries(value),
						),
					);
				}
				else if (this.#type_original === Map) {
					value = new Map(
						this.#deep_entries.cast(
							value.entries(),
						),
					);
				}
			}

			// run custom test/cast functions
			for (const { fn } of this.#after_runners) {
				if (fn(value) !== true) {
					throw new OhMyPropsInvalidValueError(value);
				}
			}
		}

		return value;
	}
}
