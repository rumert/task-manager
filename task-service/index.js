const { app } = require("./src/server");

app.listen(4002, async () => {
  console.log('Task service listening on port 4002');
});