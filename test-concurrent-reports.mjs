
const API_URL = "http://localhost:5000/api/v1/posts/6afb086c946e547f0c016165/report";

// Paste the access token of the same authenticated user.
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWI1MDVhNjIyMWNjZDQxMGZhZTY5OTUiLCJpYXQiOjE3OTUwMzE2NTMsImV4cCI6MTc5NTAzMjU1M30.dPspKGjzKRxhsH05-thTex05eQV7LdEskMZmmRbEVkc";

const sendReport = async (number) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        reason: "spam",
      }),
    });

    const data = await response.json();

    return {
      request: number,
      status: response.status,
      response: data,
    };
  } catch (error) {
    return {
      request: number,
      error: error.message,
    };
  }
};

const results = await Promise.all([
  sendReport(1),
  sendReport(2),
]);

console.log("CONCURRENT REPORT TEST RESULTS:");
console.dir(results, { depth: null });
