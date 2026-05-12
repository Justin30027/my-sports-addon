const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const manifest = {
    id: "com.justin.sports",
    version: "1.0.0",
    name: "Justin Sports",
    description: "My first sports addon",
    resources: ["stream"],
    types: ["tv"],
    catalogs: [],
    idPrefixes: ["sports"]
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async ({ id }) => {

    const response = await fetch("https://api.watchfooty.st/api/v1/matches/live");

    const matches = await response.json();

    let streams = [];

    for (const match of matches) {

        if (match.streams) {

            for (const stream of match.streams) {

                streams.push({
                    title: match.title + " | " + stream.quality,
                    url: stream.url
                });

            }

        }

    }

    return { streams };

});

const port = process.env.PORT || 7000;

serveHTTP(builder.getInterface(), { port });

console.log("Addon running on port " + port);