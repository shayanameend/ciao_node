import type * as zod from "zod";

interface ValidateProps<T> {
	schema: zod.ZodType<T>;
	data: unknown;
}

interface ValidateReturns<T> {
	parsedData: T;
}

export function validate<T>({
	schema,
	data,
}: ValidateProps<T>): ValidateReturns<T> {
	const parsedData = schema.parse(data);

	return { parsedData };
}
