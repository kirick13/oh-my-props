
const hasOwnProperty = (target, key) => Object.prototype.hasOwnProperty.call(target, key);
const isObject = (value) => null !== value && typeof value === 'object' && value.constructor.name === 'Object';

const type_validators = new Map([
	[
		String,
		(value) => typeof value === 'string',
	],
	[
		Number,
		(value) => typeof value === 'number',
	],
	[
		Boolean,
		(value) => typeof value === 'boolean',
	],
	[
		Symbol,
		(value) => typeof value === 'symbol',
	],
	[
		Object,
		isObject,
	],
	[
		Array,
		Array.isArray,
	],
]);
const type_transformers = new Map([
	[
		String,
		(value) => String(value),
	],
	[
		Number,
		(value) => {
			value = Number.parseFloat(value);
			return Number.isNaN(value) ? null : value;
		},
	],
	[
		Boolean,
		(value) => {
			if (typeof value === 'boolean') {
				return value;
			}
			if ('1' === value || 'true' === value) {
				return true;
			}
			if ('0' === value || 'false' === value) {
				return false;
			}
			return null;
		},
	],
	[
		JSON,
		value => {
			if (typeof value === 'object') {
				return value;
			}

			try {
				return JSON.parse(value);
			}
			catch {
				return null;
			}
		},
	],
]);

const OhMyProps = module.exports = function OhMyProps (props) {
	this.props = props;

	for (const schema of Object.values(props)) {
		const validators = [];

		const { type } = schema;

		// type validator / transformer
		if (true === schema.type_cast) {
			if (type_transformers.has(type)) {
				validators.push({
					is_transform: true,
					fn: type_transformers.get(type),
				});
			}
			else {
				throw new Error(`Cannot cast to type ${type}.`);
			}
		}
		else {
			if (type_validators.has(type)) {
				validators.push({
					fn: type_validators.get(type),
				});
			}
			else if (typeof type === 'function') {
				validators.push({
					fn: (value) => value instanceof type,
				});
			}
		}

		// subvalidator
		if (
			hasOwnProperty(schema, 'subvalidator')
			&& schema.subvalidator instanceof OhMyProps
		) {
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
					fn (value) {
						if (value instanceof Object && typeof value !== 'function') {
							return schema.subvalidator.transform(value);
						}
						return null;
					},
				});
			}
		}

		// user-defined validators
		{
			const { validator } = schema;

			if (Array.isArray(validator)) {
				for (const fn of validator) {
					if (typeof fn === 'function') {
						validators.push({ fn });
					}
				}
			}
			else if (typeof validator === 'function') {
				validators.push({
					fn: validator,
				});
			}

			schema.validators = validators;
			delete schema.validator;
		}
	}
};
OhMyProps.prototype.transform = function (args) {
	const args_result = {};

	for (const [ key, schema ] of Object.entries(this.props)) {
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
			value = null;
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

OhMyProps.wrap = (props, fn) => {
	const validator = new OhMyProps(props);

	return (args = {}) => {
		args = validator.transform(args);
		if (null === args) {
			throw new Error('OHMYPROPS.INVALID_ARGUMENTS: Invalid arguments given.');
		}

		return fn(args);
	};
};

OhMyProps.createType = ({
	name,
	transformer,
	validator,
}) => {
	const type = Symbol('OHMYPROPS.TYPE.' + (name ?? 'CUSTOM'));

	if (typeof validator === 'function') {
		type_validators.set(
			type,
			validator,
		);
	}

	if (typeof transformer === 'function') {
		type_transformers.set(
			type,
			transformer,
		);
	}

	return type;
};
