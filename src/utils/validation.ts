import type * as zod from "zod";

interface ValidateProps<T> {
	schema: zod.ZodType<T>;
	data: unknown;
}

export function validate<T>({ schema, data }: ValidateProps<T>): T {
	return schema.parse(data);
}
