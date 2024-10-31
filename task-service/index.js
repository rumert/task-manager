const { app } = require("./src/server");
const { connectToMongoDB } = require("./src/utils/functions");

app.listen(4002, async () => {
  await connectToMongoDB();
  console.log('Task service listening on port 4002');
});