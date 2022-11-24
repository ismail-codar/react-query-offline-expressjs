import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { faker } from "@faker-js/faker";

const largedata = [];

for (let i = 0; i < 50000; i++) {
  largedata.push({
    id: i,
    title: faker.name.fullName(),
    comment: Math.random().toString(36),
  });
}

const app = express();
app.use(bodyParser.json());
app.use(cors());

const port = 3020;

app.get("/largedata", (req, res, ctx) => {
  console.log("loading...");
  setTimeout(() => {
    res.json({
      ts: Date.now(),
      largedata: largedata.map(({ id, title, comment }) => ({
        id,
        title,
        comment,
      })),
    });
  }, 15000);
});

app.get("/largedata/:id", (req, res, ctx) => {
  const { id } = req.params;

  const item = largedata.find((item) => item.id === id);
  if (!item) {
    res.status(404).send(`Data with id ${id} not found`);
  }
  res.json({
    ts: Date.now(),
    item,
  });
});

app.post("/largedata/:id", (req, res, ctx) => {
  const { id } = req.params;
  const { comment } = req.body as any;

  largedata.forEach((item) => {
    if (item.id === id) {
      item.comment = comment.toUpperCase();
    }
  });

  res.json({
    message: `Successfully updated item ${id}`,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
