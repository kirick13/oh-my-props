
const assert = require('assert');
const { strictEqual, notStrictEqual, deepStrictEqual } = assert.strict;

const OhMyProps = require('.');
const isValid = (args_schema, args) => new OhMyProps().isValid();

describe('registrations', () => {
	it('new type', () => {
		OhMyProps.registerType(
			'COMMA_SEPARATED_SET_NUMBERS',
			value => {
				if (typeof value === 'string') {
					value = new Set(
						value
						.split(',')
						.map(a => Number.parseFloat(a)),
					);

					if (value.has(Number.NaN) === false) {
						return value;
					}
				}

				return null;
			},
		);
	});
	it('new validator', () => {
		OhMyProps.registerValidator(
			'SET_INTEGERS',
			value => {
				for (const el of value) {
					if (Number.isInteger(el) === false) {
						return false;
					}
				}
				return true;
			},
		);
	});
});

describe('type validation', () => {
	describe('undefined value', () => {
		it('default value is not set', () => {
			strictEqual(
				new OhMyProps({
					test: {
						type: String,
					},
				}).isValid({}),
				false,
			);
		});
		it('default value set as undefined', () => {
			strictEqual(
				new OhMyProps({
					test: {
						type: String,
						default: undefined,
					},
				}).isValid({}),
				false,
			);
		});
		it('default value is null, but null is NOT allowed', () => {
			strictEqual(
				new OhMyProps({
					test: {
						type: String,
						default: null,
					},
				}).isValid({}),
				false,
			);
		});
		it('default value is null, but null is allowed', () => {
			strictEqual(
				new OhMyProps({
					test: {
						type: String,
						default: null,
						is_nullable: true,
					},
				}).isValid({}),
				true,
			);
		});
	});
	describe('types', () => {
		describe('string', () => {
			it('value is string', () => {
				strictEqual(
					new OhMyProps({
						test: {
							type: String,
						},
					}).isValid({
						test: 'lorem ipsum',
					}),
					true,
				);
			});
			it('value is NOT string', () => {
				strictEqual(
					new OhMyProps({
						test: {
							type: String,
						},
					}).isValid({
						test: 123,
					}),
					false,
				);
			});
			it('value is NOT string, but casting is allowed', () => {
				strictEqual(
					new OhMyProps({
						test: {
							type: String,
							type_cast: true,
						},
					}).isValid({
						test: 123,
					}),
					true,
				);
			});
		});

		describe('number', () => {
			it('value is number', () => {
				strictEqual(
					new OhMyProps({
						test: {
							type: Number,
						},
					}).isValid({
						test: -123.456,
					}),
					true,
				);
			});
			it('value is NOT number', () => {
				strictEqual(
					new OhMyProps({
						test: {
							type: Number,
						},
					}).isValid({
						test: '-123.456',
					}),
					false,
				);
			});
			it('value is NOT number, but casting is allowed', () => {
				strictEqual(
					new OhMyProps({
						test: {
							type: Number,
							type_cast: true,
						},
					}).isValid({
						test: '-123.456',
					}),
					true,
				);
			});
		});

		describe('boolean', () => {
			it('value is boolean', () => {
				strictEqual(
					new OhMyProps({
						test: {
							type: Boolean,
						},
					}).isValid({
						test: true,
					}),
					true,
				);
			});
			it('value is NOT boolean', () => {
				strictEqual(
					new OhMyProps({
						test: {
							type: Boolean,
						},
					}).isValid({
						test: Symbol(),
					}),
					false,
				);
			});
			describe('value is NOT number, but casting is allowed', () => {
				const validator = new OhMyProps({
					test: {
						type: Boolean,
						type_cast: true,
					},
				});

				it('0', () => {
					strictEqual(validator.transform({ test: '0' }).test, false);
				});
				it('false', () => {
					strictEqual(validator.transform({ test: 'false' }).test, false);
				});

				it('1', () => {
					strictEqual(validator.transform({ test: '1' }).test, true);
				});
				it('true', () => {
					strictEqual(validator.transform({ test: 'true' }).test, true);
				});
			});
		});

		describe('array', () => {
			it('value is array', () => {
				strictEqual(
					new OhMyProps({
						test: {
							type: Array,
						},
					}).isValid({
						test: [ 1, 2, 3 ],
					}),
					true,
				);
			});
			it('value is NOT array', () => {
				strictEqual(
					new OhMyProps({
						test: {
							type: Array,
						},
					}).isValid({
						test: Symbol(),
					}),
					false,
				);
			});
		});

		describe('object', () => {
			it('value is object', () => {
				strictEqual(
					new OhMyProps({
						test: {
							type: Object,
						},
					}).isValid({
						test: {},
					}),
					true,
				);
			});
			it('value is NOT object', () => {
				const validator = new OhMyProps({
					test: {
						type: Object,
					},
				});

				strictEqual(
					validator.isValid({
						test: [],
					}),
					true,
				);
				strictEqual(
					validator.isValid({
						test: Symbol(),
					}),
					false,
				);
			});
		});

		describe('class instance', () => {
			it('value is OhMyProps', () => {
				strictEqual(
					new OhMyProps({
						test: {
							type: OhMyProps,
						},
					}).isValid({
						test: new OhMyProps({}),
					}),
					true,
				);
			});
			it('value is NOT OhMyProps', () => {
				strictEqual(
					new OhMyProps({
						test: {
							type: OhMyProps,
						},
					}).isValid({
						test: Symbol(),
					}),
					false,
				);
			});
		});

		describe('comma-separated set of numbers', () => {
			const object = {
				test: '1,2,-4,1.645,2',
			};

			it('casting', () => {
				const result = new OhMyProps({
					test: {
						type: OhMyProps.type('COMMA_SEPARATED_SET_NUMBERS'),
						type_cast: true,
					},
				}).transform(object);

				notStrictEqual(result, null);
				strictEqual(result.test.size, 4);
				strictEqual(
					Array.from(result.test).sort((a, b) => a - b).join(','),
					'-4,1,1.645,2',
				);
			});

			it('validating with SET_INTEGERS', () => {
				const validator = new OhMyProps({
					test: {
						type: OhMyProps.type('COMMA_SEPARATED_SET_NUMBERS'),
						type_cast: true,
						validator: OhMyProps.validator('SET_INTEGERS'),
					},
				});

				strictEqual(
					validator.isValid(object),
					false,
				);

				strictEqual(
					validator.isValid({
						test: '1,2,-4,1',
					}),
					true,
				);
			});
		});
	});
});
