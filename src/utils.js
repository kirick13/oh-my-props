
export function hasOwnProperty(target, key) {
	return Object.prototype.hasOwnProperty.call(target, key);
}

export function isPlainObject(value) {
	return typeof value === 'object' && value !== null && value.constructor.name === 'Object';
}
