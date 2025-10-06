import Message from "../models/Message.js";

// Create a new message
export const createMessage = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    const newMessage = new Message({
      name,
      email,
      phone,
      message,
    });

    const savedMessage = await newMessage.save();
    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: savedMessage,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all messages with pagination, search, and unread count
export const getMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const skip = page * limit;

    // Count total messages and unread messages
    const [total] = await Promise.all([Message.countDocuments({})]);

    const totalPages = Math.ceil(total / limit);

    const messages = await Message.find({})
      .lean()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    res.status(200).json({
      success: true,
      messages,
      total,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a message
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Mark message as read
// Search messages by name, email, or phone
export const searchMessages = async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 50;
    const skip = page * limit;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ],
    };

    const [messages, total] = await Promise.all([
      Message.find(searchQuery).sort({ createdAt: -1 }).limit(limit).skip(skip),
      Message.countDocuments(searchQuery),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      messages,
      total,
      totalPages,
      currentPage: page,
      searchQuery: query,
    });
  } catch (err) {
    console.error("Error searching messages:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: message,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
