
import {
	OhMyPropsValueError,
	OhMyPropsInvalidValueError } from '../classes/errors.js';
import { isPlainObject }         from '../utils.js';

const DEFAULT_TYPES = new Map();

export default class OhMyPropsType {
	#fn_test;
	#fn_cast;

	constructor(...args) {
		if (args[0] instanceof OhMyPropsType) {
			// eslint-disable-next-line no-constructor-return
			return args[0];
		}

		if (DEFAULT_TYPES.has(args[0])) {
			// eslint-disable-next-line no-constructor-return
			return DEFAULT_TYPES.get(args[0]);
		}

		if (typeof args[0] === 'string') {
			this.name = args[0];

			if (typeof args[1] === 'function') {
				this.#fn_test = args[1];
			}

			if (typeof args[2] === 'function') {
				this.#fn_cast = args[2];
			}
		}
		else if (typeof args[0] === 'function') {
			const _class = args[0];

			this.name = `[class ${_class.name}]]`;
			this.#fn_test = (value) => value instanceof _class;
		}
		else {
			throw new TypeError('Invalid arguments passed to OhMyPropsType constructor.');
		}
	}

	test(value) {
		if (typeof this.#fn_test === 'function') {
			return this.#fn_test(value);
		}

		try {
			this.cast(value);
			return true;
		}
		catch (error) {
			if (error instanceof OhMyPropsValueError) {
				return false;
			}

			throw error;
		}
	}

	cast(value) {
		if (this.is_castable) {
			return this.#fn_cast(value);
		}

		throw new Error(`Type ${this.name} does not support casting.`);
	}

	get is_castable() {
		return typeof this.#fn_cast === 'function';
	}
}

DEFAULT_TYPES.set(
	String,
	new OhMyPropsType(
		'String',
		(value) => typeof value === 'string',
		String,
	),
);
DEFAULT_TYPES.set(
	Number,
	new OhMyPropsType(
		'Number',
		(value) => typeof value === 'number' && Number.isNaN(value) !== true,
		(value) => {
			const value_parsed = Number.parseFloat(value);
			if (Number.isNaN(value_parsed)) {
				throw new OhMyPropsInvalidValueError();
			}

			return value_parsed;
		},
	),
);
DEFAULT_TYPES.set(
	Boolean,
	new OhMyPropsType(
		'Boolean',
		(value) => typeof value === 'boolean',
		(value) => {
			if (typeof value === 'boolean') {
				return value;
			}
			if (value === 1 || value === '1' || value === 'true') {
				return true;
			}
			if (value === 0 || value === '0' || value === 'false') {
				return false;
			}

			throw new OhMyPropsInvalidValueError();
		},
	),
);
DEFAULT_TYPES.set(
	Symbol,
	new OhMyPropsType(
		'Symbol',
		(value) => typeof value === 'symbol',
	),
);
DEFAULT_TYPES.set(
	Array,
	new OhMyPropsType(
		'Array',
		Array.isArray,
	),
);
DEFAULT_TYPES.set(
	Object,
	new OhMyPropsType(
		'Object',
		isPlainObject,
	),
);
DEFAULT_TYPES.set(
	Set,
	new OhMyPropsType(
		'Set',
		(value) => value instanceof Set,
	),
);
DEFAULT_TYPES.set(
	Map,
	new OhMyPropsType(
		'Map',
		(value) => value instanceof Map,
	),
);
DEFAULT_TYPES.set(
	JSON,
	new OhMyPropsType(
		'JSON',
		null,
		(value) => {
			if (typeof value === 'object') {
				return value;
			}

			try {
				return JSON.parse(value);
			}
			catch {
				throw new OhMyPropsInvalidValueError();
			}
		},
	),
);
