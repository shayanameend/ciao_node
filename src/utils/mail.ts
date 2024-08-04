import { CourierClient } from "@trycourier/courier";

const courier = new CourierClient({
  authorizationToken: "pk_test_TJC1FMJ46MMR6KJV308C8AC4CQBC",
});

export async function sendEmail({
  name,
  email,
  body,
}: {
  name: string;
  email: string;
  body: string;
}) {
  const { requestId } = await courier.send({
    message: {
      to: {
        data: {
          name,
        },
        email,
      },
      content: {
        title: "Hey {{name}} 👋",
        body,
      },
      routing: {
        method: "single",
        channels: ["email"],
      },
    },
  });
}
