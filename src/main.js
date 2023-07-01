
import OhMyPropsValidator from './classes/validator.js';

export { default as OhMyPropsType } from './classes/type.js';
export { default as OhMyPropsValidator } from './classes/validator.js';
export { default as OhMyPropsMultiValidator } from './classes/multitype.js';

export class OhMyPropsArrayValidator extends OhMyPropsValidator {
	constructor(options) {
		super({
			type: Array,
			values: options,
		});
	}
}

export class OhMyPropsObjectValidator extends OhMyPropsValidator {
	constructor(options) {
		super({
			type: Object,
			entries: options,
		});
	}
}

export class OhMyPropsSetValidator extends OhMyPropsValidator {
	constructor(options) {
		super({
			type: Set,
			values: options,
		});
	}
}

export class OhMyPropsMapValidator extends OhMyPropsValidator {
	constructor(options) {
		super({
			type: Map,
			entries: options,
		});
	}
}

export {
	OhMyPropsValueError,
	OhMyPropsInvalidValueError,
	OhMyPropsMissingValueError } from './classes/errors.js';
