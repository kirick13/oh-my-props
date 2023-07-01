
import OhMyPropsValue           from './validator.js';
import {
	OhMyPropsInvalidValueError,
	OhMyPropsMissingValueError,
	OhMyPropsMissingKeyError,
	OhMyPropsExtraKeyError    } from './errors.js';
import OhMyPropsType            from './type.js';

export default class OhMyPropsEntries extends OhMyPropsType {
	#validators_by_key = new Map();

	constructor(schema) {
		super(
			'',
			null,
			(value) => this.#cast(value),
		);

		for (const [ key, value ] of Object.entries(schema)) {
			this.#validators_by_key.set(
				key,
				value instanceof OhMyPropsType ? value : new OhMyPropsValue(value),
			);
		}
	}

	#cast(value_entries) {
		const keys_schema = new Set(
			this.#validators_by_key.keys(),
		);

		const result = [];

		for (const [ key, value ] of value_entries) {
			if (keys_schema.has(key) !== true) {
				throw new OhMyPropsExtraKeyError(key);
			}

			try {
				result.push([
					key,
					this.#validators_by_key.get(key).cast(value),
				]);
			}
			catch (error) {
				if (error instanceof OhMyPropsInvalidValueError) {
					error.addKey(key);
				}

				throw error;
			}

			keys_schema.delete(key);
		}

		for (const key of keys_schema) {
			try {
				result.push([
					key,
					this.#validators_by_key.get(key).cast(),
				]);
			}
			catch (error) {
				if (error instanceof OhMyPropsMissingValueError) {
					throw new OhMyPropsMissingKeyError(key);
				}

				throw error;
			}
		}

		return result;
	}
}
