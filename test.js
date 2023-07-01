/* eslint-disable unicorn/prevent-abbreviations */
/* eslint-disable max-nested-callbacks */

import {
	strictEqual,
	notStrictEqual,
	deepStrictEqual,
	throws         } from 'node:assert/strict';
import {
	describe,
	it             } from 'mocha';

import {
	createValidator,
	createObjectValidator,
	createArrayValidator,
	createType,
	createMultiTypeValidator,
	OhMyPropsValueError,
	OhMyPropsInvalidValueError } from './src/main.js';

describe('type validation', () => {
	describe('undefined value', () => {
		it('default value is not set', () => {
			strictEqual(
				createValidator({
					type: String,
				}).test(),
				false,
			);
		});
		it('value is optional, default value not specified', () => {
			strictEqual(
				createValidator({
					type: String,
					optional: true,
				}).cast(),
				null,
			);
		});
		it('default value is null, but null is NOT allowed', () => {
			strictEqual(
				createValidator({
					type: String,
					default: null,
				}).test(),
				false,
			);
		});
		it('default value is null, but null is allowed', () => {
			strictEqual(
				createValidator({
					type: String,
					optional: true,
					default: null,
				}).test(),
				true,
			);
		});
	});
	describe('types', () => {
		describe('string', () => {
			it('value is string', () => {
				strictEqual(
					createValidator({
						type: String,
					}).test(
						'lorem ipsum',
					),
					true,
				);
			});
			it('value is NOT string', () => {
				strictEqual(
					createValidator({
						type: String,
					}).test(
						123,
					),
					false,
				);
			});
			it('value is NOT string, but casting is allowed', () => {
				strictEqual(
					createValidator({
						type: String,
						cast: true,
					}).test(
						123,
					),
					true,
				);
			});
		});

		describe('number', () => {
			it('value is number', () => {
				strictEqual(
					createValidator({
						type: Number,
					}).test(
						-123.456,
					),
					true,
				);
			});
			it('value is NOT number', () => {
				strictEqual(
					createValidator({
						type: Number,
					}).test(
						'-123.456',
					),
					false,
				);
			});
			it('value is NOT number, but casting is allowed', () => {
				strictEqual(
					createValidator({
						type: Number,
						cast: true,
					}).test(
						'-123.456',
					),
					true,
				);
			});
		});

		describe('boolean', () => {
			it('value is boolean', () => {
				strictEqual(
					createValidator({
						type: Boolean,
					}).test(
						true,
					),
					true,
				);
			});
			it('value is NOT boolean', () => {
				strictEqual(
					createValidator({
						type: Boolean,
					}).test(
						Symbol(''),
					),
					false,
				);
			});
			describe('value is NOT number, but casting is allowed', () => {
				const validator = createValidator({
					type: Boolean,
					cast: true,
				});

				it('0', () => {
					strictEqual(
						validator.cast('0'),
						false,
					);
				});
				it('false', () => {
					strictEqual(
						validator.cast('false'),
						false,
					);
				});

				it('1', () => {
					strictEqual(
						validator.cast('1'),
						true,
					);
				});
				it('true', () => {
					strictEqual(
						validator.cast('true'),
						true,
					);
				});
			});
		});

		describe('array', () => {
			const validator = createValidator({
				type: Array,
			});

			it('value is array', () => {
				strictEqual(
					validator.test(
						[ 1, 2, 3 ],
					),
					true,
				);
			});
			it('value is NOT array', () => {
				strictEqual(
					validator.test(
						Symbol(''),
					),
					false,
				);
			});

			describe('array with deep validation', () => {
				const deep_validator = createArrayValidator({
					type: String,
					validator: (value) => value.length <= 10,
				});
				it('full set of values', () => {
					deepStrictEqual(
						deep_validator.cast(
							[ 'lorem', 'ipsum' ],
						),
						[ 'lorem', 'ipsum' ],
					);
				});
				it('value of wrong type', () => {
					throws(() => {
						deep_validator.cast(
							[ 123 ],
						);
					});
				});
				it('invalid value', () => {
					throws(() => {
						deep_validator.cast(
							[ 'lorem ipsum dolor sit amet' ],
						);
					});
				});
			});
		});

		describe('object', () => {
			const validator = createValidator({
				type: Object,
			});

			it('value is an object', () => {
				strictEqual(
					validator.test(
						{},
					),
					true,
				);
			});
			it('value is NOT an object', () => {
				strictEqual(
					validator.test(
						[],
					),
					false,
				);
				strictEqual(
					validator.test(
						Symbol(''),
					),
					false,
				);
			});

			describe('object with keys validation', () => {
				const validator = createValidator({
					type: Object,
					keys: {
						type: String,
						validator: (value) => value.length <= 10,
					},
				});

				it('normal keys', () => {
					validator.cast(
						{
							foo: 'lorem',
							bar: 'ipsum',
						},
					);
				});
				it('invalid key', () => {
					throws(() => {
						validator.cast(
							{
								foo: 'lorem',
								veryverylongkey: 'ipsum',
							},
						);
					});
				});
			});

			describe('object with values validation', () => {
				const validator = createValidator({
					type: Object,
					values: {
						type: String,
						cast: true,
						validator: (value) => value.length <= 10,
					},
				});

				it('normal values', () => {
					deepStrictEqual(
						validator.cast(
							{
								foo: 'lorem',
								bar: 123,
							},
						),
						{
							foo: 'lorem',
							bar: '123',
						},
					);
				});
				it('invalid value', () => {
					throws(() => {
						validator.cast(
							{
								foo: 'lorem',
								bar: 'ipsum dolor sit amet',
							},
						);
					});
				});
			});

			describe('object with entries validation', () => {
				const deep_validator = createObjectValidator({
					foo: {
						type: String,
					},
					bar: {
						type: String,
						default: 'ipsum',
					},
				});
				it('full set of keys', () => {
					deepStrictEqual(
						deep_validator.cast(
							{
								foo: 'lorem',
								bar: 'ipsum',
							},
						),
						{
							foo: 'lorem',
							bar: 'ipsum',
						},
					);
				});
				it('mising key with default value', () => {
					deepStrictEqual(
						deep_validator.cast(
							{
								foo: 'lorem',
							},
						),
						{
							foo: 'lorem',
							bar: 'ipsum',
						},
					);
				});
				it('mising key with NO default', () => {
					throws(() => {
						deep_validator.cast(
							{
								bar: 'ipsum',
							},
						);
					});
				});
				it('extra key', () => {
					throws(() => {
						deep_validator.cast(
							{
								foo: 'lorem',
								bar: 'ipsum',
								baz: true,
							},
						);
					});
				});
			});
		});

		describe('class', () => {
			class Foo {}

			const validator = createValidator({
				type: Foo,
			});

			it('value is an instance of class', () => {
				strictEqual(
					validator.test(
						new Foo(),
					),
					true,
				);
			});
			it('value is NOT an instance of class', () => {
				strictEqual(
					validator.test(
						0,
					),
					false,
				);
			});

			it('validator set to type of class and cast options is passed', () => {
				throws(
					() => {
						createValidator({
							type: Foo,
							cast: true,
						});
					},
					Error,
				);
			});
		});

		describe('comma-separated set of numbers', () => {
			const TYPE_COMMA_SEPARATED_SET_OF_NUMBERS = createType(
				'COMMA_SEPARATED_SET_OF_NUMBERS',
				(value) => {
					if (value instanceof Set !== true) {
						return false;
					}

					for (const element of value) {
						if (typeof element !== 'number' || Number.isNaN(element)) {
							return false;
						}
					}

					return true;
				},
				(value) => {
					if (typeof value === 'string') {
						value = new Set(
							value.split(',').map((value) => Number.parseFloat(value)),
						);

						if (value.has(Number.NaN) === false) {
							return value;
						}
					}

					throw new OhMyPropsInvalidValueError(value);
				},
			);

			const TEST_VALUE = '1,2,-4,1.645,2';

			it('casting', () => {
				const validator = createValidator({
					type: TYPE_COMMA_SEPARATED_SET_OF_NUMBERS,
					cast: true,
				});

				const result = validator.cast(TEST_VALUE);

				notStrictEqual(result, null);
				strictEqual(result.size, 4);
				strictEqual(
					[ ...result ].sort((a, b) => a - b).join(','),
					'-4,1,1.645,2',
				);
			});

			it('additional validator', () => {
				const validator = createValidator({
					type: TYPE_COMMA_SEPARATED_SET_OF_NUMBERS,
					cast: true,
					validator(value) {
						for (const el of value) {
							if (Number.isInteger(el) !== true) {
								return false;
							}
						}

						return true;
					},
				});

				strictEqual(
					validator.test(TEST_VALUE),
					false,
				);

				strictEqual(
					validator.test('1,2,-4,1'),
					true,
				);
			});
		});

		describe('multitype', () => {
			it('multitype creation from other validators/types', () => {
				createMultiTypeValidator(
					createValidator({ type: String }),
					{ type: Number },
				);
			});

			const validator = createMultiTypeValidator(
				{
					type: String,
					validator: (value) => value.length <= 10,
				},
				{
					type: Object,
					keys: {
						type: String,
						validator: (value) => /[^\dA-Z_]/.test(value) === false,
					},
					values: {
						type: String,
						validator: (value) => value.length <= 10,
					},
					contentValidator: (value) => Object.keys(value).length === 1,
				},
			);

			it('value of type String', () => {
				strictEqual(
					validator.test(
						'lorem',
					),
					true,
				);
			});
			it('value of type Object', () => {
				strictEqual(
					validator.test(
						{
							FOO: 'lorem',
						},
					),
					true,
				);
			});
			describe('NOT valid value of type Object', () => {
				it('no properties', () => {
					strictEqual(
						validator.test(
							{},
						),
						false,
					);
				});
				it('more than one property', () => {
					strictEqual(
						validator.test(
							{
								FOO: 'lorem',
								BAR: 'ipsum',
							},
						),
						false,
					);
				});
				it('invalid key', () => {
					strictEqual(
						validator.test(
							{
								foo: 'lorem',
							},
						),
						false,
					);
				});
				it('invalid value', () => {
					strictEqual(
						validator.test(
							{
								FOO: 'lorem ipsum dolor sit amet',
							},
						),
						false,
					);
				});
			});
			it('valut does not match any type', () => {
				strictEqual(
					validator.test(
						[ 1, 2, 3 ],
					),
					false,
				);
			});
		});
	});
});

