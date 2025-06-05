import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { orderTranscript, chatHistory, menu } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `Before processing the main ordering logic, first determine if the customer's current statement contains any order-related intent by checking if it includes:
Menu item requests (food, drinks, sides)
Order modifications (size changes, additions, removals)
Order confirmations or completions ("that's all", "nothing else")
Questions about menu items or availability
Greetings that lead into ordering ("Hi, I'd like...")
If the transcription contains ONLY non-order content such as:
Background noise transcribed as random words
Conversations with passengers
Phone calls
Random utterances unrelated to ordering
Technical issues ("can you hear me?", "hello?" without ordering intent)
Then respond with: NO_ORDER_INTENT
If order-related content is detected, proceed to the main ordering logic below:

You are an AI drive-through attendant, converse with your customer using the steps below:
        
                1. Go through the menu below:
                ${menu}

                2. Determine what the customer wants based on this customer's statement:
                '${orderTranscript}'
                and your previous conversation with the customer:
                ${chatHistory}

                3. If the customer is just starting the conversation (i.e no chat history) or has not explicitly confirmed that the order is complete:
                    i. Determine if the item is available, and let the customer know if it is not available.
                    ii. Confirm if the customer would like any of the modifiers attached to the item, confirm the sizes or amount of servings/sequence if available'
                    iii. If the customer asks for items, always confirm that the customer does not want any other thing, even if you have done so before.
                        e.g. 'Customer: Add a mushroom topping to my pizza' you can respond with something like 'okay, is there anything else you'd like to add?'

                4. If the customer says something like "No that will be all", "Nothing else", "That's it", "No, thank you' or anything that CLEARLY confirms they do 
                    not want anything else, you must immediately end the conversation by telling them to proceed to the next window. 
                    Do NOT ask any further questions or reiterate the order.

                5. Do not return the transcription history, simple return your response, do not add the AI: or Customer: prefix.    
        `,
        },
      ],
    });
    const messageContent = response.choices[0].message.content;
    console.log({ messageContent }, 1);
    if (messageContent !== "NO_ORDER_INTENT") {
      try {
        const speech = await openai.audio.speech.create({
          model: "gpt-4o-mini-tts",
          voice: "coral",
          input: messageContent,
          instructions: "You are an AI drive-through attendant, speak in a cheerful and professional tone.",
          response_format: "mp3",
        });

        const buffer = Buffer.from(await speech.arrayBuffer());
        const audioBase64 = buffer.toString("base64");

        // Return both the text response and the audio data
        res.status(200).json({
          response: messageContent,
          audio: audioBase64,
        });
        console.log({ audioBase64 });
      } catch (speechError) {
        console.error("Speech generation error:", speechError);
        // If speech fails, still return the text response
        res.status(200).json({
          response: messageContent,
          speechError: speechError.message,
        });
      }
    } else {
      res.status(200).json({ response: "I'm sorry, I couldn't generate a response." });
    }
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: error.message });
  }
}
