import Twit from "twit";

const twit = new Twit({
  consumer_key: "JTcCCM93LGLvexwWhk2c0f26K",
  consumer_secret: "NwPajK5drleOnQRd8fD63CYxF8hoe7R9lSQObBDGhRndnFJPPx",
  access_token: "1663143193-RcVAH1NwfVdCqUztoW748JLIzhaFjB6bgeUMMZb",
  access_token_secret: "rgxu7CGxxf6XRqmKa1N6ERmhjxvXrP0pVCNCzUKos2GTO",
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  strictSSL: true // optional - requires SSL certificates to be valid.
});

export default twit;
