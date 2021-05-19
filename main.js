
const { iterate } = require('uiterator');

const hasOwnProperty = (target, key) => Object.prototype.hasOwnProperty.call(target, key);

const type_validators = {
	[ String ]: (value) => typeof value === 'string',
	[ Number ]: (value) => typeof value === 'number',
	[ Boolean ]: (value) => typeof value === 'boolean',
	[ Symbol ]: (value) => typeof value === 'symbol',
	[ Object ]: (value) => typeof value === 'object' && value instanceof Object,
	[ Array ]: (value) => Array.isArray(value),
};
const type_transformers = {
	[ String ]: (value) => String(value),
	[ Number ]: (value) => {
		value = Number.parseFloat(value);
		return Number.isNaN(value) ? null : value;
	},
	[ Boolean ]: (value) => {
		if (typeof value === 'boolean') {
			return value;
		}
		else if ('1' === value || 'true' === value) {
			return true;
		}
		else if ('0' === value || 'false' === value) {
			return false;
		}
		return null;
	},
};

const OhMyProps = module.exports = function OhMyProps (args_schema) {
	this.args_schema = args_schema;

	for (const schema of iterate(this.args_schema).values()) {
		const validators = [];

		const { type } = schema;

		// type validator / transformer
		if (true === schema.type_cast) {
			if (hasOwnProperty(type_transformers, type)) {
				validators.push({
					is_transform: true,
					fn: type_transformers[type],
				});
			}
			else {
				throw new Error(`Cannot cast to type ${type}.`);
			}
		}
		else {
			if (hasOwnProperty(type_validators, type)) {
				validators.push({
					fn: type_validators[type],
				});
			}
			else {
				validators.push({
					fn: (value) => value instanceof type,
				});
			}
		}

		// subvalidator
		if (hasOwnProperty(schema, 'subvalidator') && schema.subvalidator instanceof OhMyProps) {
			if (Array === schema.type) {
				validators.push({
					is_transform: true,
					fn (value) {
						const result = [];
						for (let value_this of value) {
							value_this = schema.subvalidator.transform(value_this);
							if (null === value_this) {
								return null;
							}
							else {
								result.push(value_this);
							}
						}
						return result;
					},
				});
			}
			else {
				validators.push({
					is_transform: true,
					fn: (value) => {
						if (value instanceof Object && typeof value !== 'function') {
							return schema.subvalidator.transform(value);
						}
						return null;
					},
				});
			}
		}

		// user-defined validators
		if (Array.isArray(schema.validator)) {
			for (const fn of schema.validator) {
				if (typeof fn === 'function') {
					validators.push({ fn });
				}
			}
		}
		else if (typeof schema.validator === 'function') {
			validators.push({
				fn: schema.validator,
			});
		}

		schema.validators = validators;
		delete schema.validator;
	}
};
OhMyProps.prototype.transform = function (args) {
	const args_result = {};

	for (const [ key, schema ] of iterate(this.args_schema)) {
		let value;

		if (hasOwnProperty(args, key)) {
			value = args[key];
		}
		else if (hasOwnProperty(schema, 'default')) {
			let default_value = schema.default;
			if (typeof default_value === 'function') {
				default_value = default_value();
			}

			value = default_value;
		}

		if (undefined === value) {
			return null;
		}

		if (null === value) {
			if (true !== schema.is_nullable) {
				return null;
			}
		}
		else {
			for (const { is_transform, fn } of schema.validators) {
				if (true === is_transform) {
					const result = fn(value);
					if (null === result) {
						return null;
					}
					else {
						value = result;
					}
				}
				else {
					const result = fn(value);
					if (true !== result) {
						return null;
					}
				}
			}
		}

		args_result[key] = value;
	}

	return args_result;
};
OhMyProps.prototype.isValid = function (args) {
	return this.transform(args) !== null;
};

OhMyProps.wrap = (args_schema, fn) => {
	const validator = new OhMyProps(args_schema);

	return (args = {}) => {
		args = validator.transform(args);
		if (null === args) {
			throw new Error('OHMYPROPS.INVALID_ARGUMENTS: Invalid arguments given.');
		}

		return fn(args);
	};
};

const register = {
	types     : new Map(),
	validators: new Map(),
};
OhMyProps.registerType = (name, fn_transform) => {
	if (register.types.has(name)) {
		throw new Error(`Type ${name} already registered.`);
	}

	const key = Symbol('OHMYPROPS.TYPE.' + name);
	register.types.set(name, key);
	type_transformers[key] = fn_transform;
};
OhMyProps.type = (name) => {
	if (register.types.has(name)) {
		return register.types.get(name);
	}
	throw new Error(`Type ${name} has not been registered.`);
};
OhMyProps.registerValidator = (name, fn) => {
	if (register.validators.has(name)) {
		throw new Error(`Validator ${name} already registered.`);
	}

	register.validators.set(name, fn);
};
OhMyProps.validator = (name) => {
	if (register.validators.has(name)) {
		return register.validators.get(name);
	}
	throw new Error(`Validator ${name} has not been registered.`);
};

OhMyProps.registerType(
	'JSON',
	value => {
		if (typeof value === 'object') {
			return value;
		}

		try {
			return JSON.parse(value);
		}
		catch {}

		return null;
	},
);