describe('error validation', () => {
	const entries_validator = createValidator({
		type: Object,
		entries: {
			foo: {
				type: Number,
				cast: true,
				validator: (value) => value > 0,
			},
		},
	});

	describe('root value', () => {
		it('of a wrong type', () => {
			throws(
				() => {
					entries_validator.cast(0);
				},
				(error) => {
					// console.error(error);
					strictEqual(error instanceof OhMyPropsValueError, true);
					strictEqual(error.message.includes('Value itself is not valid'), true);
					return true;
				},
			);
		});
	});

	describe('entries', () => {
		it('$.foo is missing', () => {
			throws(
				() => {
					entries_validator.cast({});
				},
				(error) => {
					// console.error(error);
					strictEqual(error instanceof OhMyPropsValueError, true);
					strictEqual(error.message.includes('Key foo of the object itself is missing'), true);
					return true;
				},
			);
		});

		it('$.foo cannot be casted', () => {
			throws(
				() => {
					entries_validator.cast({
						foo: 'lorem ipsum dolor sit amet',
					});
				},
				(error) => {
					// console.error(error);
					strictEqual(error instanceof OhMyPropsValueError, true);
					strictEqual(error.message.includes('Value on path $.foo is not valid'), true);
					return true;
				},
			);
		});

		it('root value has extra key', () => {
			throws(
				() => {
					entries_validator.cast({
						foo: 123,
						bar: 456,
					});
				},
				(error) => {
					// console.error(error);
					strictEqual(error instanceof OhMyPropsValueError, true);
					strictEqual(error.message.includes('Key bar of the object itself is not allowed to be present'), true);
					return true;
				},
			);
		});
	});

	const key_value_validator = createValidator({
		type: Object,
		keys: {
			type: String,
			validator: (value) => value.length <= 10,
		},
		values: {
			type: Object,
			entries: {
				foo: {
					type: Number,
					cast: true,
					validator: (value) => value > 0,
				},
			},
		},
	});

	describe('keys', () => {
		it('invalid key on the root object', () => {
			throws(
				() => {
					key_value_validator.cast({
						toolongkeydefinitelylongerthantencharacters: 123,
					});
				},
				(error) => {
					// console.error(error);
					strictEqual(error instanceof OhMyPropsValueError, true);
					strictEqual(error.message.includes('Key toolongkeydefinitelylongerthantencharacters of the object itself is not valid'), true);
					return true;
				},
			);
		});

		it('invalid entry on the nested object', () => {
			throws(
				() => {
					key_value_validator.cast({
						example: {
							foo: 'notanumberatall',
						},
					});
				},
				(error) => {
					// console.error(error);
					strictEqual(error instanceof OhMyPropsValueError, true);
					strictEqual(error.message.includes('Value on path $.example.foo is not valid'), true);
					return true;
				},
			);
		});

		it('extra key on the nested object', () => {
			throws(
				() => {
					key_value_validator.cast({
						example: {
							foo: 123,
							bar: 456,
						},
					});
				},
				(error) => {
					// console.error(error);
					strictEqual(error instanceof OhMyPropsValueError, true);
					strictEqual(error.message.includes('Key bar of the object on path $.example is not allowed to be present'), true);
					return true;
				},
			);
		});
	});

	describe('values', () => {
		it('invalid value on the root object', () => {
			throws(
				() => {
					key_value_validator.cast({
						example: 123,
					});
				},
				(error) => {
					// console.error(error);
					strictEqual(error instanceof OhMyPropsValueError, true);
					strictEqual(error.message.includes('Value on path $.example is not valid'), true);
					return true;
				},
			);
		});
	});
});
