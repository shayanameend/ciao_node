export function generateOTP(digit: number): string {
	const numbers = "0123456789";
	const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const characters = numbers + alphabets;

	let OTP = "";

	for (let i = 0; i < digit; i++) {
		const index = Math.floor(Math.random() * characters.length);
		OTP += characters[index];
	}

	return OTP;
}
