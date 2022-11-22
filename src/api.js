import ky from "ky";

const baseUrl = "http://localhost:3020";

export const fetchMovie = (id) => ky.get(baseUrl + `/movies/${id}`).json();
export const fetchMovies = () => ky.get(baseUrl + "/movies").json();
export const updateMovie = (id, comment) =>
  ky.post(baseUrl + `/movies/${id}`, { json: { comment } }).json();
