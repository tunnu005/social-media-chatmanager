import { User, Messages} from 'buzzy-schemas'


export const SendMessage = async (req, res) => {
    try {
      const { receiverId, message } = req.body;
  
      // Ensure all fields are present
      if (!senderId || !receiverId || !message) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      // Create a new message instance
      const newMessage = new Messages({
        senderId,
        receiverId,
        message,
      });
  
      // Save the message to the database
      await newMessage.save();
  
      // Send a success response
      res.status(201).json({ message: "Message sent successfully", newMessage });
    } catch (error) {
      console.error("Error saving message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }


export const getMessage = async (req, res) => {
    const { user1, user2 } = req.params;
    // console.log("getMessage user",user1,user2)
    const messages = await Messages.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    }).sort({ timestamp: 1 });
    // console.log("message at getMessage : ",messages)
    res.json(messages);
  }


  export const getUserFollow = async (req, res) => {
    try {
      const user = await User.findById(req.userId)
        .populate("following", "username profilePic")
        .populate("followers", "username profilePic");
  
      if (!user) return res.status(404).json({ message: "User not found" });
  
      // Merge `followers` and `following`, and remove duplicates
      const union = [...user.followers, ...user.following].filter(
        (value, index, self) =>
          index === self.findIndex((t) => t._id.toString() === value._id.toString())
      );
  
      // console.log("Union of followers and following:", union);
  
      return res.status(200).json(union);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
  

  export const SendMessageSocket = async(senderId,receiverId,message) =>{
    try {
      
      // Ensure all fields are present
      if (!senderId || !receiverId || !message) {
        console.log("all fields required");
        return
      }
  
      // Create a new message instance
      const newMessage = new Messages({
        senderId,
        receiverId,
        message,
      });
  
      // Save the message to the database
      await newMessage.save();
  
      // Send a success response
      // res.status(201).json({ message: "Message sent successfully", newMessage });
    } catch (error) {
      console.error("Error saving message:", error);
      // res.status(500).json({ error: error });
    }
  }