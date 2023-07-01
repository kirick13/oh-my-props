
const regexp_plain_key = /^[_a-z]\w*$/i;
const regexp_number = /^\d+$/;

function keyToString(key) {
	if (regexp_plain_key.test(key)) {
		return `.${key}`;
	}
	if (regexp_number.test(key)) {
		return `[${key}]`;
	}

	return `['${key}']`;
}

export class OhMyPropsValueError extends TypeError {
	constructor(value) {
		super();
		this.value = value;
	}

	#call_chain = [];
	get call_path() {
		return this.#call_chain.length > 0 ? `on path $${this.#call_chain.join('')}` : 'itself';
	}

	addKey(key) {
		this.#call_chain.unshift(
			keyToString(key),
		);

		return this;
	}
}
export class OhMyPropsInvalidValueError extends OhMyPropsValueError {
	get message() {
		return `Value ${this.call_path} is not valid.`;
	}
}
export class OhMyPropsMissingValueError extends OhMyPropsValueError {
	get message() {
		return `Value ${this.call_path} is missing.`;
	}
}
export class OhMyPropsInvalidKeyError extends OhMyPropsValueError {
	constructor(error) {
		super(error.value);
		this.error = error;
	}

	get message() {
		return `Key ${this.value} of the object ${this.call_path} is not valid.`;
	}
}
export class OhMyPropsMissingKeyError extends OhMyPropsValueError {
	get message() {
		return `Key ${this.value} of the object ${this.call_path} is missing.`;
	}
}
export class OhMyPropsExtraKeyError extends OhMyPropsValueError {
	get message() {
		return `Key ${this.value} of the object ${this.call_path} is not allowed to be present.`;
	}
}
