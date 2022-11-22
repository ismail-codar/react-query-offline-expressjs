import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const movies = [
  {
    id: "1",
    title: "Guardians of the Galaxy",
    comment: "",
  },
  {
    id: "2",
    title: "Wall-E",
    comment: "",
  },
];

const app = express();
app.use(bodyParser.json());
app.use(cors());

const port = 3020;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/movies", (req, res, ctx) => {
  res.json({
    ts: Date.now(),
    movies: movies.map(({ id, title }) => ({ id, title })),
  });
});

app.get("/movies/:id", (req, res, ctx) => {
  const { id } = req.params;

  const movie = movies.find((movie) => movie.id === id);
  if (!movie) {
    res.status(404).send(`Movie with id ${id} not found`);
  }
  res.json({
    ts: Date.now(),
    movie,
  });
});

app.post("/movies/:id", (req, res, ctx) => {
  const { id } = req.params;
  const { comment } = req.body as any;

  movies.forEach((movie) => {
    if (movie.id === id) {
      movie.comment = comment.toUpperCase();
    }
  });

  res.json({
    message: `Successfully updated movie ${id}`,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
