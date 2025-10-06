import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log("mongo db connected <_>", conn.connection.host);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
// };
// import mongoose from "mongoose";

// let isConnected = false; // علشان نتأكد إننا مش هنعمل connect كل مرة

// export const connectDB = async () => {
//   if (isConnected) {
//     return; // لو متوصل خلاص، متعملش connect تاني
//   }

//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URL, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     isConnected = true;
//     console.log("✅ MongoDB connected:", conn.connection.host);
//   } catch (err) {
//     console.error("❌ MongoDB connection error:", err);
//   }
// };
