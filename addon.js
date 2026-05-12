const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const manifest = {
    id: "com.justin.sports",
    version: "1.0.0",
    name: "Justin Sports",
    description: "Watch live sports",
    resources: ["catalog", "stream", "meta"],
    types: ["tv"],
    catalogs: [
        {
            type: "tv",
            id: "live-sports",
            name: "Live Sports"
        }
    ]
};

const builder = new addonBuilder(manifest);

async function getMatches() {
    const response = await fetch("https://api.watchfooty.st/api/v1/matches/live");

    return await response.json();
}

builder.defineCatalogHandler(async () => {

    const matches = await getMatches();

    const metas = matches.map(match => ({
        id: String(match.matchId),
        type: "tv",
        name: match.title,
        poster: match.poster,
        posterShape: "landscape"
    }));

    return { metas };
});

builder.defineMetaHandler(async ({ id }) => {

    const matches = await getMatches();

    const match = matches.find(m => String(m.matchId) === id);

    if (!match) {
        return { meta: null };
    }

    return {
        meta: {
            id: String(match.matchId),
            type: "tv",
            name: match.title,
            poster: match.poster,
            description: match.league || "Live sports"
        }
    };
});

builder.defineStreamHandler(async ({ id }) => {

    const matches = await getMatches();

    const match = matches.find(m => String(m.matchId) === id);

    if (!match || !match.streams) {
        return { streams: [] };
    }

    const streams = match.streams.map(stream => ({
        title: `${stream.quality} ${stream.language}`,
        url: stream.url
    }));

    return { streams };
});

const port = process.env.PORT || 7000;

serveHTTP(builder.getInterface(), { port });

console.log("Addon running on port " + port);