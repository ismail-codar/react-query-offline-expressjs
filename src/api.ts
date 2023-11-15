const baseUrl = "http://localhost:3020";

export const fetchData = (id) =>
  fetch(baseUrl + `/largedata/${id}`, {}).then((response) => response.json());

export const fetchLargeData = () =>
  fetch(baseUrl + "/largedata", {}).then((response) => response.json());

export const updateData = (id, comment) =>
  fetch(baseUrl + `/largedata/${id}`, {
    method: "POST",
    body: JSON.stringify({ comment }),
    headers: {
      "Content-Type": " application/json",
    },
  }).then((response) => response.json());
