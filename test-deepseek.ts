import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY || "",
});

async function test() {
  try {
    const result = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: 'Say hello in JSON format like {"message": "hello"}',
        },
      ],
      response_format: { type: "json_object" },
    });
    console.log("SUCCESS:", result.choices[0].message.content);
  } catch (e: any) {
    console.error("ERROR:", e.message);
    if (e.response) {
      console.error("API Error:", e.response.data);
    }
  }
}

test();
