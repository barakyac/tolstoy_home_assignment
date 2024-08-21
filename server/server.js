const fs = require('fs');
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(express.json());
app.use(cookieParser());



app.use(cors({
    origin: 'http://localhost:3000', // Specify the frontend origin
    methods: 'POST',
    credentials: true, // Allow cookies to be sent
}));

// app.use(csurf({ cookie: true })); // this line is the problem

const limiter = rateLimit({
    windowMs: 1000, // 1 second window
    max: 5, // limit each IP to 5 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again later.',
    handler: (req, res, /*next*/) => {
        console.log(`Rate limit exceeded: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests',
            message: 'You have exceeded the 5 requests in 1 second limit!',
        });
    }
});

// Apply the rate limiter to all requests
app.use(limiter);

app.post('/fetch-metadata', async (req, res) => {

    const urls = req.body.urls;

    if (!urls || !Array.isArray(urls)) {
        console.log("There should be at least 3 URLs.");
        return res.status(400).json({ error: 'There should be at least 3 URLs.' });
    }

    if (urls.length < 3){ //|| urls.length > 5) {
        console.log("Please provide at least 3 URLs.");
        return res.status(400).json({ error: 'Please provide at least 3 URLs.' });
    }

    const results = await Promise.all(urls.map(async (url) => {
        try {
            const response = await axios.get(url, { timeout: 5000 });
            const html = response.data;
            const $ = cheerio.load(html);

            const title = $('head > title').text() || 'No title available';
            const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || 'No description available';
            const image = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || 'https://via.placeholder.com/150';

            return {
                url,
                title,
                description,
                image,
            };
        } catch (error) {
            return {
                url,
                error: 'Please check the URL or try again later.',
            };
        }
    }));

    // Save the results to a JSON file for debugging
    saveJsonToFile('metadata-debug.json', results);

    res.json(results);
});

function saveJsonToFile(filename, jsonData) {
    fs.writeFile(filename, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        } else {
            console.log(`Data successfully written to ${filename}.json`);
        }
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
