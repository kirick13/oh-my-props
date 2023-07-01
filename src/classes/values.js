
import OhMyPropsValidator      from './validator.js';
import { OhMyPropsValueError } from './errors.js';
import OhMyPropsType           from './type.js';

export default class OhMyPropsValues extends OhMyPropsType {
	#validator;

	constructor(schema) {
		super(
			'',
			null,
			(value) => this.#cast(value),
		);

		this.#validator = schema instanceof OhMyPropsType ? schema : new OhMyPropsValidator(schema);
	}

	#cast(values_list) {
		const result = [];

		let index = 0;
		for (const value of values_list) {
			try {
				result.push(
					this.#validator.cast(value),
				);
			}
			catch (error) {
				if (error instanceof OhMyPropsValueError) {
					error.index = index;
				}

				throw error;
			}

			index++;
		}

		return result;
	}
}
