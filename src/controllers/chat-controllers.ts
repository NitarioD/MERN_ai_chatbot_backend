import { NextFunction, Request, Response } from "express";
import User from "../models/User.js";
import OpenAI from "openai";
import { configureOpenAI } from "../config/openai-config.js";



export const generateChatCompletion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message } = req.body;

    // Add validation check
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const user = await User.findById(res.locals.jwtData.id);

    if (!user) {
      return res.status(401).json({ message: "User not registered OR Token malfunctioned" });
    }

    const config = configureOpenAI();
    const openai = new OpenAI({ apiKey: config.apiKey });


    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      ...user.chats.map(({ role, content }) => ({ role, content })),
      { role: "user", content: message },
    ];
    const paramsToBeSent: any = {
      messages,
      model: "gpt-3.5-turbo",
    }

    const chatCompletion: any = await openai.chat.completions.create(paramsToBeSent);

    // console.log("OpenAI API Response:", chatCompletion);

    if (chatCompletion.choices && chatCompletion.choices.length > 0) {
      const assistantMessage = {
        role: "assistant",
        content: chatCompletion.choices[0].message.content,
      };

      const userMessage = {
        role: "user",
        content: message,
      };

      user.chats.push(userMessage, assistantMessage); // Save both user and assistant messages
      //   console.log("User chats after adding messages:", user.chats);
      await user.save();

      return res.status(200).json({ chats: user.chats });
    } else {
      console.log("OpenAI response is invalid");
      return res.status(500).json({ message: "OpenAI response is invalid" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const sendChatsToUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //user token check
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }
    //prevent user from getting another user's chat in the database
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match");
    }
    return res.status(200).json({ message: "OK", chats: user.chats });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ message: "ERROR", cause: error.message });
  }
};

export const deleteChats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //user token check
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }
    //prevent user from deleting another user's chat in the database
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match");
      // @ts-ignore
      user.chats = [];
      await user.save();
    }
    return res.status(200).json({ message: "OK" });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ message: "ERROR", cause: error.message });
  }
};
