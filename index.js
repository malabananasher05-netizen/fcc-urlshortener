
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const dns = require('dns');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));

// Serve static files
app.use('/public', express.static(`${process.cwd()}/public`));

// Homepage
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Temporary storage for shortened URLs
const urlDatabase = [];
let nextShortUrl = 1;

// Create a shortened URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  let parsedUrl;

  // Step 1: Check the URL format
  try {
    parsedUrl = new URL(originalUrl);

    if (
      parsedUrl.protocol !== 'http:' &&
      parsedUrl.protocol !== 'https:'
    ) {
      return res.json({ error: 'invalid url' });
    }
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  // Step 2: Check that the hostname exists
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Step 3: Check for an existing shortened URL
    const existing = urlDatabase.find(
      item => item.original_url === originalUrl
    );

    if (existing) {
      return res.json(existing);
    }

    // Step 4: Create a new shortened URL
    const newUrl = {
      original_url: originalUrl,
      short_url: nextShortUrl++
    };

    urlDatabase.push(newUrl);

    res.json(newUrl);
  });
});

// Redirect a shortened URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = Number(req.params.short_url);

  const foundUrl = urlDatabase.find(
    item => item.short_url === shortUrl
  );

  if (!foundUrl) {
    return res.json({ error: 'invalid url' });
  }

  res.redirect(foundUrl.original_url);
});

// Start server
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
