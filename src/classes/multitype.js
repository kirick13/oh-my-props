
import {
	OhMyPropsValueError,
	OhMyPropsInvalidValueError } from './errors.js';
import OhMyPropsType             from './type.js';
import OhMyPropsValue            from './validator.js';

export default class OhMyPropsMultiValidator extends OhMyPropsType {
	constructor(...types) {
		for (const [ index, object ] of types.entries()) {
			if (object instanceof OhMyPropsType !== true) {
				types[index] = new OhMyPropsValue(object);
			}
		}

		super(
			'',
			null,
			(value) => {
				for (const type of types) {
					try {
						return type.cast(value);
					}
					catch (error) {
						if (error instanceof OhMyPropsValueError) {
							continue;
						}

						throw error;
					}
				}

				throw new OhMyPropsInvalidValueError(value);
			},
		);
	}
}
